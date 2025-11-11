const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { Document, DocumentShare, User, sequelize } = require('../../models');
const notificationService = require('./notificationService');

class DocumentSharing {
  async shareDocument({ documentId, ownerId, recipients, permission = 'view', message = '' }) {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify document exists and user has permission
      const document = await Document.findByPk(documentId, { transaction });
      if (!document || document.ownerId !== ownerId) {
        throw new Error('Document not found or permission denied');
      }

      // Process each recipient
      const shares = [];
      for (const { userId, email } of recipients) {
        const shareId = uuidv4();
        
        // Create share record
        const share = await DocumentShare.create({
          id: shareId,
          documentId,
          sharedById: ownerId,
          sharedWithId: userId,
          permission,
          token: uuidv4(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }, { transaction });

        // Send notification
        await notificationService.sendNotification(userId, {
          type: 'document_shared',
          title: 'Document Shared With You',
          message: `You have been granted ${permission} access to ${document.name}`,
          data: {
            documentId,
            shareId,
            permission,
            message,
          },
        });

        shares.push(share);
      }

      await transaction.commit();
      return shares;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateShare({ shareId, userId, updates }) {
    const allowedUpdates = ['permission', 'expiresAt'];
    const validUpdates = Object.keys(updates).filter(key => allowedUpdates.includes(key));
    
    const [updated] = await DocumentShare.update(
      validUpdates.reduce((acc, key) => (acc[key] = updates[key], acc), {}),
      { 
        where: { 
          id: shareId,
          [Op.or]: [
            { sharedById: userId },
            { sharedWithId: userId, permission: 'owner' },
          ],
        },
        returning: true,
      }
    );

    if (!updated) {
      throw new Error('Share not found or permission denied');
    }

    return updated[1][0];
  }

  async revokeShare({ shareId, userId }) {
    const share = await DocumentShare.findByPk(shareId);
    
    if (!share || (share.sharedById !== userId && share.permission !== 'owner')) {
      throw new Error('Share not found or permission denied');
    }

    await share.destroy();
    
    // Notify user about revoked access
    await notificationService.sendNotification(share.sharedWithId, {
      type: 'document_access_revoked',
      title: 'Document Access Revoked',
      message: `Your access to the document has been revoked`,
      data: { documentId: share.documentId },
    });

    return true;
  }

  async listSharedDocuments(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await DocumentShare.findAndCountAll({
      where: { sharedWithId: userId },
      include: [
        {
          model: Document,
          as: 'document',
          include: [
            { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
          ],
        },
        {
          model: User,
          as: 'sharedBy',
          attributes: ['id', 'name', 'email'],
        },
      ],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        limit,
      },
    };
  }

  async verifyAccess({ documentId, userId, requiredPermission = 'view' }) {
    // Check if user is the owner
    const isOwner = await Document.count({
      where: { id: documentId, ownerId: userId },
    });
    
    if (isOwner) return { hasAccess: true, permission: 'owner' };

    // Check shared access
    const share = await DocumentShare.findOne({
      where: {
        documentId,
        sharedWithId: userId,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!share) return { hasAccess: false, permission: null };

    // Check permission level
    const permissionLevels = {
      view: 1,
      comment: 2,
      edit: 3,
      manage: 4,
    };

    const hasAccess = permissionLevels[share.permission] >= permissionLevels[requiredPermission];
    
    return {
      hasAccess,
      permission: share.permission,
      share,
    };
  }
}

module.exports = new DocumentSharing();
