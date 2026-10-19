const express = require('express');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/Users');
const Group = require('../models/Group');
const CallHistory = require('../models/CallHistory');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const userId = req => String(req.user.id);
const callHistoryPartyFilter = id => ({ $or: [{ caller: id }, { recipient: id }, { 'participants.user': id }] });
const activeCallStatuses = ['ringing', 'in_progress'];
const isMemberOfRoom = async (req, room) => {
  if (room === 'global_workspace' || room === userId(req)) return true;
  const directParticipants = room.split('_');
  if (directParticipants.length === 2 && directParticipants.every(mongoose.Types.ObjectId.isValid) && directParticipants.includes(userId(req))) return true;
  if (!mongoose.Types.ObjectId.isValid(room)) return false;
  return Boolean(await Group.exists({ _id: room, members: userId(req) }));
};

router.get('/users', async (req, res) => {
  try {
    const staff = await User.find({}, 'username firstName lastName profileImage');
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: 'Failed to read workspace personnel.' });
  }
});

router.post('/groups', async (req, res) => {
  try {
    const members = Array.isArray(req.body.members) ? req.body.members : [];
    const memberIds = [...new Set([...members.map(String), userId(req)])];
    if (!req.body.name?.trim() || memberIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ error: 'A group name and valid member IDs are required.' });
    }
    const group = await Group.create({ name: req.body.name.trim(), members: memberIds, createdBy: userId(req) });
    return res.status(201).json({ id: group._id, name: group.name, members: group.members, type: 'group' });
  } catch (err) {
    return res.status(400).json({ message: 'Failed to create group.' });
  }
});

router.get('/groups', async (req, res) => {
  try {
    const groups = await Group.find({ members: userId(req) });
    return res.json(groups.map(g => ({ id: g._id, name: g.name, members: g.members, type: 'group' })));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load groups.' });
  }
});

router.get('/history/:roomId', async (req, res) => {
  try {
    const room = req.params.roomId;
    if (!(await isMemberOfRoom(req, room))) return res.status(403).json({ error: 'You are not a member of this room.' });
    const messages = await ChatMessage.find({ room }).sort({ createdAt: -1 }).limit(50);
    return res.json(messages.reverse());
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load chat history.' });
  }
});

router.get('/conversations-summary', async (req, res) => {
  try {
    const id = userId(req);
    const groups = await Group.find({ members: id }, '_id');
    const roomIds = groups.map(g => String(g._id));
    const directRoomPattern = new RegExp(`^(?:${id}_[a-f0-9]{24}|[a-f0-9]{24}_${id})$`, 'i');
    const summary = await ChatMessage.aggregate([
      { $match: { $or: [ { room: directRoomPattern }, { room: { $in: roomIds } }, { room: 'global_workspace' } ] } },
      { $sort: { createdAt: -1 } },
      { $group: {
        _id: '$room', lastMessage: { $first: '$message' }, type: { $first: '$type' }, timestamp: { $first: '$createdAt' },
        unreadCount: { $sum: { $cond: [{ $in: [new mongoose.Types.ObjectId(id), { $ifNull: ['$readBy.userId', []] }] }, 0, 1] } }
      } }
    ]);
    const metadata = {};
    summary.forEach(item => { metadata[item._id] = {
      lastMessage: item.type === 'text' ? item.lastMessage : `📷 ${item.type}`,
      timestamp: item.timestamp, unreadCount: item.unreadCount
    }; });
    return res.json(metadata);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load conversation summaries.' });
  }
});

router.get('/call-history', async (req, res) => {
  try {
    const history = await CallHistory.find({ ...callHistoryPartyFilter(userId(req)), hiddenBy: { $ne: userId(req) } })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('caller', 'username firstName lastName profileImage')
      .populate('recipient', 'username firstName lastName profileImage')
      .populate('participants.user', 'username firstName lastName profileImage');
    return res.json(history);
  } catch (err) {
    return res.status(500).json({ error: 'Could not load call history.' });
  }
});

router.delete('/call-history', async (req, res) => {
  try {
    const result = await CallHistory.updateMany({
      ...callHistoryPartyFilter(userId(req)),
      hiddenBy: { $ne: userId(req) },
      status: { $nin: activeCallStatuses }
    }, { $addToSet: { hiddenBy: userId(req) } });
    return res.json({ deletedCount: result.modifiedCount || 0 });
  } catch (err) {
    return res.status(500).json({ error: 'Could not clear call history.' });
  }
});

router.delete('/call-history/:callId', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.callId)) return res.status(400).json({ error: 'Invalid call history item.' });
  try {
    const call = await CallHistory.findOne({ _id: req.params.callId, ...callHistoryPartyFilter(userId(req)), hiddenBy: { $ne: userId(req) } });
    if (!call) return res.status(404).json({ error: 'Call history item not found.' });
    if (activeCallStatuses.includes(call.status)) return res.status(409).json({ error: 'An active call cannot be removed from history.' });
    const result = await CallHistory.updateOne({ _id: call._id, status: { $nin: activeCallStatuses }, hiddenBy: { $ne: userId(req) } }, { $addToSet: { hiddenBy: userId(req) } });
    if (!result.modifiedCount) return res.status(409).json({ error: 'This call changed while you were removing it. Refresh and try again.' });
    return res.json({ message: 'Call removed from history.' });
  } catch (err) {
    return res.status(500).json({ error: 'Could not remove this call.' });
  }
});

module.exports = router;
