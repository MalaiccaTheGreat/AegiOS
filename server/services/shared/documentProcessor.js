const { createWorker } = require('tesseract.js');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const { Storage } = require('@google-cloud/storage');
const natural = require('natural');
const { Document, Packer, Paragraph, TextRun } = require('docx');

// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || 'aegios-documents');

class DocumentProcessor {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    this.ensureTempDir();
    this.classifier = new natural.BayesClassifier();
    this.initializeClassifier();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
      throw error;
    }
  }

  async initializeClassifier() {
    // Train classifier with sample data
    this.classifier.addDocument('invoice for services', 'invoice');
    this.classifier.addDocument('receipt for payment', 'receipt');
    this.classifier.addDocument('contract agreement', 'contract');
    this.classifier.addDocument('bank statement', 'statement');
    this.classifier.train();
  }

  async processDocument(file, metadata = {}) {
    const fileExt = path.extname(file.originalname).toLowerCase();
    const documentId = uuidv4();
    const filePath = path.join(this.tempDir, `${documentId}${fileExt}`);
    
    try {
      // Save file to temp directory
      await fs.writeFile(filePath, file.buffer);
      
      // Extract text based on file type
      let extractedText = '';
      
      if (fileExt === '.pdf') {
        const data = await pdfParse(file.buffer);
        extractedText = data.text;
      } else if (['.docx', '.doc'].includes(fileExt)) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = result.value;
      } else if (['.jpg', '.jpeg', '.png', '.tiff', '.bmp'].includes(fileExt)) {
        const worker = createWorker();
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data } = await worker.recognize(filePath);
        extractedText = data.text;
        await worker.terminate();
      } else if (fileExt === '.txt') {
        extractedText = file.buffer.toString('utf-8');
      } else {
        throw new Error(`Unsupported file format: ${fileExt}`);
      }
      
      // Classify document
      const category = this.classifyDocument(extractedText);
      
      // Extract metadata
      const extractedMetadata = this.extractMetadata(extractedText, category);
      
      // Upload to cloud storage
      const cloudPath = await this.uploadToStorage(filePath, documentId, fileExt);
      
      // Generate thumbnail if it's an image
      let thumbnailUrl = '';
      if (['.jpg', '.jpeg', '.png'].includes(fileExt)) {
        thumbnailUrl = await this.generateThumbnail(filePath, documentId);
      }
      
      // Return document data
      return {
        id: documentId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storagePath: cloudPath,
        thumbnailUrl,
        category,
        extractedText,
        metadata: {
          ...extractedMetadata,
          ...metadata,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

  classifyDocument(text) {
    // Basic classification using trained classifier
    return this.classifier.classify(text) || 'other';
  }

  extractMetadata(text, category) {
    const metadata = {
      date: new Date().toISOString().split('T')[0],
      amount: null,
      vendor: null,
      invoiceNumber: null,
    };
    
    // Extract date patterns
    const datePatterns = [
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g, // MM/DD/YYYY or DD-MM-YYYY
      /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g, // YYYY/MM/DD
    ];
    
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        metadata.date = matches[0];
        break;
      }
    }
    
    // Extract amount for invoices and receipts
    if (['invoice', 'receipt'].includes(category)) {
      const amountMatches = text.match(/total.*?\$?\s*(\d+[\.,]\d{2})/i);
      if (amountMatches && amountMatches[1]) {
        metadata.amount = parseFloat(amountMatches[1].replace(',', ''));
      }
      
      // Extract invoice number
      const invoiceMatches = text.match(/(?:invoice|receipt|no\.?)\s*[:#]?\s*([A-Z0-9\-]+)/i);
      if (invoiceMatches && invoiceMatches[1]) {
        metadata.invoiceNumber = invoiceMatches[1].trim();
      }
    }
    
    return metadata;
  }

  async uploadToStorage(filePath, documentId, fileExt) {
    const destination = `documents/${documentId}${fileExt}`;
    await bucket.upload(filePath, {
      destination,
      metadata: {
        contentType: this.getMimeType(fileExt),
        metadata: {
          documentId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });
    
    return `gs://${bucket.name}/${destination}`;
  }

  async generateThumbnail(imagePath, documentId) {
    // This is a simplified example - in a real app, you'd use a library like sharp or Jimp
    // to generate a proper thumbnail
    const destination = `thumbnails/${documentId}.jpg`;
    
    // In a real implementation, you would:
    // 1. Resize the image
    // 2. Save the thumbnail to a temp file
    // 3. Upload it to storage
    // 4. Return the public URL
    
    // For now, we'll just return a placeholder
    return `https://storage.googleapis.com/${bucket.name}/${destination}`;
  }

  getMimeType(ext) {
    const types = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.txt': 'text/plain',
    };
    
    return types[ext.toLowerCase()] || 'application/octet-stream';
  }

  async createDocumentFromTemplate(templateName, data) {
    // This is a simplified example - in a real app, you'd use a templating engine
    // like Handlebars or Docxtemplater
    
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: data.title || 'Document',
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated on ${new Date().toLocaleDateString()}`,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: data.content || '',
                  size: 20,
                }),
              ],
            }),
          ],
        },
      ],
    });
    
    const buffer = await Packer.toBuffer(doc);
    const documentId = uuidv4();
    const fileName = `${documentId}.docx`;
    const filePath = path.join(this.tempDir, fileName);
    
    await fs.writeFile(filePath, buffer);
    const cloudPath = await this.uploadToStorage(filePath, documentId, '.docx');
    
    return {
      id: documentId,
      fileName,
      storagePath: cloudPath,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: buffer.length,
      createdAt: new Date().toISOString(),
    };
  }
}

module.exports = new DocumentProcessor();
