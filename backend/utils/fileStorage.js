const fs = require('fs');
const path = require('path');

// File-based persistent storage
class FileStorage {
  constructor() {
    this.dataDir = path.join('/tmp', 'polaris-data');
    this.rfpFile = path.join(this.dataDir, 'rfps.json');
    this.proposalFile = path.join(this.dataDir, 'proposals.json');
    this.userFile = path.join(this.dataDir, 'users.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // Initialize data files if they don't exist
    this.initializeFile(this.rfpFile, []);
    this.initializeFile(this.proposalFile, []);
    // Start with an empty users list by default (no built-in admin user)
    this.initializeFile(this.userFile, []);
    
    this.nextId = this.getNextId();
  }
  
  initializeFile(filePath, defaultData) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
  }
  
  readFile(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
      return [];
    }
  }
  
  writeFile(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing ${filePath}:`, error);
    }
  }
  
  getNextId() {
    // Get highest ID from all files to ensure unique IDs
    const rfps = this.readFile(this.rfpFile);
    const proposals = this.readFile(this.proposalFile);
    
    let maxId = 0;
    [...rfps, ...proposals].forEach(item => {
      if (item._id && item._id.startsWith('persist_')) {
        const idNum = parseInt(item._id.split('_')[1]);
        if (idNum > maxId) maxId = idNum;
      }
    });
    
    return maxId + 1;
  }
  
  generateId() {
    return `persist_${this.nextId++}`;
  }
  
  // RFP operations
  async createRFP(rfpData) {
    const rfps = this.readFile(this.rfpFile);
    const rfp = {
      _id: this.generateId(),
      ...rfpData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    rfps.push(rfp);
    this.writeFile(this.rfpFile, rfps);
    return rfp;
  }
  
  async findRFPs() {
    const rfps = this.readFile(this.rfpFile);
    return rfps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  async findRFPById(id) {
    const rfps = this.readFile(this.rfpFile);
    return rfps.find(rfp => rfp._id === id);
  }
  
  async updateRFP(id, updates) {
    const rfps = this.readFile(this.rfpFile);
    const index = rfps.findIndex(rfp => rfp._id === id);
    if (index === -1) return null;
    
    rfps[index] = { ...rfps[index], ...updates, updatedAt: new Date() };
    this.writeFile(this.rfpFile, rfps);
    return rfps[index];
  }
  
  async deleteRFP(id) {
    const rfps = this.readFile(this.rfpFile);
    const index = rfps.findIndex(rfp => rfp._id === id);
    if (index === -1) return false;
    
    rfps.splice(index, 1);
    this.writeFile(this.rfpFile, rfps);
    return true;
  }
  
  // Proposal operations
  async createProposal(proposalData) {
    const proposals = this.readFile(this.proposalFile);
    const proposal = {
      _id: this.generateId(),
      ...proposalData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    proposals.push(proposal);
    this.writeFile(this.proposalFile, proposals);
    return proposal;
  }
  
  async findProposals() {
    const proposals = this.readFile(this.proposalFile);
    return proposals.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }
  
  async findProposalById(id) {
    const proposals = this.readFile(this.proposalFile);
    return proposals.find(proposal => proposal._id === id);
  }
  
  async updateProposal(id, updates) {
    const proposals = this.readFile(this.proposalFile);
    const index = proposals.findIndex(proposal => proposal._id === id);
    if (index === -1) return null;
    
    proposals[index] = { ...proposals[index], ...updates, updatedAt: new Date() };
    this.writeFile(this.proposalFile, proposals);
    return proposals[index];
  }
  
  async deleteProposal(id) {
    const proposals = this.readFile(this.proposalFile);
    const index = proposals.findIndex(proposal => proposal._id === id);
    if (index === -1) return false;
    
    proposals.splice(index, 1);
    this.writeFile(this.proposalFile, proposals);
    return true;
  }
  
  // User operations
  async findUserByUsername(username) {
    const users = this.readFile(this.userFile);
    return users.find(user => user.username === username || user.email === username);
  }
}

module.exports = new FileStorage();