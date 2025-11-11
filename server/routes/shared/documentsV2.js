// File: server/routes/shared/documentsV2.js
const express = require('express');
const multer = require('multer');
const fileStorage = require('../../services/shared/fileStorage');
const documentProcessor = require('../../services/shared/documentProcessorV2');
const { requireAuth } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { body, query } = require('express-validator');
const cacheMiddleware = require('../../middleware/cache');
const { Op } = require('sequelize');
const { Document, DocumentVersion, sequelize } = require('../../models');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Cache configuration
const DOCUMENT_CACHE_TTL = 3600; // 1 hour
const DOCUMENT_LIST_CACHE_TTL = 300; // 5 minutes

// Helper function to generate cache key
const getCacheKey = (req) => {
  return `doc:${req.originalUrl}:${JSON.stringify(req.query)}:${req.user?.id || 'anon'}`;
};

// Upload and process document
router.post(
  '/upload',
  requireAuth,
  upload.single('file'),
  validate([
    body('category').optional().isString(),
    body('metadata').optional().isObject(),
    body('folderId').optional().isUUID(),
  ]),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { category, metadata = {}, folderId } = req.body;
      
      // Process the document
      const processedDoc = await documentProcessor.processDocument(req.file, {
        ...metadata,
        uploadedBy: req.user.id,
        category: category || 'other',
      });

      // Save to database
      const document = await sequelize.transaction(async (t) => {
        const doc = await Document.create({
          id: processedDoc.id,
          name: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          storagePath: processedDoc.storagePath,
          metadata: processedDoc.metadata,
          ownerId: req.user.id,
          folderId: folderId || null,
          status: 'processed',
        }, { transaction: t });

        await DocumentVersion.create({
          documentId: doc.id,
          version: 1,
          storagePath: processedDoc.storagePath,
          metadata: processedDoc.metadata,
          createdById: req.user.id,
        }, { transaction: t });

        return doc;
      });

      // Clear relevant caches
      req.app.get('cache').del(`user:${req.user.id}:documents:*`);

      res.status(201).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get document by ID
router.get(
  '/:id',
  requireAuth,
  cacheMiddleware(DOCUMENT_CACHE_TTL, getCacheKey),
  validate([
    query('includeText').optional().isBoolean().toBoolean(),
  ]),
  async (req, res, next) => {
    try {
      const { includeText = false } = req.query;
      const { id } = req.params;

      const document = await Document.findByPk(id, {
        include: [
          {
            model: DocumentVersion,
            as: 'versions',
            order: [['version', 'DESC']],
            limit: 1,
          },
        ],
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Check permissions
      if (document.ownerId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const result = document.toJSON();
      
      if (includeText) {
        // For large documents, consider streaming this or using a separate endpoint
        const text = await documentProcessor.extractText(document.storagePath);
        result.text = text;
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// List documents with pagination and filtering
router.get(
  '/',
  requireAuth,
  cacheMiddleware(DOCUMENT_LIST_CACHE_TTL, getCacheKey),
  validate([
    query('page').optional().isInt({ min: 1 }).default(1).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).default(20).toInt(),
    query('search').optional().isString(),
    query('category').optional().isString(),
    query('sortBy').optional().isIn(['name', 'createdAt', 'updatedAt', 'size']),
    query('sortOrder').optional().isIn(['asc', 'desc']).default('desc'),
    query('folderId').optional().isUUID(),
  ]),
  async (req, res, next) => {
    try {
      const {
        page,
        limit,
        search,
        category,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        folderId,
      } = req.query;

      const offset = (page - 1) * limit;
      const where = { ownerId: req.user.id };

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { '$metadata.keywords$': { [Op.contains]: [search.toLowerCase()] } },
        ];
      }

      if (category) {
        where.category = category;
      }

      if (folderId) {
        where.folderId = folderId;
      } else {
        where.folderId = { [Op.is]: null }; // Only root level if no folder specified
      }

      const { count, rows: documents } = await Document.findAndCountAll({
        where,
        limit,
        offset,
        order: [[sortBy, sortOrder.toUpperCase()]],
        attributes: [
          'id',
          'name',
          'mimeType',
          'size',
          'category',
          'metadata',
          'createdAt',
          'updatedAt',
          'folderId',
        ],
      });

      res.json({
        success: true,
        data: documents,
        pagination: {
          total: count,
          page,
          totalPages: Math.ceil(count / limit),
          limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update document metadata
router.patch(
  '/:id',
  requireAuth,
  validate([
    body('name').optional().isString().trim().notEmpty(),
    body('category').optional().isString(),
    body('metadata').optional().isObject(),
    body('folderId').optional().isUUID().or().equals('null'),
  ]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = {};

      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.category !== undefined) updates.category = req.body.category;
      if (req.body.metadata !== undefined) updates.metadata = req.body.metadata;
      if (req.body.folderId !== undefined) {
        updates.folderId = req.body.folderId === 'null' ? null : req.body.folderId;
      }

      const [updated] = await Document.update(updates, {
        where: {
          id,
          ownerId: req.user.id, // Only owner can update
        },
        returning: true,
      });

      if (!updated) {
        return res.status(404).json({ error: 'Document not found or access denied' });
      }

      // Clear relevant caches
      req.app.get('cache').del(`doc:${id}:*`);
      req.app.get('cache').del(`user:${req.user.id}:documents:*`);

      res.json({
        success: true,
        data: updated[1][0],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete document
router.delete(
  '/:id',
  requireAuth,
  async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      // Find document to delete
      const document = await Document.findOne({
        where: {
          id,
          ownerId: req.user.id, // Only owner can delete
        },
        transaction,
      });

      if (!document) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Document not found or access denied' });
      }

      // Delete from storage (soft delete)
      await fileStorage.deleteFile(document.storagePath);

      // Delete from database
      await Document.destroy({
        where: { id },
        transaction,
      });

      await transaction.commit();

      // Clear relevant caches
      req.app.get('cache').del(`doc:${id}:*`);
      req.app.get('cache').del(`user:${req.user.id}:documents:*`);

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
);

// Search document content
router.get(
  '/search/content',
  requireAuth,
  cacheMiddleware(300, getCacheKey),
  validate([
    query('q').isString().trim().notEmpty(),
    query('page').optional().isInt({ min: 1 }).default(1).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).default(10).toInt(),
  ]),
  async (req, res, next) => {
    try {
      const { q, page, limit } = req.query;
      const offset = (page - 1) * limit;

      // This is a simplified example - in a real app, you'd use a full-text search engine
      // like Elasticsearch or PostgreSQL's full-text search
      const { count, rows: documents } = await Document.findAndCountAll({
        where: {
          ownerId: req.user.id,
          [Op.or]: [
            { name: { [Op.iLike]: `%${q}%` } },
            { '$metadata.keywords$': { [Op.contains]: [q.toLowerCase()] } },
            // In a real app, you'd search the document content here
          ],
        },
        limit,
        offset,
        order: [['updatedAt', 'DESC']],
        attributes: ['id', 'name', 'mimeType', 'size', 'createdAt', 'updatedAt'],
      });

      res.json({
        success: true,
        data: documents,
        pagination: {
          total: count,
          page,
          totalPages: Math.ceil(count / limit),
          limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;