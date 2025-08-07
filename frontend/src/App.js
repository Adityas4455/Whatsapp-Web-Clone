import React, { useEffect, useState } from 'react';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import API from './api';
import { io } from 'socket.io-client';

export default function App(){
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchConversations();
    const s = io(process.env.REACT_APP_API_URL || 'http://localhost:4000');
    setSocket(s);
    s.on('message', (m) => {
      fetchConversations();
    });
    return () => s.disconnect();
  }, [active]);

  async function fetchConversations(){
    const res = await API.get('/api/conversations');
    setConversations(res.data || []);
  }

  return (
    <div className="app">
      <div className="sidebar">
        <h2>WhatsApp Clone</h2>
        <ChatList conversations={conversations} onSelect={(id) => setActive(id)} active={active} />
      </div>
      <div className="chat-area">
        { active ? <ChatWindow wa_id={active} socket={socket} /> : <div className="empty">Select a chat to open</div> }
      </div>
    </div>
  );
}
