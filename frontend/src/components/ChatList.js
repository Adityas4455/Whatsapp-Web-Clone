import React from 'react';

export default function ChatList({ conversations, onSelect, active }){
  return (
    <div className="chat-list">
      {conversations.map(conv => {
        const last = conv.lastMessage || {};
        return (
          <div key={conv._id} className={`chat-item ${active===conv._id ? 'active':''}`} onClick={() => onSelect(conv._id)}>
            <div className="chat-title">{conv._id || 'Unknown'}</div>
            <div className="chat-sub">{ last.text ? (last.text.length > 30 ? last.text.slice(0,30)+'...' : last.text) : 'No messages' }</div>
            <div className="chat-time">{ last.timestamp ? new Date(last.timestamp).toLocaleString() : '' }</div>
          </div>
        );
      })}
    </div>
  );
}
