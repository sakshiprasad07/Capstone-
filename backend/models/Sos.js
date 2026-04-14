const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['sos', 'report'],
    default: 'sos'
  },
  message: {
    type: String,
    default: 'Emergency SOS request submitted by user.'
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'resolved'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Sos', sosSchema);
