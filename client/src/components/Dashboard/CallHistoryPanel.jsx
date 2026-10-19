import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock3, Phone, PhoneCall, PhoneMissed, Video, Trash2, X } from 'lucide-react';
import { API_BASE_URL } from '../../api/config';

const formatDuration = seconds => `${Math.floor((seconds || 0) / 60)}:${String((seconds || 0) % 60).padStart(2, '0')}`;
const formatDate = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export default function CallHistoryPanel({ socket, user, onOpenConversation }) {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const token = localStorage.getItem('token');

  const loadHistory = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const response = await fetch(`${API_BASE_URL}/chat/call-history`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Call history could not be loaded.');
      setHistory(Array.isArray(data) ? data : []);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  useEffect(() => {
    if (!socket) return undefined;
    socket.on('call_history_updated', loadHistory);
    return () => socket.off('call_history_updated', loadHistory);
  }, [socket, loadHistory]);

  const userId = String(user?._id || user?.id || '');
  const removeHistory = async () => {
    if (!confirmAction) return;
    setBusy(true);
    setError('');
    try {
      const target = confirmAction.call;
      const response = await fetch(`${API_BASE_URL}/chat/call-history${target ? `/${target._id}` : ''}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Call history could not be deleted.');
      if (target) setHistory(current => current.filter(call => call._id !== target._id));
      else setHistory(current => current.filter(call => ['ringing', 'in_progress'].includes(call.status)));
      setConfirmAction(null);
    } catch (deleteError) {
      setError(deleteError.message);
      setConfirmAction(null);
    } finally {
      setBusy(false);
    }
  };
  return <section className="call-history" aria-label="Voice and video call history">
    <header className="call-history-heading"><div><span>YOUR ACTIVITY</span><h2>Call history</h2><p>Voice and video conversations, including missed calls.</p></div>{history.some(call => !['ringing', 'in_progress'].includes(call.status)) && <button className="call-history-clear" type="button" onClick={() => setConfirmAction({ type: 'all' })}><Trash2 size={14} /> Clear history</button>}</header>
    <div className="call-history-list" aria-live="polite">
      {loading && <p className="call-history-empty">Loading call history…</p>}
      {error && <p className="call-history-empty" role="alert">{error}</p>}
      {!loading && !error && history.map(call => {
        const outgoing = String(call.caller?._id || call.caller) === userId;
        const other = outgoing ? call.recipient : call.caller;
        const otherId = String(other?._id || other || '');
        const participantCount = Math.max(call.participants?.length || 0, 2);
        const isConference = participantCount > 2;
        const displayName = isConference ? `Conference call · ${participantCount} people` : other?.username || [other?.firstName, other?.lastName].filter(Boolean).join(' ') || 'Bazzar contact';
        const missed = ['missed', 'declined', 'failed'].includes(call.status);
        const DirectionIcon = missed ? PhoneMissed : outgoing ? ArrowUpRight : ArrowDownLeft;
        const TypeIcon = call.type === 'video' ? Video : Phone;
        const status = call.status === 'in_progress' ? 'In progress' : call.status.charAt(0).toUpperCase() + call.status.slice(1);
        const openConversation = () => isConference ? onOpenConversation({ type: 'group', id: call.room, name: displayName }) : otherId && onOpenConversation({ type: 'peer', id: otherId, name: displayName, avatar: other?.profileImage || null });
        return <div className="call-history-row" key={call._id || call.callId}>
          <button type="button" className="call-history-open" onClick={openConversation}>
            <span className={`call-history-icon ${missed ? 'is-missed' : ''}`}><DirectionIcon size={17} /></span>
            <span className="call-history-copy"><strong>{displayName}</strong><small>{outgoing ? 'Outgoing' : 'Incoming'} {call.type} · {status}</small></span>
            <span className="call-history-meta"><TypeIcon size={14} /><span>{formatDate(call.createdAt)}</span>{call.durationSeconds > 0 && <span><Clock3 size={11} style={{ verticalAlign: '-2px', marginRight: 3 }} />{formatDuration(call.durationSeconds)}</span>}</span>
          </button>
          {!['ringing', 'in_progress'].includes(call.status) && <button type="button" className="call-history-delete" aria-label={`Delete call with ${displayName}`} title="Delete call from history" onClick={() => setConfirmAction({ type: 'one', call })}><Trash2 size={15} /></button>}
        </div>;
      })}
      {!loading && !error && history.length === 0 && <div className="call-history-empty"><PhoneCall size={25} style={{ display: 'block', margin: '0 auto 10px', opacity: .55 }} />Your voice and video calls will appear here.</div>}
    </div>
    {confirmAction && <div className="call-history-confirm-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setConfirmAction(null); }}><section className="call-history-confirm" role="dialog" aria-modal="true" aria-labelledby="call-history-confirm-title"><button className="call-history-confirm-close" type="button" aria-label="Close" onClick={() => !busy && setConfirmAction(null)}><X size={17} /></button><span className="call-history-confirm-icon"><Trash2 size={19} /></span><h3 id="call-history-confirm-title">{confirmAction.type === 'all' ? 'Clear call history?' : 'Delete this call?'}</h3><p>{confirmAction.type === 'all' ? 'All completed and missed calls will be removed from your history. Active calls will stay.' : 'This call will be removed from your history.'}</p><div><button type="button" onClick={() => setConfirmAction(null)} disabled={busy}>Keep history</button><button type="button" onClick={removeHistory} disabled={busy}>{busy ? 'Deleting…' : 'Delete'}</button></div></section></div>}
  </section>;
}
