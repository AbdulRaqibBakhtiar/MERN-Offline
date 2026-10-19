import React, { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../../api/config';
import { useSocket } from '../../context/SocketContext';

export default function ProductChatModal({ product, conversationId, token, user, onClose, presentation = 'modal' }) {
  const [activeConversationId, setActiveConversationId] = useState(conversationId || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [vendor, setVendor] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const { socket } = useSocket() || {};
  const endRef = useRef(null);
  useEffect(() => {
    setActiveConversationId(conversationId || null);
    setMessages([]);
    setError('');
  }, [product?._id, conversationId]);
  useEffect(() => {
    let active = true;
    fetch(conversationId ? `${API_BASE_URL}/inventory/conversations/${conversationId}` : `${API_BASE_URL}/inventory/${product._id}/conversation`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not load chat.'); return data; })
      .then(data => { if (active) { setMessages(data.messages || []); setVendor(data.vendor); if (data.conversationId) setActiveConversationId(data.conversationId); } })
      .catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [product?._id, conversationId, token]);
  useEffect(() => {
    if (!socket || !activeConversationId) return undefined;
    const receiveMessage = event => {
      if (String(event.conversationId) !== String(activeConversationId)) return;
      setMessages(current => current.some(message => String(message._id) === String(event.message?._id)) ? current : [...current, event.message]);
    };
    socket.on('product_conversation_message', receiveMessage);
    return () => socket.off('product_conversation_message', receiveMessage);
  }, [socket, activeConversationId]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async event => {
    event.preventDefault();
    const message = text.trim();
    if (!message || sending) return;
    setSending(true); setError('');
    try {
      const response = await fetch(activeConversationId ? `${API_BASE_URL}/inventory/conversations/${activeConversationId}/messages` : `${API_BASE_URL}/inventory/${product._id}/conversation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ text: message })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Message could not be sent.');
      if (data.conversationId) setActiveConversationId(data.conversationId);
      setMessages(current => current.some(message => String(message._id) === String(data.message?._id)) ? current : [...current, data.message]); setText('');
    } catch (err) { setError(err.message); }
    finally { setSending(false); }
  };

  const isDrawer = presentation === 'drawer';
  return <div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }} style={isDrawer ? { position: 'fixed', right: 24, bottom: 0, zIndex: 100000, width: 'min(420px, calc(100vw - 24px))', height: 'min(650px, calc(100vh - 24px))' } : { position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(15,23,42,.58)', display: 'grid', placeItems: 'center', padding: 16 }}>
    <section role="dialog" aria-modal="true" aria-label={`Chat about ${product?.name || 'product'}`} style={{ width: isDrawer ? '100%' : 'min(100%, 520px)', height: isDrawer ? '100%' : 'min(78vh, 650px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: isDrawer ? '18px 18px 0 0' : 18, background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 24px 70px rgba(0,0,0,.25)' }}>
      <header style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><strong style={{ color: 'var(--text-primary, #0f172a)' }}>{vendor?.username || 'Seller'}</strong><div style={{ color: 'var(--text-muted, #64748b)', fontSize: 13 }}>About {product?.name || 'product'}</div></div>
        <button type="button" onClick={onClose} aria-label="Close chat" style={{ border: 0, background: 'transparent', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted, #64748b)' }}>×</button>
      </header>
      <div aria-live="polite" style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!messages.length && !error && <p style={{ color: 'var(--text-muted, #64748b)', textAlign: 'center', margin: 'auto' }}>Ask the seller about this listing.</p>}
        {messages.map(message => { const mine = String(message.sender?._id || message.sender) === String(user?._id || user?.id); return <div key={message._id || message.createdAt} style={{ maxWidth: '82%', alignSelf: mine ? 'flex-end' : 'flex-start', background: mine ? '#2563eb' : 'var(--bg-main, #f1f5f9)', color: mine ? '#fff' : 'var(--text-primary, #0f172a)', borderRadius: 14, padding: '10px 13px' }}><small style={{ display: 'block', opacity: .75, marginBottom: 3 }}>{mine ? 'You' : message.senderName}</small>{message.text}</div>; })}
        {error && <p role="alert" style={{ color: '#b91c1c', textAlign: 'center' }}>{error}</p>}<div ref={endRef} />
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: 8, padding: 14, borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
        <input value={text} onChange={event => setText(event.target.value)} maxLength={2000} placeholder="Write a message…" aria-label="Message seller" style={{ flex: 1, minWidth: 0, border: '1px solid var(--border-color, #cbd5e1)', borderRadius: 10, padding: '11px 12px', background: 'var(--bg-main, #fff)', color: 'var(--text-primary, #0f172a)' }} />
        <button disabled={sending || !text.trim()} type="submit" style={{ border: 0, borderRadius: 10, background: '#2563eb', color: '#fff', fontWeight: 700, padding: '0 17px', cursor: 'pointer', opacity: sending || !text.trim() ? .6 : 1 }}>{sending ? '…' : 'Send'}</button>
      </form>
    </section>
  </div>;
}
