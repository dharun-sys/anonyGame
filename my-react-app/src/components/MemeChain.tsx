import React, { useState } from 'react';

interface Props {
  chain: { displayName: string; text: string }[];
  prompt: string;
  myTurn: { prompt: string; chain: any[] } | null;
  isVoting: boolean;
  result?: { winnerIndex: number; winnerName: string } | null;
  onSubmit: (text: string) => void;
  onVote: (entryIndex: number) => void;
}

export default function MemeChain({ chain, prompt, myTurn, isVoting, result, onSubmit, onVote }: Props) {
  const [text, setText] = useState('');
  const [voted, setVoted] = useState(false);

  function handleSubmit() {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
  }

  function handleVote(idx: number) {
    onVote(idx);
    setVoted(true);
  }

  return (
    <div style={wrap}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 40, marginBottom: 4 }}>📝</div>
        <h2 style={titleStyle}>Meme Chain</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>{prompt}</p>
      </div>

      {chain.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          {chain.map((entry, i) => {
            const isWinner = result?.winnerIndex === i;
            return (
              <div key={i} style={{
                ...chainCard,
                borderLeft: isWinner ? '3px solid var(--gold)' : '3px solid transparent',
                background: isWinner ? 'rgba(251,191,36,0.08)' : 'var(--bg-card)',
                animation: 'slideInLeft 0.3s ease both',
                animationDelay: `${i * 0.06}s`,
              }}>
                <span style={{ flex: 1 }}>
                  <strong style={{ color: 'var(--accent-light)' }}>{entry.displayName}:</strong>{' '}
                  {entry.text}
                  {isWinner && <span style={{ marginLeft: 8 }}>👑</span>}
                </span>
                {isVoting && !voted && !result && (
                  <button onClick={() => handleVote(i)} style={voteBtn}>Vote</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {myTurn && !isVoting && (
        <div style={{ marginTop: 20, animation: 'fadeInUp 0.35s ease' }}>
          <div style={turnBanner}>✍️ It's your turn! Continue the chain:</div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add your line…"
            rows={2}
            style={{ marginBottom: 12, resize: 'none' }}
          />
          <button onClick={handleSubmit} style={submitBtn}>🚀 Submit</button>
        </div>
      )}

      {!myTurn && !isVoting && chain.length > 0 && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 28, marginBottom: 4, animation: 'float 3s ease infinite' }}>⏳</div>
          <p style={{ color: 'var(--text-dim)', margin: 0 }}>Waiting for the next player…</p>
        </div>
      )}

      {isVoting && voted && (
        <div style={{ textAlign: 'center', padding: 20, animation: 'fadeIn 0.3s ease' }}>
          <p style={{ color: 'var(--green)', fontWeight: 600 }}>✅ Vote cast! Waiting…</p>
        </div>
      )}

      {result && (
        <div style={{ textAlign: 'center', marginTop: 20, animation: 'popIn 0.4s ease' }}>
          <div style={{ fontSize: 40, marginBottom: 4 }}>🏆</div>
          <h3 style={{ margin: 0, fontSize: 20 }}>Winner: <span style={{ color: 'var(--gold)' }}>{result.winnerName}</span>!</h3>
        </div>
      )}
    </div>
  );
}

const wrap: React.CSSProperties = {
  background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border-glass)', borderRadius: 20, padding: '24px 20px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
};
const titleStyle: React.CSSProperties = {
  fontSize: 22, fontWeight: 800, margin: 0,
  background: 'linear-gradient(135deg, var(--accent-light), var(--accent2))',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
};
const chainCard: React.CSSProperties = {
  padding: '12px 16px', borderRadius: 14,
  border: '1px solid var(--border-glass)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
};
const turnBanner: React.CSSProperties = {
  background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
  padding: '10px 14px', borderRadius: 12, marginBottom: 12,
  color: 'var(--green)', fontWeight: 600, fontSize: 14,
};
const submitBtn: React.CSSProperties = {
  width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 600, borderRadius: 12,
  border: 'none', color: '#fff', cursor: 'pointer',
  background: 'linear-gradient(135deg, var(--accent), #6366f1)',
  boxShadow: '0 4px 14px var(--accent-glow)',
};
const voteBtn: React.CSSProperties = {
  padding: '8px 18px', fontSize: 14, fontWeight: 600, borderRadius: 10,
  border: 'none', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
  background: 'linear-gradient(135deg, var(--accent), #6366f1)',
  boxShadow: '0 2px 8px var(--accent-glow)', flexShrink: 0,
};
