import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import Game from './Game';
import Reveal from './Reveal';
import Vote from './Vote';
import Leaderboard from './Leaderboard';
import MemeChain from './MemeChain';

type View = 'joining' | 'waiting' | 'game' | 'reveal' | 'vote' | 'result' | 'leaderboard' | 'meme_chain';

interface RoomState {
  roomId: string;
  hostId: string;
  players: { id: string; displayName: string; score: number; connected: boolean }[];
  gameStarted: boolean;
  currentRoundIndex: number;
  totalRounds: number;
  gameMode: string;
}

interface RoundData {
  roundIndex: number;
  totalRounds: number;
  type: string;
  questionText: string;
  targetPlayerId: string;
  targetPlayerId2?: string;
  targetName: string;
  targetName2?: string;
  timeLimit: number;
  isSecretPhraseRound: boolean;
}

interface AnonymousAnswer {
  answerId: string;
  text: string;
  reactions?: Record<string, any>;
}

export default function RoomView() {
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const roomId = urlRoomId?.toUpperCase() || '';

  const [view, setView] = useState<View>('joining');
  const [_displayName, setDisplayName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [round, setRound] = useState<RoundData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [voteTimeLeft, setVoteTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<AnonymousAnswer[]>([]);
  const [isTarget, setIsTarget] = useState(false);
  const [isTarget2, setIsTarget2] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [roundResult, setRoundResult] = useState<any>(null);
  const [secretMission, setSecretMission] = useState('');
  const [secretPhrase, setSecretPhrase] = useState('');
  const [isLieDetectionTarget, setIsLieDetectionTarget] = useState(false);
  const [personalAchievements, setPersonalAchievements] = useState<any>(null);
  const [voteType, setVoteType] = useState('standard');
  const [votePlayers, setVotePlayers] = useState<{ id: string; displayName: string }[]>([]);
  // meme chain
  const [memeChain, setMemeChain] = useState<any>(null);
  const [memeChainTurn, setMemeChainTurn] = useState<any>(null);
  const [memeChainVoting, setMemeChainVoting] = useState(false);

  /* ── auto-rejoin on mount ── */
  useEffect(() => {
    const savedName = sessionStorage.getItem('anony_displayName');
    const savedRoom = sessionStorage.getItem('anony_roomId');
    if (savedName && savedRoom === roomId) {
      socket.emit('rejoin_room', { roomId, displayName: savedName }, (res: any) => {
        if (res?.ok) { setDisplayName(savedName); setView('waiting'); }
      });
    }
  }, [roomId]);

  /* ── socket listeners ── */
  useEffect(() => {
    socket.on('room_state', (data: RoomState) => setRoomState(data));
    socket.on('game_started', () => { setView('waiting'); setError(''); });

    socket.on('new_round', (data: RoundData) => {
      setRound(data);
      setTimeLeft(data.timeLimit);
      setAnswers([]);
      setSubmitted(false);
      setRoundResult(null);
      setSecretPhrase('');
      setIsLieDetectionTarget(false);
      setIsTarget(data.targetPlayerId === socket.id);
      setIsTarget2(data.targetPlayerId2 === socket.id);
      setView('game');
    });

    socket.on('round_timer', (d: { timeLeft: number }) => setTimeLeft(d.timeLeft));
    socket.on('vote_timer', (d: { timeLeft: number }) => setVoteTimeLeft(d.timeLeft));

    socket.on('reveal_answers', (data: { answers: AnonymousAnswer[] }) => {
      setAnswers(data.answers);
      setView('reveal');
    });

    socket.on('reaction_update', (data: { answerId: string; reactions: any }) => {
      setAnswers(prev =>
        prev.map(a => (a.answerId === data.answerId ? { ...a, reactions: data.reactions } : a)),
      );
    });

    socket.on('voting_phase', (data: any) => {
      setAnswers(data.answers || []);
      setVoteType(data.type || 'standard');
      setVotePlayers(data.players || []);
      setVoteTimeLeft(data.voteTimeLimit || 60);
      setIsTarget(data.targetPlayerId === socket.id);
      setIsTarget2(data.targetPlayerId2 === socket.id);
      setView('vote');
    });

    socket.on('round_result', (data: any) => { setRoundResult(data); setView('result'); });
    socket.on('round_skipped', () => { /* next round auto-fires */ });

    socket.on('leaderboard', (data: any) => {
      setLeaderboard(data.leaderboard || []);
      setInsights(data.insights || null);
      setView('leaderboard');
    });

    socket.on('game_error', (data: { message: string }) => setError(data.message));
    socket.on('secret_mission', (data: { mission: string }) => setSecretMission(data.mission));
    socket.on('secret_phrase_assignment', (data: { phrase: string }) => setSecretPhrase(data.phrase));
    socket.on('lie_detection_target', () => setIsLieDetectionTarget(true));
    socket.on('your_achievements', (data: any) => setPersonalAchievements(data));

    socket.on('game_restarted', () => {
      setRound(null); setAnswers([]); setLeaderboard([]); setSubmitted(false);
      setIsTarget(false); setError(''); setSecretMission('');
      setSecretPhrase(''); setPersonalAchievements(null); setRoundResult(null);
      setMemeChain(null); setMemeChainTurn(null); setMemeChainVoting(false);
      setView('waiting');
    });

    socket.on('room_ended', () => {
      sessionStorage.removeItem('anony_roomId');
      sessionStorage.removeItem('anony_displayName');
      navigate('/');
    });

    // meme chain
    socket.on('meme_chain_started', (data: any) => { setMemeChain(data); setView('meme_chain'); });
    socket.on('meme_chain_update', (data: any) => { setMemeChain((prev: any) => ({ ...prev, ...data })); });
    socket.on('meme_chain_your_turn', (data: any) => { setMemeChainTurn(data); });
    socket.on('meme_chain_vote', (data: any) => { setMemeChain((prev: any) => ({ ...prev, ...data })); setMemeChainVoting(true); });
    socket.on('meme_chain_result', (data: any) => { setMemeChain((prev: any) => ({ ...prev, result: data })); });

    return () => {
      const events = [
        'room_state','game_started','new_round','round_timer','vote_timer',
        'reveal_answers','reaction_update','voting_phase','round_result','round_skipped',
        'leaderboard','game_error','secret_mission','secret_phrase_assignment',
        'lie_detection_target','your_achievements','game_restarted','room_ended',
        'meme_chain_started','meme_chain_update','meme_chain_your_turn','meme_chain_vote','meme_chain_result',
      ];
      events.forEach(e => socket.off(e));
    };
  }, [navigate]);

  /* ── actions ── */
  const joinThisRoom = () => {
    if (!nameInput.trim()) { setError('Enter a display name'); return; }
    socket.emit('join_room', { roomId, displayName: nameInput.trim() }, (res: any) => {
      if (res?.ok) {
        setDisplayName(nameInput.trim());
        sessionStorage.setItem('anony_roomId', roomId);
        sessionStorage.setItem('anony_displayName', nameInput.trim());
        setView('waiting');
      } else setError(res?.reason || 'Failed to join');
    });
  };

  const doStartGame = (mode?: string) => socket.emit('start_game', { roomId, mode });
  const doSubmit = (text: string) => { socket.emit('submit_answer', { roomId, text }); setSubmitted(true); };
  const doVote = (value: string) => socket.emit('vote_answer', { roomId, answerId: value, value });
  const doReact = (answerId: string, emoji: string) => socket.emit('react_answer', { roomId, answerId, emoji });
  const doRestart = () => socket.emit('restart_game', { roomId });
  const doEndGame = () => socket.emit('end_game', { roomId });
  const doMemeSubmit = (text: string) => { socket.emit('meme_chain_submit', { roomId, text }); setMemeChainTurn(null); };
  const doMemeVote = (idx: number) => socket.emit('meme_chain_vote', { roomId, entryIndex: idx });

  const isHost = roomState?.hostId === socket.id;

  /* ── JOINING ── */
  if (view === 'joining') {
    return (
      <div style={pageCenter}>
        <div style={glassCard}>
          <div style={{ fontSize: 40, marginBottom: 8, animation: 'float 3s ease infinite' }}>🎭</div>
          <h2 style={headingGrad}>Join Room</h2>
          <div style={roomBadge}>{roomId}</div>
          <div style={{ width: '100%', marginTop: 20 }}>
            <input
              placeholder="Your display name"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && joinThisRoom()}
              style={{ marginBottom: 12 }}
            />
            {error && <p style={errorBox}>{error}</p>}
            <button onClick={joinThisRoom} style={btnPrimary}>🚀 Join Game</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── MEME CHAIN ── */
  if (view === 'meme_chain') {
    return (
      <div style={mainWrap}>
        <MemeChain
          chain={memeChain?.chain || []}
          prompt={memeChain?.prompt || ''}
          myTurn={memeChainTurn}
          isVoting={memeChainVoting}
          result={memeChain?.result}
          onSubmit={doMemeSubmit}
          onVote={doMemeVote}
        />
      </div>
    );
  }

  /* ── MAIN ROOM VIEW ── */
  return (
    <div style={mainWrap}>
      {/* HEADER — only show during active gameplay, not in waiting lobby */}
      {view !== 'waiting' && (
        <header style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              <span style={{ opacity: 0.5, fontWeight: 400, fontSize: 14 }}>Room</span>{' '}
              <span style={roomCodeHeader}>{roomId}</span>
              <span
                onClick={() => { navigator.clipboard.writeText(window.location.href); }}
                title="Copy room link"
                style={{ cursor: 'pointer', fontSize: 16, marginLeft: 8, opacity: 0.6, transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
              >📋</span>
            </h2>
            {roomState && round && (
              <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500 }}>
                Round {(roomState.currentRoundIndex ?? 0) + 1}/{roomState.totalRounds}
              </span>
            )}
          </div>
          {secretMission && (
            <div style={missionBar}>🎯 <span style={{ opacity: 0.7 }}>Mission:</span> {secretMission}</div>
          )}
        </header>
      )}

      {error && <div style={errorBox}>{error}</div>}

      {/* WAITING — Players shown big & centered */}
      {view === 'waiting' && !roomState?.gameStarted && (
        <div style={{ ...glassSection, textAlign: 'center', animation: 'fadeInUp 0.4s ease', padding: '32px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 8, animation: 'float 3s ease infinite' }}>🎭</div>
          <h2 style={{ ...headingGrad, fontSize: 22, marginBottom: 4 }}>Lobby</h2>
          <div style={{ ...roomBadge, marginBottom: 4 }}>{roomId}
            <span
              onClick={() => { navigator.clipboard.writeText(window.location.href); }}
              title="Copy room link"
              style={{ cursor: 'pointer', fontSize: 14, marginLeft: 10, opacity: 0.6 }}
            >📋</span>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 20 }}>
            {isHost ? 'Start when everyone\'s in!' : 'Waiting for host to start…'}
          </p>

          {/* Player grid */}
          <div style={lobbyPlayerGrid}>
            {roomState?.players.map((p, i) => (
              <div key={p.id} style={{ ...lobbyPlayerCard, animationDelay: `${i * 0.07}s`, opacity: p.connected ? 1 : 0.4 }}>
                <div style={lobbyAvatar}>
                  {p.displayName.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, marginTop: 6, wordBreak: 'break-word', textAlign: 'center' }}>
                  {p.displayName}
                </span>
                {p.id === roomState?.hostId && (
                  <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, marginTop: 2 }}>👑 HOST</span>
                )}
                {!p.connected && (
                  <span style={{ fontSize: 10, color: 'var(--red)', marginTop: 2 }}>disconnected</span>
                )}
              </div>
            ))}
          </div>

          <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: '16px 0 20px' }}>
            {roomState?.players.length} player{roomState?.players.length !== 1 ? 's' : ''} in lobby
          </p>

          {isHost && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => doStartGame()} style={btnPrimary}>
                🎮 Start Game
              </button>
              <button onClick={() => doStartGame('meme_chain')} style={btnAccent2}>
                📝 Meme Chain
              </button>
            </div>
          )}
        </div>
      )}
      {view === 'waiting' && roomState?.gameStarted && (
        <div style={{ textAlign: 'center', padding: 40, animation: 'pulse 1.5s ease infinite' }}>
          <p style={{ fontSize: 18, color: 'var(--accent-light)' }}>Game starting…</p>
        </div>
      )}

      {/* GAME */}
      {view === 'game' && round && (
        <div style={{ animation: 'fadeInUp 0.35s ease' }}>
          <Game
            round={round}
            timeLeft={timeLeft}
            isTarget={isTarget || isTarget2}
            submitted={submitted}
            onSubmit={doSubmit}
            secretPhrase={secretPhrase}
            isLieDetectionTarget={isLieDetectionTarget}
          />
        </div>
      )}

      {/* REVEAL */}
      {view === 'reveal' && (
        <div style={{ animation: 'fadeInUp 0.35s ease' }}>
          <Reveal answers={answers} onReact={doReact} roundType={round?.type} />
        </div>
      )}

      {/* VOTE */}
      {view === 'vote' && (
        <div style={{ animation: 'fadeInUp 0.35s ease' }}>
          <Vote
            answers={answers}
            isTarget={isTarget || isTarget2}
            onVote={doVote}
            voteType={voteType}
            players={votePlayers}
            timeLeft={voteTimeLeft}
            roundType={round?.type}
          />
        </div>
      )}

      {/* ROUND RESULT */}
      {view === 'result' && roundResult && (
        <div style={{ ...glassSection, textAlign: 'center', animation: 'popIn 0.4s ease' }}>
          <h3 style={{ fontSize: 22, marginBottom: 12 }}>🎉 Round Result</h3>
          {roundResult.winningText && (
            <div style={resultHighlight}>
              <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>Winner</span>
              <p style={{ fontSize: 18, fontWeight: 600, margin: '4px 0 0' }}>"{roundResult.winningText}"</p>
            </div>
          )}
          {roundResult.winnerName && (
            <p style={{ marginTop: 8 }}>Most voted: <strong style={{ color: 'var(--accent-light)' }}>{roundResult.winnerName}</strong></p>
          )}
          {roundResult.targetFooledEveryone && (
            <div style={{ ...infoBanner, background: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.3)' }}>
              🎭 Target fooled everyone! <strong>+2 bonus</strong>
            </div>
          )}
          {roundResult.correctVoters?.length > 0 && (
            <p style={{ color: 'var(--green)', marginTop: 8 }}>✅ Correct: {roundResult.correctVoters.join(', ')}</p>
          )}
          {roundResult.crowdFavorite && (
            <div style={{ ...infoBanner, background: 'rgba(251,191,36,0.08)', borderColor: 'rgba(251,191,36,0.2)' }}>
              👑 Crowd Favorite: "{roundResult.crowdFavorite.text}"
            </div>
          )}
          {roundResult.secretPhraseReveal && (
            <div style={secretRevealCard}>
              <p style={{ margin: 0 }}>🔤 Secret Word: <strong style={{ color: 'var(--accent-light)' }}>{roundResult.secretPhraseReveal.phrase}</strong></p>
              <p style={{ margin: '4px 0' }}>Sneaker: <strong>{roundResult.secretPhraseReveal.playerName}</strong></p>
              {roundResult.secretPhraseReveal.included ? (
                roundResult.targetCaughtSneaker
                  ? <p style={{ color: 'var(--green)', margin: '4px 0 0' }}>🎯 Target caught the sneaker! +1</p>
                  : <p style={{ color: 'var(--gold)', margin: '4px 0 0' }}>🕵️ Sneaker got away! +1</p>
              ) : (
                <p style={{ color: 'var(--red)', margin: '4px 0 0' }}>❌ Sneaker didn't include it — no points!</p>
              )}
            </div>
          )}
          {roundResult.winners && <p style={{ marginTop: 8 }}>Winners: <strong>{roundResult.winners.join(', ')}</strong></p>}
          {roundResult.voteCounts && (
            <div style={{ marginTop: 12 }}>
              {roundResult.voteCounts.map((v: any, i: number) => (
                <div key={i} style={voteCountRow}>
                  <span>{v.displayName}</span>
                  <span style={voteBadge}>{v.count}</span>
                </div>
              ))}
            </div>
          )}
          <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 16, animation: 'pulse 1.5s ease infinite' }}>
            Next round starting…
          </p>
        </div>
      )}

      {/* LEADERBOARD */}
      {view === 'leaderboard' && (
        <div style={{ animation: 'fadeInUp 0.4s ease' }}>
          <Leaderboard
            board={leaderboard}
            isHost={!!isHost}
            onRestart={doRestart}
            onEndGame={doEndGame}
            insights={insights}
            personalAchievements={personalAchievements}
          />
        </div>
      )}
    </div>
  );
}

