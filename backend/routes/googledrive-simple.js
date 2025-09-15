const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const googleDriveService = require('../services/googleDrive');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/temp';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image formats
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/json',
      'image/png',
      'image/jpeg',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'), false);
    }
  }
});

// Initialize Google Drive service
googleDriveService.initialize();

// Get authentication URL
router.get('/auth/url', async (req, res) => {
  try {
    const authUrl = await googleDriveService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error getting auth URL:', error);
    res.status(500).json({ 
      error: 'Failed to get authentication URL',
      message: error.message 
    });
  }
});

// Handle OAuth callback
router.post('/auth/callback', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    const tokens = await googleDriveService.handleAuthCallback(code);
    res.json({ 
      message: 'Authentication successful',
      tokens: {
        access_token: tokens.access_token ? 'present' : 'missing',
        refresh_token: tokens.refresh_token ? 'present' : 'missing'
      }
    });
  } catch (error) {
    console.error('Error handling auth callback:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: error.message 
    });
  }
});

// Get service status
router.get('/status', (req, res) => {
  try {
    const isInitialized = googleDriveService.isInitialized();
    res.json({ 
      initialized: isInitialized,
      message: isInitialized ? 'Google Drive service is ready' : 'Google Drive service not initialized'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to check service status',
      message: error.message 
    });
  }
});

// Create or get proposals folder
router.post('/folder/proposals', async (req, res) => {
  try {
    const folderId = await googleDriveService.createProposalsFolder();
    res.json({ 
      folderId,
      message: 'Proposals folder ready'
    });
  } catch (error) {
    console.error('Error creating proposals folder:', error);
    res.status(500).json({ 
      error: 'Failed to create proposals folder',
      message: error.message 
    });
  }
});

// Upload file to Google Drive
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { parentFolderId } = req.body;
    const filePath = req.file.path;
    const fileName = req.body.fileName || req.file.originalname;

    // Upload to Google Drive
    const driveFile = await googleDriveService.uploadFile(
      filePath,
      fileName,
      parentFolderId
    );

    // Clean up temporary file
    fs.unlinkSync(filePath);

    res.json({
      message: 'File uploaded successfully',
      file: driveFile
    });
  } catch (error) {
    // Clean up temporary file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      message: error.message 
    });
  }
});

// Upload proposal directly from proposal ID
router.post('/upload-proposal/:proposalId', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { fileName } = req.body;

    // Get proposals folder
    const folderId = await googleDriveService.createProposalsFolder();

    // For now, we'll create a mock PDF file
    // In a real implementation, you would generate the actual proposal PDF
    const proposalContent = JSON.stringify({
      id: proposalId,
      title: fileName || `Proposal-${proposalId}`,
      generatedAt: new Date().toISOString(),
      content: "This is a generated proposal document."
    }, null, 2);

    const tempDir = 'uploads/temp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `proposal-${proposalId}.json`);
    fs.writeFileSync(tempFilePath, proposalContent);

    // Upload to Google Drive
    const driveFile = await googleDriveService.uploadFile(
      tempFilePath,
      fileName || `Proposal-${proposalId}.json`,
      folderId
    );

    // Clean up temporary file
    fs.unlinkSync(tempFilePath);

    res.json({
      message: 'Proposal uploaded successfully',
      file: driveFile
    });
  } catch (error) {
    console.error('Error uploading proposal:', error);
    res.status(500).json({ 
      error: 'Failed to upload proposal',
      message: error.message 
    });
  }
});

// List files in Google Drive
router.get('/files', async (req, res) => {
  try {
    const { folderId, pageSize = 50 } = req.query;
    const files = await googleDriveService.listFiles(folderId, parseInt(pageSize));
    
    res.json({
      files,
      count: files.length
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ 
      error: 'Failed to list files',
      message: error.message 
    });
  }
});

// Download file from Google Drive
router.get('/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { fileName = 'downloaded-file' } = req.query;

    const downloadDir = 'uploads/downloads';
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    const downloadPath = path.join(downloadDir, `${Date.now()}-${fileName}`);
    await googleDriveService.downloadFile(fileId, downloadPath);

    // Send file to client
    res.download(downloadPath, fileName, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
      // Clean up downloaded file after sending
      if (fs.existsSync(downloadPath)) {
        fs.unlinkSync(downloadPath);
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ 
      error: 'Failed to download file',
      message: error.message 
    });
  }
});

// Delete file from Google Drive
router.delete('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    await googleDriveService.deleteFile(fileId);
    
    res.json({
      message: 'File deleted successfully',
      fileId
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      error: 'Failed to delete file',
      message: error.message 
    });
  }
});

// Share file
router.post('/files/:fileId/share', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { email, role = 'reader' } = req.body;

    const permission = await googleDriveService.shareFile(fileId, email, role);
    
    res.json({
      message: 'File shared successfully',
      permission
    });
  } catch (error) {
    console.error('Error sharing file:', error);
    res.status(500).json({ 
      error: 'Failed to share file',
      message: error.message 
    });
  }
});

module.exports = router;