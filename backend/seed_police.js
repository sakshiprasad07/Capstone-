const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Police = require('./models/Police');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/capstone";

// List of police accounts to create
const policeAccounts = [
    { username: "police_admin", password: "police_password123" },
    { username: "koushikreddy", password: "koushik" },
    // Add more accounts here...
];

async function seedPolice() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB ✅");

        for (const account of policeAccounts) {
            const existingPolice = await Police.findOne({ username: account.username });

            if (existingPolice) {
                console.log(`Checking: ${account.username} already exists. Skipping.`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(account.password, 10);
            const policeUser = new Police({
                username: account.username,
                password: hashedPassword,
                role: 'police'
            });

            await policeUser.save();
            console.log(`Created: ${account.username} ✅`);
        }

        console.log("Seeding completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding police accounts:", error);
        process.exit(1);
    }
}

seedPolice();
