import React from 'react';

interface Props {
  board: { displayName: string; score: number; achievements?: string[]; missionCompleted?: boolean }[];
  isHost: boolean;
  onRestart: () => void;
  onEndGame: () => void;
  insights?: {
    mostMysterious?: string;
    mostPredictable?: string;
    funniest?: string;
    biggestChaosGenerator?: string;
  } | null;
  personalAchievements?: {
    achievements: string[];
    missionCompleted: boolean;
    missionDescription?: string;
  } | null;
}

const ACH_LABELS: Record<string, string> = {
  roast_king: '🔥 Roast King',
  chaos_agent: '💀 Chaos Agent',
  mind_reader: '🧠 Mind Reader',
};

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ board, isHost, onRestart, onEndGame, insights, personalAchievements }: Props) {
  return (
    <div style={{ textAlign: 'center' }}>
      {/* Trophy */}
      <div style={{ fontSize: 56, marginBottom: 4, animation: 'float 3s ease infinite' }}>🏆</div>
      <h2 style={titleStyle}>Final Leaderboard</h2>

      {/* Scoreboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
        {board.map((p, i) => (
          <div key={p.displayName} style={{
            ...rowStyle,
            borderLeft: i === 0 ? '3px solid var(--gold)' : i === 1 ? '3px solid #94a3b8' : i === 2 ? '3px solid #b45309' : '3px solid transparent',
            animation: 'slideInLeft 0.4s ease both',
            animationDelay: `${i * 0.08}s`,
          }}>
            <span style={{ fontSize: 22, width: 36, textAlign: 'center', flexShrink: 0 }}>
              {i < 3 ? MEDALS[i] : <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>#{i + 1}</span>}
            </span>
            <span style={{ flex: 1, fontWeight: 600 }}>
              {p.displayName}
              {p.achievements?.map(a => (
                <span key={a} style={achBadge}>{ACH_LABELS[a] || a}</span>
              ))}
              {p.missionCompleted && <span style={{ marginLeft: 6, fontSize: 13 }}>⭐</span>}
            </span>
            <span style={scoreBadge}>{p.score}</span>
          </div>
        ))}
      </div>

      {/* Personality Insights */}
      {insights && (
        <div style={insightCard}>
          <h3 style={{ marginTop: 0, fontSize: 18, fontWeight: 700 }}>🧠 Personality Insights</h3>
          {insights.funniest && <p style={insightRow}>😂 <strong>Funniest:</strong> {insights.funniest}</p>}
          {insights.mostMysterious && <p style={insightRow}>🕵️ <strong>Most Mysterious:</strong> {insights.mostMysterious}</p>}
          {insights.mostPredictable && <p style={insightRow}>🎯 <strong>Most Predictable:</strong> {insights.mostPredictable}</p>}
          {insights.biggestChaosGenerator && <p style={insightRow}>💥 <strong>Chaos Generator:</strong> {insights.biggestChaosGenerator}</p>}
        </div>
      )}

      {/* Personal Results */}
      {personalAchievements && (
        <div style={personalCard}>
          <h3 style={{ marginTop: 0, fontSize: 18, fontWeight: 700 }}>🎖 Your Results</h3>
          {personalAchievements.achievements.length > 0 && (
            <p style={insightRow}>Achievements: {personalAchievements.achievements.map(a => ACH_LABELS[a] || a).join(', ')}</p>
          )}
          {personalAchievements.missionDescription && (
            <p style={insightRow}>
              Secret Mission: {personalAchievements.missionDescription}
              {personalAchievements.missionCompleted ? ' ✅' : ' ❌'}
            </p>
          )}
        </div>
      )}

      {/* Host actions */}
      {isHost ? (
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onRestart} style={btnPrimary}>🔄 Play Again</button>
          <button onClick={onEndGame} style={btnDanger}>✖ End Game</button>
        </div>
      ) : (
        <p style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 24, animation: 'pulse 1.5s ease infinite' }}>
          Waiting for host…
        </p>
      )}
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  fontSize: 24, fontWeight: 800, margin: 0,
  background: 'linear-gradient(135deg, var(--gold), #f59e0b)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
};
const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 10,
  background: 'var(--bg-card)', borderRadius: 14,
  border: '1px solid var(--border-glass)',
};
const achBadge: React.CSSProperties = {
  marginLeft: 8, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
  background: 'rgba(124,92,252,0.15)', border: '1px solid rgba(124,92,252,0.2)',
};
const scoreBadge: React.CSSProperties = {
  fontWeight: 800, fontSize: 18, color: 'var(--gold)',
  background: 'rgba(251,191,36,0.1)', padding: '4px 14px', borderRadius: 10,
};
const insightCard: React.CSSProperties = {
  marginTop: 20, padding: '18px 20px', borderRadius: 16, textAlign: 'left',
  background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid var(--border-glass)', animation: 'fadeInUp 0.4s ease 0.2s both',
};
const personalCard: React.CSSProperties = {
  marginTop: 12, padding: '18px 20px', borderRadius: 16, textAlign: 'left',
  background: 'rgba(124,92,252,0.06)', border: '1px solid rgba(124,92,252,0.15)',
  animation: 'fadeInUp 0.4s ease 0.3s both',
};
const insightRow: React.CSSProperties = { margin: '6px 0', fontSize: 14 };
const btnPrimary: React.CSSProperties = {
  padding: '14px 28px', fontSize: 16, fontWeight: 600, borderRadius: 12,
  border: 'none', color: '#fff', cursor: 'pointer',
  background: 'linear-gradient(135deg, var(--accent), #6366f1)',
  boxShadow: '0 4px 14px var(--accent-glow)',
};
const btnDanger: React.CSSProperties = {
  padding: '14px 28px', fontSize: 16, fontWeight: 600, borderRadius: 12,
  border: 'none', color: '#fff', cursor: 'pointer',
  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
  boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
};
