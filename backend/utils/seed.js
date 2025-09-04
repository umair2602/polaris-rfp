const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rfp_system');
    console.log('Connected to MongoDB');

    // Check if admin user exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (!existingAdmin) {
      const adminUser = new User({
        username: 'admin',
        email: 'admin@eighthgen.com',
        password: 'admin123',
        fullName: 'System Administrator',
        role: 'admin'
      });

      await adminUser.save();
      console.log('Admin user created successfully');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      console.log('Admin user already exists');
    }

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