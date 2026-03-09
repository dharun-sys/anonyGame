import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

export default function Lobby() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function create() {
    if (!displayName.trim()) { setError('Enter a display name'); return; }
    setLoading(true); setError('');
    socket.emit('create_room', { displayName: displayName.trim() }, (res: any) => {
      setLoading(false);
      if (res?.ok) {
        sessionStorage.setItem('anony_roomId', res.roomId);
        sessionStorage.setItem('anony_displayName', displayName.trim());
        navigate(`/room/${res.roomId}`);
      } else setError(res?.reason || 'Failed to create room');
    });
  }

  function join() {
    if (!displayName.trim()) { setError('Enter a display name'); return; }
    if (!roomCode.trim()) { setError('Enter a room code'); return; }
    setLoading(true); setError('');
    const upper = roomCode.trim().toUpperCase();
    socket.emit('join_room', { roomId: upper, displayName: displayName.trim() }, (res: any) => {
      setLoading(false);
      if (res?.ok) {
        sessionStorage.setItem('anony_roomId', res.roomId);
        sessionStorage.setItem('anony_displayName', displayName.trim());
        navigate(`/room/${res.roomId}`);
      } else setError(res?.reason || 'Failed to join');
    });
  }

  return (
    <div style={pageWrap}>
      {/* floating bg orbs */}
      <div style={orb1} />
      <div style={orb2} />

      <div style={card}>
        <div style={{ fontSize: 48, marginBottom: 4, animation: 'float 3s ease infinite' }}>🎭</div>
        <h1 style={title}>Anony Party</h1>
        <p style={subtitle}>Anonymous social party game</p>

        <div style={{ width: '100%', marginTop: 24 }}>
          <label style={label}>Display Name</label>
          <input
            placeholder="e.g. CoolKid42"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{ marginBottom: 16 }}
          />

          <button onClick={create} disabled={loading} style={btnPrimary}>
            ✨ Create Room
          </button>

          <div style={divider}>
            <span style={dividerLine} />
            <span style={{ color: 'var(--text-dim)', fontSize: 13, padding: '0 12px' }}>or join existing</span>
            <span style={dividerLine} />
          </div>

          <label style={label}>Room Code</label>
          <input
            placeholder="e.g. AB3XYZ"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            style={{ marginBottom: 16, letterSpacing: 4, textAlign: 'center', fontWeight: 700, fontSize: 18 }}
          />
          <button onClick={join} disabled={loading} style={btnSecondary}>
            🚀 Join Room
          </button>

          {error && <p style={errorStyle}>{error}</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Styles ── */
const pageWrap: React.CSSProperties = {
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  minHeight: '100vh', padding: 16, position: 'relative', overflow: 'hidden',
};
const orb1: React.CSSProperties = {
  position: 'fixed', top: '-20%', left: '-10%', width: 400, height: 400,
  borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,252,0.18), transparent 70%)',
  pointerEvents: 'none', animation: 'float 6s ease infinite',
};
const orb2: React.CSSProperties = {
  position: 'fixed', bottom: '-15%', right: '-10%', width: 350, height: 350,
  borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.12), transparent 70%)',
  pointerEvents: 'none', animation: 'float 8s ease infinite 1s',
};
const card: React.CSSProperties = {
  background: 'var(--bg-glass)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid var(--border-glass)', borderRadius: 24, padding: '40px 28px',
  width: '100%', maxWidth: 420, textAlign: 'center',
  animation: 'fadeInUp 0.5s ease', position: 'relative', zIndex: 1,
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};
const title: React.CSSProperties = {
  fontSize: 28, fontWeight: 800, margin: 0,
  background: 'linear-gradient(135deg, var(--accent-light), var(--accent2))',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
};
const subtitle: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 14, marginTop: 4 };
const label: React.CSSProperties = {
  display: 'block', textAlign: 'left', fontSize: 13, fontWeight: 600,
  color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1,
};
const btnPrimary: React.CSSProperties = {
  display: 'block', width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 600,
  borderRadius: 12, border: 'none', color: '#fff', cursor: 'pointer',
  background: 'linear-gradient(135deg, var(--accent), #6366f1)',
  boxShadow: '0 4px 14px var(--accent-glow)',
  transition: 'transform 0.15s, box-shadow 0.15s',
};
const btnSecondary: React.CSSProperties = {
  display: 'block', width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 600,
  borderRadius: 12, border: '1px solid var(--accent)', background: 'transparent',
  color: 'var(--accent-light)', cursor: 'pointer',
  transition: 'background 0.2s, color 0.2s',
};
const divider: React.CSSProperties = {
  display: 'flex', alignItems: 'center', margin: '20px 0',
};
const dividerLine: React.CSSProperties = {
  flex: 1, height: 1, background: 'var(--border-glass)',
};
const errorStyle: React.CSSProperties = {
  color: 'var(--red)', marginTop: 16, fontSize: 14,
  background: 'rgba(248,113,113,0.1)', padding: '8px 12px', borderRadius: 8,
};
