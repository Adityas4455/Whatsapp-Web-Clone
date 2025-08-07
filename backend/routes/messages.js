const express = require('express');
const router = express.Router();
const ProcessedMessage = require('../models/ProcessedMessage');

router.get('/conversations', async (req, res) => {
  try {
    const list = await ProcessedMessage.aggregate([
      { $sort: { timestamp: 1 } },
      { $group: {
          _id: "$wa_id",
          lastMessage: { $last: "$$ROOT" },
          count: { $sum: 1 }
      }},
      { $sort: { "lastMessage.timestamp": -1 } }
    ]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/conversations/:wa_id', async (req, res) => {
  try {
    const wa_id = req.params.wa_id;
    const messages = await ProcessedMessage.find({ wa_id }).sort({ timestamp: 1, createdAt: 1 });
    res.json(messages);
  } catch (err){
    res.status(500).json({ error: err.message });
  }
});

router.post('/conversations/:wa_id/messages', async (req, res) => {
  try {
    const wa_id = req.params.wa_id;
    const { text, from, to } = req.body;
    const messageDoc = await ProcessedMessage.create({
      message_id: 'local-' + Date.now(),
      wa_id,
      from: from || 'me',
      to,
      text,
      timestamp: new Date(),
      status: 'sent',
      raw: { demo: true }
    });
    const io = req.app.get('io');
    if(io) io.emit('message', messageDoc);
    res.json(messageDoc);
  } catch (err){
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
