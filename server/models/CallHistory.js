const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: null },
  leftAt: { type: Date, default: null }
}, { _id: false });

const callHistorySchema = new mongoose.Schema({
  callId: { type: String, required: true, unique: true, index: true },
  room: { type: String, required: true, index: true },
  caller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  participants: { type: [participantSchema], default: [] },
  hiddenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  type: { type: String, enum: ['voice', 'video'], required: true },
  status: { type: String, enum: ['ringing', 'in_progress', 'completed', 'missed', 'declined', 'cancelled', 'failed'], default: 'ringing', index: true },
  acceptedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },
  durationSeconds: { type: Number, default: 0, min: 0 },
  endedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.models.CallHistory || mongoose.model('CallHistory', callHistorySchema);
