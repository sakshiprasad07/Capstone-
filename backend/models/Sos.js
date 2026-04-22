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
  title: {
    type: String,
    trim: true
  },
  desc: {
    type: String,
    trim: true
  },
  reportType: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  incidentTime: {
    type: String,
    trim: true
  },
  details: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'resolved'],
    default: 'pending'
  },
  assignedPoliceStationId: {
    type: String,
    default: null
  },
  assignedPoliceStationName: {
    type: String,
    default: null
  },
  assignmentDistance: {
    type: Number,
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Sos', sosSchema);
