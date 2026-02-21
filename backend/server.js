const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Police = require('./models/Police');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' })); // Allow all origins for local testing
app.use(express.static(path.join(__dirname, '../frontend')));

// Request logging and security headers middleware
app.use((req, res, next) => {
    console.log(`>>> [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    // Required for Google OAuth popup on some browsers
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
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
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/capstone";
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
    // ... same as before
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

// Google Login/Signup Route
app.post("/auth/google", async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        let user = await User.findOne({
            $or: [{ googleId }, { email }]
        });

        if (!user) {
            // Create new user if they don't exist
            user = new User({
                username: name || email.split('@')[0], // Use name or part of email as username
                email,
                googleId,
                role: 'user'
            });
            await user.save();
            console.log("LOG: New user created via Google:", user.username);
        } else if (!user.googleId) {
            // If user exists with email but no googleId, link them
            user.googleId = googleId;
            await user.save();
            console.log("LOG: Linked existing email to Google account:", email);
        }

        const jwtToken = jwt.sign(
            { id: user._id, role: 'user' },
            process.env.JWT_SECRET || "secret_key",
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Google Login successful",
            token: jwtToken,
            username: user.username,
            role: 'user',
            picture
        });
    } catch (error) {
        console.error("LOG: Google Auth Error:", error);
        res.status(400).json({ message: "Invalid Google token", error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

