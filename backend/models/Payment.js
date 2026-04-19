const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  // Basic Info
  date:           { type: Date, default: Date.now },
  client:         { type: String, required: true },
  vehicle:        { type: String },
  location:       { type: String },
  
  // Time Information
  startTime:      { type: String },
  endTime:        { type: String },
  restTime:       { type: Number, default: 0 },     // in minutes
  totalHours:     { type: Number, default: 0 },
  
  // Billing Breakdown
  minimumHours:   { type: Number, default: 0 },
  hoursInBill:    { type: Number, default: 0 },
  commission:     { type: Number, default: 0 },
  dayPayment:     { type: Number, default: 0 },
  takenAmount:    { type: Number, default: 0 },
  
  // Computed
  hireAmount:     { type: Number, default: 0 },
  paidAmount:     { type: Number, default: 0 },
  balance:        { type: Number, default: 0 },
  status:         { type: String, enum: ['Pending', 'Paid'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
