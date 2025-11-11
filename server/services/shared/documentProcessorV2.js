const { createWorker } = require('tesseract.js');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const { Storage } = require('@google-cloud/storage');
const natural = require('natural');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { createHash } = require('crypto');
const NodeCache = require('node-cache');
const { Op } = require('sequelize');

// Initialize cache with 1-hour TTL and max 1000 items
const cache = new NodeCache({ stdTTL: 3600, maxKeys: 1000 });
const workerCache = new Map();

class DocumentProcessorV2 {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    this.cache = cache;
    this.workerCache = workerCache;
    this.ensureTempDir();
    this.initializeClassifier();
    this.supportedMimeTypes = {
      // Document formats
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'text/plain': 'txt',
      'text/csv': 'csv',
      'application/rtf': 'rtf',
      'application/json': 'json',
      'application/xml': 'xml',
      'application/zip': 'zip',
      'application/x-rar-compressed': 'rar',
      'application/x-7z-compressed': '7z',
      // Image formats
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/tiff': 'tiff',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      // Email formats
      'message/rfc822': 'eml',
      'application/vnd.ms-outlook': 'msg',
    };
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
      throw error;
    }
  }

  async getCachedOrProcess(documentId, processFn) {
    const cacheKey = `doc:${documentId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log(`Cache hit for document ${documentId}`);
      return cached;
    }
    
    console.log(`Cache miss for document ${documentId}, processing...`);
    const result = await processFn();
    this.cache.set(cacheKey, result);
    return result;
  }

  async getWorker() {
    // Reuse worker if available in cache
    if (this.workerCache.has('tesseract')) {
      return this.workerCache.get('tesseract');
    }
    
    // Initialize new worker
    const worker = createWorker({
      cachePath: path.join(this.tempDir, 'tesseract-cache'),
      logger: m => console.log(m.status),
    });
    
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    // Cache the worker
    this.workerCache.set('tesseract', worker);
    return worker;
  }

  async processDocument(file, metadata = {}) {
    const fileExt = path.extname(file.originalname).toLowerCase();
    const documentId = uuidv4();
    const filePath = path.join(this.tempDir, `${documentId}${fileExt}`);
    
    try {
      // Generate file hash for deduplication
      const fileHash = createHash('sha256').update(file.buffer).digest('hex');
      
      // Check if we've processed this file before
      const cacheKey = `file:${fileHash}`;
      const cachedResult = this.cache.get(cacheKey);
      
      if (cachedResult) {
        console.log(`Using cached result for file hash ${fileHash}`);
        return { ...cachedResult, id: documentId, isCached: true };
      }
      
      // Save file to temp directory
      await fs.writeFile(filePath, file.buffer);
      
      // Process based on file type
      const result = await this.processFileByType(file, filePath, fileExt, metadata);
      
      // Cache the result
      this.cache.set(cacheKey, { ...result, id: undefined, isCached: undefined });
      
      return { ...result, id: documentId, isCached: false };
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error cleaning up temp file:', error);
      }
    }
  }

  async processFileByType(file, filePath, fileExt, metadata) {
    const mimeType = this.detectMimeType(file, fileExt);
    
    switch (mimeType) {
      case 'application/pdf':
        return this.processPdf(file, metadata);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return this.processWord(file, metadata);
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.ms-excel':
        return this.processExcel(file, metadata);
      case 'application/vnd.ms-powerpoint':
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return this.processPowerPoint(file, metadata);
      case 'text/plain':
      case 'text/csv':
      case 'application/json':
      case 'application/xml':
        return this.processText(file, metadata);
      case 'image/jpeg':
      case 'image/png':
      case 'image/tiff':
      case 'image/webp':
        return this.processImage(file, metadata);
      default:
        return this.processUnsupported(file, metadata);
    }
  }

  async processPdf(file, metadata) {
    try {
      const data = await pdfParse(file.buffer);
      const text = data.text;
      const pages = data.numpages;
      const metadataExtracted = this.extractMetadata(text, 'document');
      
      return {
        type: 'document',
        format: 'pdf',
        text,
        pages,
        metadata: { ...metadataExtracted, ...metadata },
        thumbnail: await this.generatePdfThumbnail(file.buffer),
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error('Failed to process PDF file');
    }
  }

  async processWord(file, metadata) {
    try {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      const text = result.value;
      const metadataExtracted = this.extractMetadata(text, 'document');
      
      return {
        type: 'document',
        format: file.mimetype.includes('openxml') ? 'docx' : 'doc',
        text,
        metadata: { ...metadataExtracted, ...metadata },
      };
    } catch (error) {
      console.error('Error processing Word document:', error);
      throw new Error('Failed to process Word document');
    }
  }

  async processExcel(file, metadata) {
    try {
      // For Excel files, we'll extract the data as JSON
      // In a real implementation, you would use a library like xlsx or exceljs
      const data = [];
      const text = 'Excel data extraction would go here';
      
      return {
        type: 'spreadsheet',
        format: file.mimetype.includes('openxml') ? 'xlsx' : 'xls',
        data,
        text,
        metadata: { ...metadata },
      };
    } catch (error) {
      console.error('Error processing Excel file:', error);
      throw new Error('Failed to process Excel file');
    }
  }

  async processPowerPoint(file, metadata) {
    try {
      // For PowerPoint files, we'll extract the text from slides
      // In a real implementation, you would use a library like pptxjs
      const slides = [];
      const text = 'PowerPoint content extraction would go here';
      
      return {
        type: 'presentation',
        format: file.mimetype.includes('openxml') ? 'pptx' : 'ppt',
        slides,
        text,
        metadata: { ...metadata },
      };
    } catch (error) {
      console.error('Error processing PowerPoint file:', error);
      throw new Error('Failed to process PowerPoint file');
    }
  }

  async processText(file, metadata) {
    try {
      const text = file.buffer.toString('utf-8');
      const metadataExtracted = this.extractMetadata(text, 'text');
      
      return {
        type: 'text',
        format: file.mimetype.split('/')[1] || 'txt',
        text,
        metadata: { ...metadataExtracted, ...metadata },
      };
    } catch (error) {
      console.error('Error processing text file:', error);
      throw new Error('Failed to process text file');
    }
  }

  async processImage(file, metadata) {
    try {
      const worker = await this.getWorker();
      const { data } = await worker.recognize(file.buffer);
      const text = data.text;
      const metadataExtracted = this.extractMetadata(text, 'image');
      
      return {
        type: 'image',
        format: file.mimetype.split('/')[1] || 'jpg',
        text,
        width: data.width,
        height: data.height,
        metadata: { ...metadataExtracted, ...metadata },
        thumbnail: await this.generateImageThumbnail(file.buffer, { width: 300 }),
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  processUnsupported(file, metadata) {
    return {
      type: 'unsupported',
      format: path.extname(file.originalname).slice(1) || 'unknown',
      text: '',
      metadata: { ...metadata, mimeType: file.mimetype },
    };
  }

  detectMimeType(file, fileExt) {
    // First try to use the provided mime type
    if (file.mimetype && this.supportedMimeTypes[file.mimetype]) {
      return file.mimetype;
    }
    
    // Fall back to extension-based detection
    const extension = fileExt.toLowerCase().replace('.', '');
    const mimeType = Object.entries(this.supportedMimeTypes).find(
      ([_, ext]) => ext === extension
    )?.[0];
    
    return mimeType || 'application/octet-stream';
  }

  extractMetadata(text, type) {
    const metadata = {
      title: '',
      author: '',
      keywords: [],
      createdAt: new Date().toISOString(),
      language: 'en',
      wordCount: text ? text.split(/\s+/).length : 0,
      pageCount: 1,
    };
    
    // Extract title from first line or filename
    if (text) {
      const firstLine = text.split('\n')[0] || '';
      if (firstLine.length > 10 && firstLine.length < 100) {
        metadata.title = firstLine.trim();
      }
    }
    
    // Extract keywords using natural language processing
    if (text && text.length > 100) {
      const wordFreq = {};
      const words = text.toLowerCase().match(/\b\w+\b/g) || [];
      
      words.forEach(word => {
        if (word.length > 3 && !this.isCommonWord(word)) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });
      
      metadata.keywords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
    }
    
    return metadata;
  }

  isCommonWord(word) {
    const commonWords = new Set([
      'this', 'that', 'with', 'from', 'your', 'have', 'more', 'will', 'they',
      'what', 'when', 'where', 'which', 'their', 'there', 'about', 'could',
      'would', 'should', 'them', 'some', 'into', 'other', 'than', 'then',
      'look', 'only', 'come', 'over', 'think', 'also', 'back', 'after', 'used',
      'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want'
    ]);
    return commonWords.has(word);
  }

  async generatePdfThumbnail(pdfBuffer) {
    // In a real implementation, you would use a library like pdf-thumbnail
    // This is a simplified version that returns a placeholder
    return {
      url: 'data:image/png;base64,...',
      width: 200,
      height: 300,
    };
  }

  async generateImageThumbnail(imageBuffer, options = {}) {
    // In a real implementation, you would use a library like sharp or jimp
    // This is a simplified version that returns a placeholder
    return {
      url: 'data:image/png;base64,...',
      width: options.width || 200,
      height: options.height || 200,
    };
  }

  async cleanup() {
    // Clean up any resources, like Tesseract workers
    for (const worker of this.workerCache.values()) {
      try {
        await worker.terminate();
      } catch (error) {
        console.error('Error terminating worker:', error);
      }
    }
    this.workerCache.clear();
  }
}

// Create a singleton instance
const documentProcessor = new DocumentProcessorV2();

// Clean up on process exit
process.on('exit', () => documentProcessor.cleanup());
process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());

module.exports = documentProcessor;
