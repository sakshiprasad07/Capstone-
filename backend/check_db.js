const mongoose = require('mongoose');
const User = require('./models/User');
const Police = require('./models/Police');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/capstone";

async function checkDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("--- MongoDB Diagnostic ---");
        console.log("Connected to:", MONGO_URI);

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log("\nAvailable Collections:");
        collections.forEach(c => console.log(` - ${c.name}`));

        console.log("\n--- 'polices' Collection Content ---");
        const polices = await Police.find({}, { password: 0 }); // Don't show hashed pass
        if (polices.length === 0) {
            console.log("No documents found in 'polices'.");
        } else {
            polices.forEach(p => console.log(` - User: ${p.username}, Role: ${p.role}`));
        }

        console.log("\n--- 'users' Collection Content ---");
        const users = await User.find({}, { password: 0 });
        if (users.length === 0) {
            console.log("No documents found in 'users'.");
        } else {
            users.forEach(u => console.log(` - User: ${u.username}, Role: ${u.role}`));
        }

        console.log("\n--------------------------");
        process.exit(0);
    } catch (error) {
        console.error("Diagnostic failed:", error);
        process.exit(1);
    }
}

checkDB();
