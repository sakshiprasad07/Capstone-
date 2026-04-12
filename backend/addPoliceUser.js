const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Police = require('./models/Police');
require('dotenv').config();

const addPoliceUser = async () => {
    try {
        // Try Docker MongoDB first, fall back to local
        const MONGO_URI = "mongodb://127.0.0.1:27017/capstone";
        
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB ✅");

        const username = 'sakshi';
        const password = 'sakshi';

        // Check if user already exists
        const existingUser = await Police.findOne({ username });
        if (existingUser) {
            console.log("Police user 'sakshi' already exists");
            await mongoose.connection.close();
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new police user
        const newPoliceUser = new Police({
            username,
            password: hashedPassword,
            role: 'police'
        });

        await newPoliceUser.save();
        console.log("Police user 'sakshi' created successfully ✅");

        await mongoose.connection.close();
    } catch (error) {
        console.error("Error adding police user:", error.message);
        process.exit(1);
    }
};

addPoliceUser();
