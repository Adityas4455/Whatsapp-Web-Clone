require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ProcessedMessage = require('./models/ProcessedMessage');

const MONGO_URI = process.env.MONGO_URI;
if(!MONGO_URI){ console.error("Set MONGO_URI in .env"); process.exit(1); }

async function main(){
  await mongoose.connect(MONGO_URI);
  console.log("Connected to DB");
  const dir = path.join(__dirname, 'payloads');
  if(!fs.existsSync(dir)){
    console.error("Create a payloads/ folder and put sample JSON files there (unzipped).");
    process.exit(1);
  }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} json files`);
  for(const f of files){
    try {
      const text = fs.readFileSync(path.join(dir, f), 'utf8');
      const payload = JSON.parse(text);
      await processPayload(payload);
      console.log("Processed:", f);
    } catch(e){
      console.error("Error processing", f, e.message);
    }
  }
  console.log("Done");
  process.exit(0);
}

async function processPayload(payload){
  if(Array.isArray(payload.entry)){
    for(const entry of payload.entry){
      const changes = entry.changes || [entry];
      for(const change of changes){
        const v = change.value || change;
        if(Array.isArray(v.messages)){
          for(const m of v.messages){
            await upsert(m);
          }
        }
        if(Array.isArray(v.statuses)){
          for(const s of v.statuses){
            await applyStatus(s);
          }
        }
      }
    }
  } else {
    if(Array.isArray(payload.messages)){
      for(const m of payload.messages) await upsert(m);
    } else if(payload.message) await upsert(payload.message);
    if(Array.isArray(payload.statuses)) for(const s of payload.statuses) await applyStatus(s);
  }
}

async function upsert(msg){
  const message_id = msg.id || msg.message_id || msg.msg_id || (msg.key && msg.key.id);
  const doc = {
    message_id: message_id ? String(message_id) : undefined,
    meta_msg_id: msg.meta_msg_id,
    wa_id: msg.from || msg.sender || msg.wa_id || (msg.contacts && msg.contacts[0] && msg.contacts[0].wa_id),
    from: msg.from || msg.sender,
    to: msg.to,
    text: (msg.text && (msg.text.body || msg.text)) || msg.body,
    timestamp: msg.timestamp ? new Date(Number(msg.timestamp) * (String(msg.timestamp).length === 10 ? 1000 : 1)) : new Date(),
    status: msg.status || 'sent',
    raw: msg
  };
  if(doc.message_id){
    const existing = await ProcessedMessage.findOne({ message_id: doc.message_id });
    if(existing){ Object.assign(existing, doc); await existing.save(); return existing; }
  }
  return ProcessedMessage.create(doc);
}

async function applyStatus(s){
  const id = s.id || s.message_id || s.msg_id;
  const newStatus = s.status || s.status_name || s.statusType || 'delivered';
  const query = [];
  if(id) query.push({ message_id: String(id) });
  if(s.meta_msg_id) query.push({ meta_msg_id: s.meta_msg_id });
  if(query.length === 0) return;
  await ProcessedMessage.updateMany({ $or: query }, { status: newStatus });
}

main().catch(e => { console.error(e); process.exit(1); });
