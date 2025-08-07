import React, { useEffect, useState, useRef } from 'react';
import API from '../api';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ wa_id, socket }){
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef();

  useEffect(() => {
    fetchMessages();
  }, [wa_id]);

  useEffect(() => {
    if(!socket) return;
    socket.on('message', (m) => {
      if(m.wa_id === wa_id){
        setMessages(prev => [...prev, m]);
        scrollToBottom();
      }
    });
    socket.on('status_update', () => fetchMessages());
    return () => {
      socket.off('message');
      socket.off('status_update');
    };
  }, [socket, wa_id]);

  async function fetchMessages(){
    const res = await API.get(`/api/conversations/${encodeURIComponent(wa_id)}`);
    setMessages(res.data || []);
    scrollToBottom();
  }

  function scrollToBottom(){ setTimeout(()=> bottomRef.current?.scrollIntoView({behavior:'smooth'}),50); }

  async function sendMessage(e){
    e.preventDefault();
    if(!text.trim()) return;
    await API.post(`/api/conversations/${encodeURIComponent(wa_id)}/messages`, { text, to: wa_id, from: 'me' });
    setText('');
    fetchMessages();
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="name">{wa_id}</div>
      </div>
      <div className="chat-body">
        {messages.map(m => <MessageBubble key={m._id || m.message_id || Math.random()} m={m} />)}
        <div ref={bottomRef} />
      </div>
      <form className="chat-input" onSubmit={sendMessage}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Type a message" />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
