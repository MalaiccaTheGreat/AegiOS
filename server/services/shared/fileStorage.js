const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');
const crypto = require('crypto')

class FileStorage {
  constructor() {
    this.storage = new Storage({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
    this.bucket = this.storage.bucket(process.env.GCS_BUCKET_NAME || 'aegios-documents');
    this.tempDir = path.join(process.cwd(), 'temp');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
      throw error;
    }
  }

  async uploadFile(file, options = {}) {
    const {
      prefix = 'uploads',
      makePublic = false,
      metadata = {},
      contentType = file.mimetype || mime.lookup(file.originalname) || 'application/octet-stream',
    } = options;

    const fileExt = path.extname(file.originalname).toLowerCase();
    const fileName = `${uuidv4()}${fileExt}`;
    const destination = prefix ? `${prefix}/${fileName}` : fileName;
    const filePath = path.join(this.tempDir, fileName);

    try {
      // Save file to temp directory
      await fs.writeFile(filePath, file.buffer);

      // Upload to Google Cloud Storage
      const [file] = await this.bucket.upload(filePath, {
        destination,
        metadata: {
          contentType,
          metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
            ...metadata,
          },
        },
      });

      // Make file public if requested
      if (makePublic) {
        await file.makePublic();
      }

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${encodeURIComponent(destination)}`;
      
      return {
        id: fileName,
        originalName: file.originalname,
        fileName,
        mimeType: contentType,
        size: file.metadata.size,
        storagePath: `gs://${this.bucket.name}/${destination}`,
        publicUrl: makePublic ? publicUrl : null,
        metadata: file.metadata.metadata,
        createdAt: new Date().toISOString(),
      };
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error cleaning up temp file:', error);
      }
    }
  }

  async downloadFile(storagePath, options = {}) {
    const { saveToDisk = false, destinationPath } = options;
    
    // Extract the file path from the storage path
    const filePath = storagePath.replace(`gs://${this.bucket.name}/`, '');
    const file = this.bucket.file(filePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error('File not found');
    }
    
    if (saveToDisk) {
      // Save file to disk
      const savePath = destinationPath || path.join(this.tempDir, path.basename(filePath));
      await file.download({ destination: savePath });
      return savePath;
    } else {
      // Return file as buffer
      const [buffer] = await file.download();
      return buffer;
    }
  }

  async getFileMetadata(storagePath) {
    const filePath = storagePath.replace(`gs://${this.bucket.name}/`, '');
    const file = this.bucket.file(filePath);
    
    const [metadata] = await file.getMetadata();
    return metadata;
  }

  async deleteFile(storagePath) {
    const filePath = storagePath.replace(`gs://${this.bucket.name}/`, '');
    const file = this.bucket.file(filePath);
    
    await file.delete();
    return true;
  }

  async generateSignedUrl(storagePath, options = {}) {
    const {
      action = 'read',
      expiresIn = 15 * 60 * 1000, // 15 minutes
      contentType = 'application/octet-stream',
      responseDisposition = null,
    } = options;
    
    const filePath = storagePath.replace(`gs://${this.bucket.name}/`, '');
    const file = this.bucket.file(filePath);
    
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action,
      expires: Date.now() + expiresIn,
      contentType,
      responseDisposition,
    });
    
    return url;
  }

  async generateUploadUrl(options = {}) {
    const {
      prefix = 'uploads',
      contentType = 'application/octet-stream',
      maxFileSize = 10 * 1024 * 1024, // 10MB
      expiresIn = 15 * 60 * 1000, // 15 minutes
      metadata = {},
    } = options;
    
    const fileId = uuidv4();
    const fileName = `${prefix}/${fileId}`;
    const expires = Date.now() + expiresIn;
    
    // Generate a policy document
    const policy = {
      expiration: new Date(expires).toISOString(),
      conditions: [
        ['content-length-range', 0, maxFileSize],
        ['eq', '$Content-Type', contentType],
        ['starts-with', '$key', ''],
        { 'x-goog-meta-originalname': '' },
        ...Object.entries(metadata).map(([key, value]) => ({
          [`x-goog-meta-${key}`]: value,
        })),
      ],
    };
    
    // Generate a signed URL for direct upload
    const [url] = await this.bucket.file(fileName).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: new Date(expires),
      contentType,
      extensionHeaders: {
        'x-goog-meta-originalname': '',
        ...metadata,
      },
    });
    
    return {
      uploadUrl: url,
      fileId,
      fileName,
      expires,
      headers: {
        'Content-Type': contentType,
        'x-goog-meta-originalname': '',
        ...metadata,
      },
    };
  }

  async generateHash(file) {
    const hash = crypto.createHash('sha256');
    hash.update(file.buffer);
    return hash.digest('hex');
  }

  async checkFileExists(hash) {
    // This would check if a file with the same hash already exists in storage
    // Implementation depends on how you store file hashes (e.g., in a database)
    // This is a placeholder implementation
    return {
      exists: false,
      file: null,
    };
  }
}

module.exports = new FileStorage();