/* ═══════ STYLES ═══════ */
const pageCenter: React.CSSProperties = {
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  minHeight: '85vh', padding: 16,
};
const mainWrap: React.CSSProperties = {
  maxWidth: 640, margin: '0 auto', padding: '12px 0',
};
const glassCard: React.CSSProperties = {
  background: 'var(--bg-glass)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid var(--border-glass)', borderRadius: 24, padding: '36px 24px',
  width: '100%', maxWidth: 420, textAlign: 'center',
  animation: 'fadeInUp 0.5s ease', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};
const glassSection: React.CSSProperties = {
  background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border-glass)', borderRadius: 20, padding: '24px 20px',
  marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
};
const headingGrad: React.CSSProperties = {
  fontSize: 24, fontWeight: 800, margin: '0 0 4px',
  background: 'linear-gradient(135deg, var(--accent-light), var(--accent2))',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
};
const roomBadge: React.CSSProperties = {
  display: 'inline-block', fontSize: 20, fontWeight: 800, letterSpacing: 6,
  background: 'var(--bg-card)', padding: '8px 20px', borderRadius: 12,
  border: '1px solid var(--border-glass)', marginTop: 8,
};
const headerStyle: React.CSSProperties = {
  background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border-glass)', borderRadius: 16, padding: '14px 18px',
  marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
};
const roomCodeHeader: React.CSSProperties = {
  letterSpacing: 3, fontWeight: 800,
  background: 'linear-gradient(135deg, var(--accent-light), var(--accent2))',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
};
const lobbyPlayerGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
  gap: 12, marginBottom: 8,
};
const lobbyPlayerCard: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '16px 8px', borderRadius: 16,
  background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
  animation: 'fadeInUp 0.4s ease both',
  transition: 'transform 0.2s, box-shadow 0.2s',
};
const lobbyAvatar: React.CSSProperties = {
  width: 48, height: 48, borderRadius: '50%', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  fontSize: 22, fontWeight: 800, color: '#fff',
  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
  boxShadow: '0 4px 14px var(--accent-glow)',
};
const missionBar: React.CSSProperties = {
  marginTop: 10, fontSize: 13, padding: '8px 12px', borderRadius: 10,
  background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)',
  color: 'var(--gold)',
};
const btnPrimary: React.CSSProperties = {
  padding: '14px 28px', fontSize: 16, fontWeight: 600, borderRadius: 12,
  border: 'none', color: '#fff', cursor: 'pointer',
  background: 'linear-gradient(135deg, var(--accent), #6366f1)',
  boxShadow: '0 4px 14px var(--accent-glow)',
};
const btnAccent2: React.CSSProperties = {
  padding: '14px 28px', fontSize: 16, fontWeight: 600, borderRadius: 12,
  border: 'none', color: '#fff', cursor: 'pointer',
  background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
  boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
};
const errorBox: React.CSSProperties = {
  color: 'var(--red)', fontSize: 14, padding: '10px 14px', borderRadius: 12,
  background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)',
  marginBottom: 12, animation: 'slideDown 0.3s ease',
};
const resultHighlight: React.CSSProperties = {
  background: 'var(--bg-card)', padding: '14px 18px', borderRadius: 14,
  border: '1px solid var(--border-glass)', marginBottom: 12,
};
const infoBanner: React.CSSProperties = {
  marginTop: 10, padding: '10px 14px', borderRadius: 12,
  border: '1px solid', fontSize: 14,
};
const secretRevealCard: React.CSSProperties = {
  marginTop: 12, padding: '14px 16px', borderRadius: 14,
  background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.2)',
  textAlign: 'left',
};
const voteCountRow: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '8px 14px', background: 'var(--bg-card)', borderRadius: 10,
  marginBottom: 6, border: '1px solid var(--border-glass)',
};
const voteBadge: React.CSSProperties = {
  background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 700,
  padding: '2px 10px', borderRadius: 20,
};
