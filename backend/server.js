const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Police = require('./models/Police');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' })); // Allow all origins for local testing

// Request logging middleware
app.use((req, res, next) => {
    console.log(`>>> [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Process-wide error handlers
process.on('uncaughtException', (err) => {
    console.error('FATAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

// MongoDB Connection
require("dotenv").config();

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/capstone";

        await mongoose.connect(MONGO_URI);

        console.log("Connected to MongoDB ✅");
    } catch (err) {
        console.error("MongoDB Connection Error ❌", err);
        process.exit(1);
    }
};

connectDB();

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
        const newUser = new User({
            username,
            password: hashedPassword,
            role: 'user' // Explicitly set role to public user
        });
        await newUser.save();

        console.log("LOG: User created successfully:", username);
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("LOG: Signup Error:", error);
        res.status(500).json({ message: "Error creating user", error: error.message });
    }
});

// User Login Route
app.post("/user/login", async (req, res) => {
    console.log("LOG: Public User Login request for:", req.body.username);
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
            { id: user._id, role: 'user' },
            process.env.JWT_SECRET || "secret_key",
            { expiresIn: "1h" }
        );

        res.status(200).json({ message: "Login successful", token, username: user.username, role: 'user' });
    } catch (error) {
        console.error("LOG: User Login Error:", error);
        res.status(500).json({ message: "Login error", error: error.message });
    }
});

// Police Login Route
app.post("/police/login", async (req, res) => {
    console.log("LOG: Police Login request for:", req.body.username);
    try {
        const { username, password } = req.body;

        const officer = await Police.findOne({ username });
        if (!officer) {
            return res.status(400).json({ message: "Access Denied: Invalid Badge ID or Password" });
        }

        const isMatch = await bcrypt.compare(password, officer.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Access Denied: Invalid Badge ID or Password" });
        }

        const token = jwt.sign(
            { id: officer._id, role: 'police' },
            process.env.JWT_SECRET || "secret_key_police",
            { expiresIn: "1h" }
        );

        res.status(200).json({ message: "Authentication successful", token, username: officer.username, role: 'police' });
    } catch (error) {
        console.error("LOG: Police Login Error:", error);
        res.status(500).json({ message: "Authentication error", error: error.message });
    }
});

app.post("/github-webhook", (req, res) => {
    console.log("📩 GitHub Webhook Triggered!");
    console.log("Event:", req.headers["x-github-event"]);
    console.log("Payload:", req.body);

    res.status(200).send("Webhook received");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

