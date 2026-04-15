const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Police = require('./models/Police');
require('dotenv').config();

const addRegularPolice = async () => {
    try {
        const MONGO_URI = "mongodb://127.0.0.1:27017/capstone";
        
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB ✅");

        const policeOfficers = [
            { username: 'officer1', password: 'password123' },
            { username: 'officer2', password: 'password123' },
            { username: 'police_officer', password: 'police123' }
        ];

        for (const officer of policeOfficers) {
            const existingUser = await Police.findOne({ username: officer.username });
            if (existingUser) {
                console.log(`Police officer '${officer.username}' already exists`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(officer.password, 10);
            const newPoliceUser = new Police({
                username: officer.username,
                password: hashedPassword,
                role: 'police'
            });

            await newPoliceUser.save();
            console.log(`Police officer '${officer.username}' created successfully ✅`);
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error("Error adding police officers:", error.message);
        process.exit(1);
    }
};

addRegularPolice();
