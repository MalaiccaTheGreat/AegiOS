const express = require('express');
const router = express.Router();
const multer = require('multer');
const fileStorage = require('../../services/shared/fileStorage');
const documentProcessor = require('../../services/shared/documentProcessor');
const { requireAuth } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { body, query } = require('express-validator');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, images, and text files are allowed.'));
    }
  },
});

// Upload a document
router.post(
  '/upload',
  requireAuth,
  upload.single('file'),
  validate([
    body('category').optional().isString(),
    body('metadata').optional().isObject(),
  ]),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { category, metadata = {} } = req.body;
      
      // Process the document
      const document = await documentProcessor.processDocument(req.file, {
        ...metadata,
        uploadedBy: req.user.id,
        category: category || 'other',
      });

      res.status(201).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Generate a pre-signed URL for direct upload
router.post(
  '/upload/url',
  requireAuth,
  validate([
    body('contentType').isString(),
    body('fileName').optional().isString(),
    body('metadata').optional().isObject(),
  ]),
  async (req, res, next) => {
    try {
      const { contentType, fileName, metadata = {} } = req.body;
      
      const uploadData = await fileStorage.generateUploadUrl({
        contentType,
        metadata: {
          ...metadata,
          uploadedBy: req.user.id,
          originalName: fileName || 'unnamed-file',
        },
      });

      res.json({
        success: true,
        data: uploadData,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get document metadata
router.get(
  '/:id/metadata',
  requireAuth,
  validate([
    query('storagePath').isString(),
  ]),
  async (req, res, next) => {
    try {
      const { storagePath } = req.query;
      const metadata = await fileStorage.getFileMetadata(storagePath);
      
      res.json({
        success: true,
        data: metadata,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Download a document
router.get(
  '/:id/download',
  requireAuth,
  validate([
    query('storagePath').isString(),
  ]),
  async (req, res, next) => {
    try {
      const { storagePath } = req.query;
      const metadata = await fileStorage.getFileMetadata(storagePath);
      
      // Generate a signed URL for the file
      const signedUrl = await fileStorage.generateSignedUrl(storagePath, {
        responseDisposition: `attachment; filename="${metadata.metadata.originalName || 'download'}"`,
      });
      
      res.redirect(signedUrl);
    } catch (error) {
      next(error);
    }
  }
);

// Generate a document from a template
router.post(
  '/generate',
  requireAuth,
  validate([
    body('templateName').isString(),
    body('data').isObject(),
  ]),
  async (req, res, next) => {
    try {
      const { templateName, data } = req.body;
      
      const document = await documentProcessor.createDocumentFromTemplate(templateName, {
        ...data,
        generatedBy: req.user.id,
      });
      
      res.status(201).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete a document
router.delete(
  '/:id',
  requireAuth,
  validate([
    query('storagePath').isString(),
  ]),
  async (req, res, next) => {
    try {
      const { storagePath } = req.query;
      
      // Verify user has permission to delete this document
      // This would typically involve checking ownership or permissions in your database
      
      await fileStorage.deleteFile(storagePath);
      
      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Search documents
router.get(
  '/',
  requireAuth,
  validate([
    query('q').optional().isString(),
    query('category').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ]),
  async (req, res, next) => {
    try {
      const { q, category, startDate, endDate, page = 1, limit = 20 } = req.query;
      
      // This would typically query your database
      // For now, we'll return a placeholder response
      
      res.json({
        success: true,
        data: {
          documents: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Extract text from a document
router.post(
  '/:id/extract-text',
  requireAuth,
  validate([
    query('storagePath').isString(),
  ]),
  async (req, res, next) => {
    try {
      const { storagePath } = req.query;
      
      // Download the file
      const buffer = await fileStorage.downloadFile(storagePath);
      
      // Process the document to extract text
      const file = {
        buffer,
        originalname: 'document',
        mimetype: 'application/octet-stream',
      };
      
      const { extractedText } = await documentProcessor.processDocument(file);
      
      res.json({
        success: true,
        data: {
          text: extractedText,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
