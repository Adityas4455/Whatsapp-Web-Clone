import React from 'react';

export default function MessageBubble({ m }){
  const mine = m.from === 'me' || m.from === 'Me' || m.from === undefined;
  return (
    <div className={`bubble-row ${mine ? 'mine':'theirs'}`}>
      <div className="bubble">
        <div className="bubble-text">{m.text || (m.raw && JSON.stringify(m.raw).slice(0,200))}</div>
        <div className="bubble-meta">
          <small>{ new Date(m.timestamp || m.createdAt).toLocaleString() } • {m.status}</small>
        </div>
      </div>
    </div>
  );
}
