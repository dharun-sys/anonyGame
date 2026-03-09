import React, { useState } from 'react';

interface Props {
  round: {
    roundIndex: number;
    totalRounds: number;
    type: string;
    questionText: string;
    targetPlayerId: string;
    targetPlayerId2?: string;
    targetName: string;
    targetName2?: string;
  };
  timeLeft: number;
  isTarget: boolean;
  submitted: boolean;
  onSubmit: (text: string) => void;
  secretPhrase?: string;
  isLieDetectionTarget?: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  standard: '💬 Standard', caption: '📱 Caption', future: '🔮 Future',
  excuse: '🙈 Excuse', prediction: '🎱 Prediction', secret_word: '🔤 One Word',
  double: '👯 Double Target',
  lie_detection: '🕵️ Lie Detection', compliment: '💖 Compliment',
  secret_phrase: '🔏 Secret Phrase',
};

export default function Game({ round, timeLeft, isTarget, submitted, onSubmit, secretPhrase, isLieDetectionTarget }: Props) {
  const [answer, setAnswer] = useState('');

  function handleSubmit() {
    if (!answer.trim()) return;
    onSubmit(answer.trim());
    setAnswer('');
  }

  const isLDTarget = round.type === 'lie_detection' && isLieDetectionTarget;
  const canAnswer = isLDTarget || !isTarget;
  const timerDanger = timeLeft > 0 && timeLeft <= 5;

  return (
    <div style={wrap}>
      {/* Round info bar */}
      <div style={roundBar}>
        <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>
          Round {round.roundIndex + 1}/{round.totalRounds}
        </span>
        <span style={typeBadge}>{TYPE_LABEL[round.type] || round.type}</span>
      </div>

      {/* Question */}
      <h3 style={questionStyle}>{round.questionText}</h3>

      {/* Timer */}
      {timeLeft > 0 && (
        <div style={{
          ...timerStyle,
          color: timerDanger ? 'var(--red)' : 'var(--accent-light)',
          animation: timerDanger ? 'countdownPulse 0.5s ease infinite' : 'none',
        }}>
          ⏱ {timeLeft}s
        </div>
      )}

      {/* Secret phrase banner */}
      {secretPhrase && (
        <div style={secretBanner}>
          🔏 Your secret word: <strong>{secretPhrase}</strong> — sneak it into your answer!
        </div>
      )}

      {/* Lie detection target banner */}
      {isLDTarget && (
        <div style={lieBanner}>
          🕵️ You're the target — write your <strong>REAL</strong> answer!
        </div>
      )}

      {/* Target waiting */}
      {isTarget && !isLDTarget ? (
        <div style={targetWait}>
          <div style={{ fontSize: 36, marginBottom: 8, animation: 'float 3s ease infinite' }}>🎯</div>
          <p style={{ color: 'var(--text-dim)', margin: 0 }}>You're the target — sit back and relax!</p>
          {round.type === 'double' && round.targetName2 && (
            <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: '4px 0 0' }}>Along with {round.targetName2}</p>
          )}
        </div>
      ) : submitted ? (
        <div style={targetWait}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
          <p style={{ color: 'var(--green)', margin: 0, fontWeight: 600 }}>Answer submitted!</p>
          <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: '4px 0 0' }}>Waiting for others…</p>
        </div>
      ) : canAnswer ? (
        <div style={{ marginTop: 16 }}>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder={round.type === 'secret_word' ? 'One word only…' : 'Type your answer…'}
            rows={round.type === 'secret_word' ? 1 : 3}
            style={{ marginBottom: 12, resize: 'none' }}
          />
          <button onClick={handleSubmit} style={submitBtn}>
            🚀 Submit Answer
          </button>
        </div>
      ) : null}
    </div>
  );
}

const wrap: React.CSSProperties = {
  background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border-glass)', borderRadius: 20, padding: '20px 18px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
};
const roundBar: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
};
const typeBadge: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
  background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
};
const questionStyle: React.CSSProperties = {
  fontSize: 18, fontWeight: 700, lineHeight: 1.4, marginBottom: 12,
  background: 'linear-gradient(135deg, var(--text-bright), var(--accent-light))',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
};
const timerStyle: React.CSSProperties = {
  fontSize: 22, fontWeight: 800, marginBottom: 12,
};
const secretBanner: React.CSSProperties = {
  background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)',
  padding: '10px 14px', borderRadius: 12, marginBottom: 12, fontSize: 14,
};
const lieBanner: React.CSSProperties = {
  background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
  padding: '10px 14px', borderRadius: 12, marginBottom: 12, fontSize: 14,
};
const targetWait: React.CSSProperties = {
  textAlign: 'center', padding: '28px 16px',
};
const submitBtn: React.CSSProperties = {
  width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 600, borderRadius: 12,
  border: 'none', color: '#fff', cursor: 'pointer',
  background: 'linear-gradient(135deg, var(--accent), #6366f1)',
  boxShadow: '0 4px 14px var(--accent-glow)',
};
