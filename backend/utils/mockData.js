// Simple in-memory data store for demo purposes
class MockDatabase {
  constructor() {
    this.rfps = [];
    this.proposals = [];
    this.users = [
      {
        _id: 'admin_user_id',
        username: 'admin',
        email: 'admin@eighthgen.com',
        fullName: 'System Administrator',
        role: 'admin',
        isActive: true,
        password: '$2a$12$kqyzAOLAaIwXzzdY04Nfce3LqQytuKehXdcJRWvkoAv8lXdpjoBBW' // admin123
      }
    ];
    this.nextId = 1;
  }

  generateId() {
    return `mock_${this.nextId++}`;
  }

  // RFP operations
  async createRFP(rfpData) {
    const rfp = {
      _id: this.generateId(),
      ...rfpData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.rfps.push(rfp);
    return rfp;
  }

  async findRFPs() {
    return this.rfps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async findRFPById(id) {
    return this.rfps.find(rfp => rfp._id === id);
  }

  async updateRFP(id, updates) {
    const index = this.rfps.findIndex(rfp => rfp._id === id);
    if (index === -1) return null;
    
    this.rfps[index] = { ...this.rfps[index], ...updates, updatedAt: new Date() };
    return this.rfps[index];
  }

  async deleteRFP(id) {
    const index = this.rfps.findIndex(rfp => rfp._id === id);
    if (index === -1) return false;
    
    this.rfps.splice(index, 1);
    return true;
  }

  // Proposal operations
  async createProposal(proposalData) {
    const proposal = {
      _id: this.generateId(),
      ...proposalData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.proposals.push(proposal);
    return proposal;
  }

  async findProposals() {
    return this.proposals.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  async findProposalById(id) {
    return this.proposals.find(proposal => proposal._id === id);
  }

  async updateProposal(id, updates) {
    const index = this.proposals.findIndex(proposal => proposal._id === id);
    if (index === -1) return null;
    
    this.proposals[index] = { ...this.proposals[index], ...updates, updatedAt: new Date() };
    return this.proposals[index];
  }

  async deleteProposal(id) {
    const index = this.proposals.findIndex(proposal => proposal._id === id);
    if (index === -1) return false;
    
    this.proposals.splice(index, 1);
    return true;
  }

  // User operations
  async findUserByUsername(username) {
    return this.users.find(user => user.username === username || user.email === username);
  }

  async findUserById(id) {
    return this.users.find(user => user._id === id);
  }
}

const db = new MockDatabase();
module.exports = db;