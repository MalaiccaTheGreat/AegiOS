const { v4: uuidv4 } = require('uuid');
const { Document, DocumentSignature, User, sequelize } = require('../../models');
const documentSharing = require('./documentSharing');
const notificationService = require('./notificationService');
const fileStorage = require('./fileStorage');
const { signDocument, verifySignature } = require('../../utils/crypto');

class DocumentSigning {
  async requestSignature({ documentId, requesterId, signers, message = '' }) {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify document exists and user has permission
      const document = await Document.findByPk(documentId, { transaction });
      if (!document) {
        throw new Error('Document not found');
      }

      // Verify requester has permission to request signatures
      const { hasAccess } = await documentSharing.verifyAccess({
        documentId,
        userId: requesterId,
        requiredPermission: 'manage',
      });

      if (!hasAccess) {
        throw new Error('Permission denied');
      }

      // Create signature requests
      const signatureRequests = [];
      for (const { userId, email, order } of signers) {
        const requestId = uuidv4();
        const token = uuidv4();
        
        const signatureRequest = await DocumentSignature.create({
          id: requestId,
          documentId,
          signerId: userId,
          requestedById: requesterId,
          status: 'pending',
          token,
          signOrder: order,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }, { transaction });

        // Send notification to signer
        const signUrl = `${process.env.FRONTEND_URL}/sign/${token}`;
        
        await notificationService.sendNotification(userId, {
          type: 'signature_requested',
          title: 'Signature Required',
          message: `You've been requested to sign ${document.name}`,
          data: {
            documentId,
            requestId,
            signUrl,
            message,
          },
          channels: ['email', 'in_app'],
        });

        signatureRequests.push(signatureRequest);
      }

      await transaction.commit();
      return signatureRequests;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async signDocument({ token, userId, signatureData, ipAddress, userAgent }) {
    const transaction = await sequelize.transaction();
    
    try {
      // Find signature request
      const signatureRequest = await DocumentSignature.findOne({
        where: { token, status: 'pending' },
        include: [
          { model: Document, as: 'document' },
          { model: User, as: 'requestedBy' },
        ],
        transaction,
      });

      if (!signatureRequest) {
        throw new Error('Invalid or expired signature request');
      }

      // Verify signer (if user is logged in)
      if (userId && signatureRequest.signerId !== userId) {
        throw new Error('You are not authorized to sign this document');
      }

      // Verify it's the signer's turn (if using ordered signing)
      if (signatureRequest.signOrder > 1) {
        const previousSigner = await DocumentSignature.findOne({
          where: {
            documentId: signatureRequest.documentId,
            signOrder: signatureRequest.signOrder - 1,
            status: { [Op.ne]: 'completed' },
          },
          transaction,
        });

        if (previousSigner) {
          throw new Error('Previous signer has not signed the document yet');
        }
      }

      // Generate digital signature
      const signature = signDocument({
        documentId: signatureRequest.documentId,
        userId: signatureRequest.signerId || `anonymous-${ipAddress}`,
        timestamp: new Date(),
        data: signatureData,
      });

      // Update signature request
      await signatureRequest.update({
        status: 'completed',
        signedAt: new Date(),
        signature,
        ipAddress,
        userAgent,
        signatureData: JSON.stringify(signatureData),
      }, { transaction });

      // Generate signed document (could be a PDF with visible signature)
      const signedDocument = await this.generateSignedDocument(
        signatureRequest.document,
        signatureRequest,
        signatureData
      );

      // Store signed document
      const signedDocumentUrl = await fileStorage.uploadFile(signedDocument, {
        prefix: 'signed-documents',
        metadata: {
          originalName: `signed_${signatureRequest.document.name}`,
          documentId: signatureRequest.documentId,
          signatureRequestId: signatureRequest.id,
        },
      });

      // Update document with signed version if all signers have signed
      await this.updateDocumentAfterSigning(signatureRequest.documentId, transaction);

      // Notify document owner and other signers
      await this.notifyAfterSigning(signatureRequest, signedDocumentUrl);

      await transaction.commit();
      return { success: true, signedDocumentUrl };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async generateSignedDocument(document, signatureRequest, signatureData) {
    // This would generate a new version of the document with the signature applied
    // For PDFs, you might use a library like pdf-lib or pdfkit
    // For other formats, you might convert to PDF first or handle differently
    
    // Placeholder implementation - in a real app, you would:
    // 1. Download the original document
    // 2. Apply the signature (text, image, or digital certificate)
    // 3. Return the signed document buffer
    
    const signedContent = `SIGNED VERSION OF: ${document.name}\n\n` +
      `Document: ${document.name}\n` +
      `Signed by: ${signatureRequest.signerId || 'Anonymous'}\n` +
      `Signature: ${signatureData.signatureImage ? '[SIGNATURE IMAGE]' : '[DIGITAL SIGNATURE]'}\n` +
      `Date: ${new Date().toISOString()}\n` +
      `IP: ${signatureRequest.ipAddress}\n` +
      `\n--- ORIGINAL DOCUMENT ---\n`;
    
    return {
      buffer: Buffer.from(signedContent),
      originalname: `signed_${document.name}.txt`,
      mimetype: 'text/plain',
    };
  }

  async updateDocumentAfterSigning(documentId, transaction) {
    // Check if all signers have signed
    const [allSigned] = await DocumentSignature.findAndCountAll({
      where: {
        documentId,
        status: 'pending',
      },
      transaction,
    });

    if (allSigned === 0) {
      // All signers have signed, update document status
      await Document.update(
        { status: 'signed', lastSignedAt: new Date() },
        { where: { id: documentId }, transaction }
      );
    }
  }

  async notifyAfterSigning(signatureRequest, signedDocumentUrl) {
    // Notify document owner
    await notificationService.sendNotification(signatureRequest.requestedById, {
      type: 'document_signed',
      title: 'Document Signed',
      message: `${signatureRequest.signer?.name || 'A signer'} has signed ${signatureRequest.document.name}`,
      data: {
        documentId: signatureRequest.documentId,
        signerId: signatureRequest.signerId,
        signedDocumentUrl,
      },
    });

    // Notify next signer (if any)
    const nextSigner = await DocumentSignature.findOne({
      where: {
        documentId: signatureRequest.documentId,
        signOrder: signatureRequest.signOrder + 1,
        status: 'pending',
      },
      include: [{ model: User, as: 'signer' }],
    });

    if (nextSigner) {
      const signUrl = `${process.env.FRONTEND_URL}/sign/${nextSigner.token}`;
      
      await notificationService.sendNotification(nextSigner.signerId, {
        type: 'your_turn_to_sign',
        title: 'Your Turn to Sign',
        message: `It's your turn to sign ${signatureRequest.document.name}`,
        data: {
          documentId: signatureRequest.documentId,
          signUrl,
        },
        channels: ['email', 'in_app'],
      });
    }
  }

  async verifyDocumentSignature(documentId) {
    const signatures = await DocumentSignature.findAll({
      where: { documentId },
      include: [{ model: User, as: 'signer' }],
      order: [['signedAt', 'ASC']],
    });

    const verificationResults = [];
    let documentValid = true;
    
    for (const signature of signatures) {
      const isValid = verifySignature({
        documentId,
        userId: signature.signerId,
        timestamp: signature.signedAt,
        signature: signature.signature,
      });

      verificationResults.push({
        signer: signature.signer ? {
          id: signature.signer.id,
          name: signature.signer.name,
          email: signature.signer.email,
        } : null,
        signedAt: signature.signedAt,
        ipAddress: signature.ipAddress,
        valid: isValid,
        signatureData: JSON.parse(signature.signatureData || '{}'),
      });

      if (!isValid) {
        documentValid = false;
      }
    }

    return {
      documentId,
      valid: documentValid,
      signatures: verificationResults,
      verifiedAt: new Date(),
    };
  }
}

module.exports = new DocumentSigning();
