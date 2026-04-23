const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Police = require('./backend/models/Police');
require('dotenv').config({ path: './backend/.env' });

async function createPolice() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/capstone";
  await mongoose.connect(MONGO_URI);
  
  const hashedPassword = await bcrypt.hash('police123', 10);
  const police = new Police({
    username: 'officer_test',
    password: hashedPassword,
    role: 'police'
  });
  
  try {
    await police.save();
    console.log('Police user created: officer_test / police123');
  } catch (err) {
    if (err.code === 11000) {
      console.log('Police user already exists');
    } else {
      console.error(err);
    }
  }
  process.exit();
}

createPolice();
