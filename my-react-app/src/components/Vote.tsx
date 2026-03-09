import React, { useState } from 'react';
import { socket } from '../socket';

interface Props {
  answers: { answerId: string; text: string }[];
  isTarget: boolean;
  onVote: (value: string) => void;
  voteType: string;
  players: { id: string; displayName: string }[];
  timeLeft: number;
  roundType?: string;
}

export default function Vote({ answers, isTarget, onVote, voteType, players, timeLeft }: Props) {
  const [voted, setVoted] = useState(false);

  function handleVote(val: string) {
    onVote(val);
    setVoted(true);
  }

  const canVote =
    voteType === 'secret_phrase' ? isTarget :
    voteType === 'lie_detection' ? !isTarget :
    isTarget;

  const timerDanger = timeLeft > 0 && timeLeft <= 10;

  return (
    <div style={wrap}>
      <h3 style={heading}>🗳 Voting Time!</h3>
      <div style={{
        ...timerStyle,
        color: timerDanger ? 'var(--red)' : 'var(--accent-light)',
        animation: timerDanger ? 'countdownPulse 0.5s ease infinite' : 'none',
      }}>
        ⏱ {timeLeft}s
      </div>

      {/* ── SECRET PHRASE ── */}
      {voteType === 'secret_phrase' && (
        <>
          {isTarget ? (
            voted ? <StatusMsg text="Guess submitted! Waiting for reveal…" color="var(--green)" /> : (
              <>
                <p style={prompt}>🔤 Someone sneaked a secret word in. <strong>Who was it?</strong></p>
                <div style={listWrap}>
                  {players.filter(p => p.id !== socket.id).map((p, i) => (
                    <div key={p.id} style={{ ...cardItem, animationDelay: `${i * 0.06}s` }}>
                      <span style={{ fontWeight: 600 }}>{p.displayName}</span>
                      <button onClick={() => handleVote(p.id)} style={voteBtn}>It's them!</button>
                    </div>
                  ))}
                </div>
              </>
            )
          ) : (
            <WaitMsg text="The target is guessing who sneaked the secret word… 🕵️" />
          )}
        </>
      )}

      {/* ── LIE DETECTION ── */}
      {voteType === 'lie_detection' && (
        <>
          {isTarget ? (
            <WaitMsg text="You're the target — waiting for others to guess…" />
          ) : voted ? (
            <StatusMsg text="Vote cast! Waiting…" color="var(--green)" />
          ) : (
            <>
              <p style={prompt}>🕵️ Which answer is the <strong>REAL</strong> one?</p>
              <div style={listWrap}>
                {answers.map((a, i) => (
                  <div key={a.answerId} style={{ ...cardItem, animationDelay: `${i * 0.06}s` }}>
                    <span><span style={ansNum}>#{i + 1}</span> {a.text}</span>
                    <button onClick={() => handleVote(a.answerId)} style={voteBtn}>This one</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── STANDARD / DOUBLE / OTHERS ── */}
      {voteType !== 'lie_detection' && voteType !== 'secret_phrase' && (
        <>
          {canVote && !voted && <p style={prompt}>Pick the best answer!</p>}
          {canVote && voted && <StatusMsg text="Vote cast! Waiting…" color="var(--green)" />}
          {!canVote && <WaitMsg text="Waiting for the target to vote…" />}

          <div style={listWrap}>
            {answers.map((a, i) => (
              <div key={a.answerId} style={{ ...cardItem, animationDelay: `${i * 0.06}s` }}>
                <span><span style={ansNum}>#{i + 1}</span> {a.text}</span>
                {canVote && !voted && (
                  <button onClick={() => handleVote(a.answerId)} style={voteBtn}>Vote</button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatusMsg({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 16px', animation: 'fadeInUp 0.3s ease' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
      <p style={{ color, fontWeight: 600, margin: 0 }}>{text}</p>
    </div>
  );
}

function WaitMsg({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 16px' }}>
      <div style={{ fontSize: 32, marginBottom: 8, animation: 'float 3s ease infinite' }}>⏳</div>
      <p style={{ color: 'var(--text-dim)', margin: 0 }}>{text}</p>
    </div>
  );
}

const wrap: React.CSSProperties = {
  background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border-glass)', borderRadius: 20, padding: '20px 18px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
};
const heading: React.CSSProperties = { fontSize: 20, fontWeight: 700, margin: '0 0 4px' };
const timerStyle: React.CSSProperties = { fontSize: 22, fontWeight: 800, marginBottom: 12 };
const prompt: React.CSSProperties = { color: 'var(--text)', fontSize: 15, marginBottom: 12 };
const listWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 };
const cardItem: React.CSSProperties = {
  background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 14,
  border: '1px solid var(--border-glass)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
  animation: 'fadeInUp 0.3s ease both',
};
const ansNum: React.CSSProperties = { color: 'var(--accent-light)', fontWeight: 700, marginRight: 6 };
const voteBtn: React.CSSProperties = {
  padding: '8px 18px', fontSize: 14, fontWeight: 600, borderRadius: 10,
  border: 'none', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
  background: 'linear-gradient(135deg, var(--accent), #6366f1)',
  boxShadow: '0 2px 8px var(--accent-glow)',
  flexShrink: 0,
};
