const mongoose = require('mongoose');

const policeSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['police', 'admin'],
        default: 'police'
    }
}, { timestamps: true });

module.exports = mongoose.model('Police', policeSchema);
