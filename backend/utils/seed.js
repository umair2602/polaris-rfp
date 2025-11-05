const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rfp_system');
    console.log('Connected to MongoDB');

    // No admin seeding required for simple user signup/login flow
    console.log('Skipping admin user seed; application uses public signup/login.');

    await mongoose.connection.close();
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;