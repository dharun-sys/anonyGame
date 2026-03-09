import React from 'react';
import { socket } from '../socket';

interface Props {
  answers: { answerId: string; text: string; reactions?: Record<string, any> }[];
  onReact: (answerId: string, emoji: string) => void;
  roundType?: string;
}

const EMOJIS = ['😂', '🔥', '💀', '👏', '😮', '🤣', '💯', '🧠', '😈', '❤️', '🤮', '😭'];

export default function Reveal({ answers, onReact, roundType }: Props) {
  const hint: Record<string, string> = {
    lie_detection: '🕵️ One of these is the REAL answer…',
    compliment: '💖 Wholesome answers incoming…',
  };

  return (
    <div style={wrap}>
      <h3 style={heading}>📝 Answers are in!</h3>
      <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 16 }}>
        {hint[roundType || ''] || 'React to your favorites — voting starts soon…'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {answers.map((a, i) => (
          <div key={a.answerId} style={{ ...answerCard, animationDelay: `${i * 0.08}s` }}>
            <div style={{ fontSize: 15, lineHeight: 1.5 }}>
              <span style={answerNum}>#{i + 1}</span> {a.text}
            </div>
            <div style={emojiRow}>
              {EMOJIS.map(em => {
                const reactors = a.reactions?.[em] || [];
                const count = Array.isArray(reactors) ? reactors.length : 0;
                const isMine = Array.isArray(reactors) && reactors.some((r: any) => r.pid === socket.id || r === socket.id);
                return (
                  <button
                    key={em}
                    onClick={() => onReact(a.answerId, em)}
                    style={{
                      ...emojiBtn,
                      background: isMine ? 'var(--accent)' : count > 0 ? 'rgba(255,255,255,0.08)' : 'transparent',
                      border: isMine ? '1.5px solid var(--accent-light)' : '1px solid var(--border-glass)',
                      transform: isMine ? 'scale(1.1)' : 'scale(1)',
                      boxShadow: isMine ? '0 0 8px var(--accent-glow)' : 'none',
                    }}
                  >
                    {em} {count > 0 && <span style={{ fontSize: 10, marginLeft: 2 }}>{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {answers.length === 0 && (
        <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 20 }}>No answers submitted.</p>
      )}
    </div>
  );
}

const wrap: React.CSSProperties = {
  background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border-glass)', borderRadius: 20, padding: '20px 18px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
};
const heading: React.CSSProperties = {
  fontSize: 20, fontWeight: 700, margin: '0 0 4px',
};
const answerCard: React.CSSProperties = {
  background: 'var(--bg-card)', padding: '14px 16px', borderRadius: 14,
  border: '1px solid var(--border-glass)',
  animation: 'fadeInUp 0.35s ease both',
};
const answerNum: React.CSSProperties = {
  color: 'var(--accent-light)', fontWeight: 700, marginRight: 4,
};
const emojiRow: React.CSSProperties = {
  display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap',
};
const emojiBtn: React.CSSProperties = {
  borderRadius: 8, padding: '4px 7px', cursor: 'pointer',
  fontSize: 15, color: '#fff', minWidth: 32, textAlign: 'center',
  transition: 'all 0.15s ease',
};
