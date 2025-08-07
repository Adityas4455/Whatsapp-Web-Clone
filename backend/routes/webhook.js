const express = require('express');
const router = express.Router();
const ProcessedMessage = require('../models/ProcessedMessage');

function safeDate(ts){
  if(!ts) return new Date();
  if(typeof ts === 'number'){
    return ts.toString().length === 10 ? new Date(ts * 1000) : new Date(ts);
  }
  return new Date(ts);
}

async function upsertMessage(msg, io){
  const message_id = msg.id || msg.message_id || msg.msg_id || msg.key?.id || msg.message?.id;
  const meta_msg_id = msg.meta_msg_id || msg.meta_msgid || msg.meta_msg_id;
  const wa_id = msg.from || msg.sender || msg.wa_id || msg.key?.from || (msg.contacts && msg.contacts[0] && msg.contacts[0].wa_id);
  const text = (msg.text && (msg.text.body || msg.text)) || msg.body || msg.message?.text || (typeof msg === 'string' ? msg : undefined);
  const timestamp = msg.timestamp || msg.t || msg.message?.timestamp || Date.now();

  const doc = {
    message_id: message_id ? String(message_id) : undefined,
    meta_msg_id: meta_msg_id ? String(meta_msg_id) : undefined,
    wa_id: wa_id ? String(wa_id) : undefined,
    from: msg.from || msg.sender || msg.author,
    to: msg.to,
    text: text,
    timestamp: safeDate(Number(timestamp)),
    status: msg.status || 'sent',
    raw: msg
  };

  if(doc.message_id){
    let existing = await ProcessedMessage.findOne({ message_id: doc.message_id });
    if(existing){
      Object.assign(existing, doc);
      await existing.save();
      if(io) io.emit('message', existing);
      return existing;
    }
  }
  const created = await ProcessedMessage.create(doc);
  if(io) io.emit('message', created);
  return created;
}

async function applyStatusUpdate(status, io){
  const ids = [];
  if(status.id) ids.push(String(status.id));
  if(status.message_id) ids.push(String(status.message_id));
  if(status.msg_id) ids.push(String(status.msg_id));
  if(status.meta_msg_id) ids.push(String(status.meta_msg_id));
  const newStatus = status.status || status.statuses || status.status_type || status.statusName || 'delivered';

  const query = { $or: [] };
  if(ids.length) query.$or.push({ message_id: { $in: ids }});
  if(status.meta_msg_id) query.$or.push({ meta_msg_id: status.meta_msg_id });
  if(status.meta_msgid) query.$or.push({ meta_msg_id: status.meta_msgid });

  if(query.$or.length === 0) return null;

  const updated = await ProcessedMessage.updateMany(query, { status: newStatus }, { multi: true });
  if(io) io.emit('status_update', { query, status: newStatus });
  return updated;
}

router.post('/', async (req, res) => {
  const io = req.app.get('io');
  const payload = req.body || {};
  try {
    if(Array.isArray(payload.entry)){
      for(const entry of payload.entry){
        const changes = entry.changes || [entry];
        for(const change of changes){
          const value = change.value || change;
          if(Array.isArray(value.messages)){
            for(const m of value.messages) await upsertMessage(m, io);
          }
          if(Array.isArray(value.statuses) || value.statuses){
            const statuses = Array.isArray(value.statuses) ? value.statuses : [value.statuses];
            for(const s of statuses) await applyStatusUpdate(s, io);
          }
        }
      }
    } else {
      if(payload.messages || payload.messages === 0){
        const arr = Array.isArray(payload.messages) ? payload.messages : [payload.messages];
        for(const m of arr) await upsertMessage(m, io);
      }
      if(payload.statuses || payload.status){
        const arr = Array.isArray(payload.statuses) ? payload.statuses : (payload.statuses ? payload.statuses : [payload.status]);
        for(const s of arr) await applyStatusUpdate(s, io);
      }
      if(payload.message && typeof payload.message === 'object') await upsertMessage(payload.message, io);
    }

    res.status(200).json({ ok: true });
  } catch (err){
    console.error("Webhook processing error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
