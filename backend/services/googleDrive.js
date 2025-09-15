const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDriveService {
  constructor() {
    this.auth = null;
    this.drive = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // For development, we'll use a service account approach
      // In production, you should use OAuth2 for user authentication
      const serviceAccountKeyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
      
      if (serviceAccountKeyPath && fs.existsSync(serviceAccountKeyPath)) {
        this.auth = new google.auth.GoogleAuth({
          keyFile: serviceAccountKeyPath,
          scopes: ['https://www.googleapis.com/auth/drive']
        });
      } else {
        // Fallback to OAuth2 if service account is not available
        this.auth = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );

        // Set credentials if available
        if (process.env.GOOGLE_ACCESS_TOKEN && process.env.GOOGLE_REFRESH_TOKEN) {
          this.auth.setCredentials({
            access_token: process.env.GOOGLE_ACCESS_TOKEN,
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
          });
        }
      }

      this.drive = google.drive({ version: 'v3', auth: this.auth });
      this.initialized = true;
      console.log('Google Drive service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error.message);
      this.initialized = false;
    }
  }

  isInitialized() {
    return this.initialized;
  }

  async createProposalsFolder() {
    try {
      if (!this.isInitialized()) {
        throw new Error('Google Drive service not initialized');
      }

      // Check if proposals folder already exists
      const response = await this.drive.files.list({
        q: "name='RFP Proposals' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id, name)',
      });

      if (response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // Create the folder if it doesn't exist
      const folderMetadata = {
        name: 'RFP Proposals',
        mimeType: 'application/vnd.google-apps.folder',
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id',
      });

      console.log('Created RFP Proposals folder with ID:', folder.data.id);
      return folder.data.id;
    } catch (error) {
      console.error('Error creating proposals folder:', error);
      throw error;
    }
  }

  async uploadFile(filePath, fileName, parentFolderId = null) {
    try {
      if (!this.isInitialized()) {
        throw new Error('Google Drive service not initialized');
      }

      if (!fs.existsSync(filePath)) {
        throw new Error('File not found: ' + filePath);
      }

      const fileMetadata = {
        name: fileName,
      };

      if (parentFolderId) {
        fileMetadata.parents = [parentFolderId];
      }

      const media = {
        mimeType: this.getMimeType(fileName),
        body: fs.createReadStream(filePath),
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, size, createdTime',
      });

      console.log('File uploaded successfully:', response.data.name);
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async listFiles(folderId = null, pageSize = 50) {
    try {
      if (!this.isInitialized()) {
        throw new Error('Google Drive service not initialized');
      }

      let query = "trashed=false";
      if (folderId) {
        query += ` and '${folderId}' in parents`;
      }

      const response = await this.drive.files.list({
        q: query,
        pageSize: pageSize,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, parents)',
        orderBy: 'modifiedTime desc',
      });

      return response.data.files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  async downloadFile(fileId, destinationPath) {
    try {
      if (!this.isInitialized()) {
        throw new Error('Google Drive service not initialized');
      }

      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media',
      }, { responseType: 'stream' });

      return new Promise((resolve, reject) => {
        const dest = fs.createWriteStream(destinationPath);
        response.data.pipe(dest);
        
        dest.on('finish', () => {
          console.log('File downloaded successfully to:', destinationPath);
          resolve(destinationPath);
        });
        
        dest.on('error', (error) => {
          console.error('Error downloading file:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      if (!this.isInitialized()) {
        throw new Error('Google Drive service not initialized');
      }

      await this.drive.files.delete({
        fileId: fileId,
      });

      console.log('File deleted successfully:', fileId);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async shareFile(fileId, email = null, role = 'reader') {
    try {
      if (!this.isInitialized()) {
        throw new Error('Google Drive service not initialized');
      }

      const permission = {
        role: role,
        type: email ? 'user' : 'anyone',
      };

      if (email) {
        permission.emailAddress = email;
      }

      const response = await this.drive.permissions.create({
        fileId: fileId,
        resource: permission,
        sendNotificationEmail: false,
      });

      console.log('File shared successfully:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('Error sharing file:', error);
      throw error;
    }
  }

  getMimeType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  async getAuthUrl() {
    if (!this.auth || this.auth.constructor.name !== 'OAuth2') {
      throw new Error('OAuth2 not configured');
    }

    const authUrl = this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive'],
    });

    return authUrl;
  }

  async handleAuthCallback(code) {
    if (!this.auth || this.auth.constructor.name !== 'OAuth2') {
      throw new Error('OAuth2 not configured');
    }

    const { tokens } = await this.auth.getToken(code);
    this.auth.setCredentials(tokens);
    
    return tokens;
  }
}

module.exports = new GoogleDriveService();