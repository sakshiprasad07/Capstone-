const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/capstone";
mongoose.connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB ✅"))
    .catch((err) => console.error("MongoDB Connection Error ❌", err));

// Routes
app.get("/", (req, res) => {
    res.send("Crime Hotspot Backend Running 🚀");
});

// Signup Route
app.post("/signup", async (req, res) => {
    console.log("LOG: Signup request for:", req.body.username);
    try {
        const { username, password } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        console.log("LOG: User created successfully:", username);
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("LOG: Signup Error:", error);
        res.status(500).json({ message: "Error creating user", error: error.message });
    }
});

// Login Route
app.post("/login", async (req, res) => {
    console.log("LOG: Login request for:", req.body.username);
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || "secret_key",
            { expiresIn: "1h" }
        );

        console.log("LOG: Login successful for:", username);
        res.status(200).json({ message: "Login successful", token, username: user.username });
    } catch (error) {
        console.error("LOG: Login Error:", error);
        res.status(500).json({ message: "Login error", error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

