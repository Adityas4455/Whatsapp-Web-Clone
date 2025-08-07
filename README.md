# WhatsApp Web Clone:

This archive contains a full project (backend + frontend) implementing the WhatsApp Web Clone evaluation:
- Backend: Node.js + Express + Mongoose + Socket.IO
- Frontend: React (simple UI)

Quickstart:
1. Backend:
   - cd backend
   - cp .env.example .env and set MONGO_URI
   - npm install
   - npm run process-payloads   # optional, loads JSON files placed into backend/payloads/
   - npm run dev

2. Frontend:
   - cd frontend
   - npm install
   - npm start

See code comments in files for more details.

## Bonus Task Implementation

**Bonus Task: Real-Time Interface Using WebSocket** — Implemented  
This project uses **Socket.IO** for real-time updates:
- Backend emits `message` and `status_update` events whenever messages are inserted or updated in the database.
- Frontend subscribes to these events and automatically updates the conversation list and active chat window without requiring a manual refresh.
