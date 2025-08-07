const mongoose = require('mongoose');

const ProcessedMessageSchema = new mongoose.Schema({
  message_id: { type: String, index: true },
  meta_msg_id: { type: String, index: true },
  wa_id: { type: String, index: true },
  from: String,
  to: String,
  text: String,
  timestamp: Date,
  status: { type: String, enum: ['sent','delivered','read','pending','unknown'], default: 'pending' },
  raw: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('ProcessedMessage', ProcessedMessageSchema);
