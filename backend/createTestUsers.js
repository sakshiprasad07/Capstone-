const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Police = require('./models/Police');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/capstone';

async function createTestUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const testOfficers = [
      { username: 'officer1', station: 'Central Station' },
      { username: 'officer2', station: 'North Station' },
      { username: 'officer3', station: 'South Station' }
    ];

    const hashedPassword = await bcrypt.hash('police123', 10);
    
    for (const officer of testOfficers) {
      const existing = await Police.findOne({ username: officer.username });
      if (existing) {
        console.log(`⚠️  ${officer.username} already exists (skipped)`);
        continue;
      }

      const newOfficer = new Police({
        username: officer.username,
        password: hashedPassword,
        role: 'police'
      });
      
      await newOfficer.save();
      console.log(`✅ Created: ${officer.username} / police123 (${officer.station})`);
    }

    console.log('\n🚨 TEST CREDENTIALS:');
    console.log('┌─────────────────────┐');
    console.log('| officer1  | police123 |');
    console.log('| officer2  | police123 |');  
    console.log('| officer3  | police123 |');
    console.log('| police_admin | ADMIN777 (bypass) |');
    console.log('└─────────────────────┘\n');
    
    console.log('💡 Run: npm start backend, then login at http://localhost:5000');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUsers();

