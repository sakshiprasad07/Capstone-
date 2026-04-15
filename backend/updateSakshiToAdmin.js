const mongoose = require('mongoose');
const Police = require('./models/Police');
require('dotenv').config();

const forceUpdateSakshi = async () => {
    try {
        const MONGO_URI = "mongodb://127.0.0.1:27017/capstone";
        
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB ✅");

        // Find and update sakshi to admin
        const result = await Police.findOneAndUpdate(
            { username: 'sakshi' },
            { role: 'admin' },
            { new: true }
        );

        if (result) {
            console.log("✅ sakshi user updated to admin role successfully");
            console.log("Updated user:", { username: result.username, role: result.role });
        } else {
            console.log("❌ sakshi user not found");
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error("Error updating sakshi:", error.message);
        process.exit(1);
    }
};

forceUpdateSakshi();
