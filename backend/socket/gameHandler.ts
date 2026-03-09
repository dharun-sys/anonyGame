import { Server } from 'socket.io';
import { getRoom, broadcastRoomState } from './roomHandler';
import { Round, Answer } from '../models/Round';
import { Player } from '../models/Player';
import { QUESTIONS, RoundType, MEME_CHAIN_PROMPTS } from '../data/questions';
import { MISSIONS } from '../data/missions';
import { SECRET_PHRASES } from '../data/secretPhrases';

/* ──────── helpers ──────── */
function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }

const ANSWER_TIME = 30;
function getRevealTime(playerCount: number) { return playerCount < 5 ? 30 : 60; }
function getVoteTime(playerCount: number) { return playerCount < 5 ? 30 : 60; }

const timers = new Map<string, NodeJS.Timeout>();
function clearT(key: string) {
  if (timers.has(key)) { clearTimeout(timers.get(key)!); clearInterval(timers.get(key)!); timers.delete(key); }
}
function clearAll(roomId: string) {
  for (const s of [':t', ':cd', ':vt', ':vcd']) clearT(roomId + s);
}

/* ================================================================
   ROUND GENERATION
   ================================================================ */
function genRounds(players: Player[]): Round[] {
  const ids = players.map(p => p.id);
  const n = ids.length;
  const rounds: Round[] = [];
  const byType = (t: RoundType) => QUESTIONS.filter(q => q.type === t);

  /* ── per-player rounds (2 each) ── */
  const targets = shuffle([...ids, ...ids]);
  const stdTypes: RoundType[] = ['standard','caption','future','excuse','prediction','compliment','secret_word'];
  const pool = shuffle(stdTypes.flatMap(t => byType(t)));
  let qi = 0;
  for (const tid of targets) {
    const q = pool[qi++ % pool.length];
    const p = players.find(x => x.id === tid)!;
    rounds.push({ type: q.type, targetPlayerId: tid, questionText: q.template.replace(/{player}/g, p.displayName), answers: [], votes: {}, phase: 'answering' });
  }

  /* ── 1 lie_detection ── */
  const ldQ = shuffle(byType('lie_detection'));
  if (ldQ.length) {
    const tid = pick(ids);
    const p = players.find(x => x.id === tid)!;
    rounds.push({ type: 'lie_detection', targetPlayerId: tid, questionText: ldQ[0].template.replace(/{player}/g, p.displayName), answers: [], votes: {}, phase: 'answering' });
  }

  /* ── 1 double ── */
  const dQ = shuffle(byType('double'));
  if (dQ.length && n >= 4) {
    const sh = shuffle([...ids]);
    const p1 = players.find(x => x.id === sh[0])!;
    const p2 = players.find(x => x.id === sh[1])!;
    rounds.push({ type: 'double', targetPlayerId: p1.id, targetPlayerId2: p2.id, questionText: dQ[0].template.replace(/{player1}/g, p1.displayName).replace(/{player2}/g, p2.displayName), answers: [], votes: {}, phase: 'answering' });
  }

  /* ── 1 secret_phrase ── */
  const spQ = shuffle(byType('secret_phrase'));
  if (spQ.length) {
    const tid = pick(ids);
    const p = players.find(x => x.id === tid)!;
    const nonT = ids.filter(i => i !== tid);
    rounds.push({ type: 'secret_phrase', targetPlayerId: tid, questionText: spQ[0].template.replace(/{player}/g, p.displayName), answers: [], votes: {}, phase: 'answering', secretPhrasePlayerId: pick(nonT), secretPhrase: pick(SECRET_PHRASES) });
  }

  /* ── 1 compliment ── */
  const cQ = shuffle(byType('compliment'));
  if (cQ.length) {
    const tid = pick(ids);
    const p = players.find(x => x.id === tid)!;
    rounds.push({ type: 'compliment', targetPlayerId: tid, questionText: cQ[0].template.replace(/{player}/g, p.displayName), answers: [], votes: {}, phase: 'answering' });
  }

  return shuffle(rounds);
}

/* ================================================================
   START GAME
   ================================================================ */
export function startGame(io: Server, roomId: string) {
  const room = getRoom(roomId);
  if (!room || room.gameStarted) return;
  if (room.players.length < 4 || room.players.length > 10) {
    io.to(roomId).emit('game_error', { message: 'Need 4–10 players to start' });
    return;
  }
  room.gameStarted = true;
  room.gameMode = 'standard';

  // reset stats
  for (const p of room.players) {
    p.score = 0; p.achievements = []; p.missionCompleted = false;
    p.roundWins = 0; p.totalReactionsReceived = 0; p.answersSubmitted = 0; p.consecutiveWins = 0;
  }

  // assign missions
  const ms = shuffle(MISSIONS.slice());
  room.players.forEach((p, i) => { p.secretMissionId = ms[i % ms.length].id; });

  room.rounds = genRounds(room.players);
  room.currentRoundIndex = 0;

  io.to(roomId).emit('game_started', { totalRounds: room.rounds.length });

  // send private info
  for (const p of room.players) {
    const m = MISSIONS.find(x => x.id === p.secretMissionId);
    if (m) io.to(p.id).emit('secret_mission', { mission: m.description });
  }

  broadcastRoomState(io, roomId);
  setTimeout(() => emitNewRound(io, roomId), 1200);
}

/* ================================================================
   NEW ROUND
   ================================================================ */
function emitNewRound(io: Server, roomId: string) {
  const room = getRoom(roomId);
  if (!room) return;
  if (room.currentRoundIndex >= room.rounds.length) { endGame(io, roomId); return; }

  const r = room.rounds[room.currentRoundIndex];
  r.phase = 'answering';
  const tName  = room.players.find(p => p.id === r.targetPlayerId)?.displayName ?? '';
  const tName2 = r.targetPlayerId2 ? room.players.find(p => p.id === r.targetPlayerId2)?.displayName ?? '' : undefined;

  io.to(roomId).emit('new_round', {
    roundIndex: room.currentRoundIndex, totalRounds: room.rounds.length,
    type: r.type, questionText: r.questionText,
    targetPlayerId: r.targetPlayerId, targetPlayerId2: r.targetPlayerId2,
    targetName: tName, targetName2: tName2,
    timeLimit: ANSWER_TIME,
    isSecretPhraseRound: r.type === 'secret_phrase',
  });

  // secret phrase → private notification
  if (r.type === 'secret_phrase' && r.secretPhrasePlayerId && r.secretPhrase) {
    io.to(r.secretPhrasePlayerId).emit('secret_phrase_assignment', { phrase: r.secretPhrase });
  }

  // lie detection → tell target
  if (r.type === 'lie_detection') {
    io.to(r.targetPlayerId).emit('lie_detection_target', { message: 'Write your REAL answer – others will try to fake it!' });
  }

  // answer countdown
  let rem = ANSWER_TIME;
  const cd = setInterval(() => { rem--; io.to(roomId).emit('round_timer', { timeLeft: rem }); if (rem <= 0) clearInterval(cd); }, 1000);
  timers.set(roomId + ':cd', cd);
  timers.set(roomId + ':t', setTimeout(() => { clearInterval(cd); answerEnd(io, roomId); }, ANSWER_TIME * 1000));
}

/* ================================================================
   SUBMIT ANSWER
   ================================================================ */
export function submitAnswer(io: Server, roomId: string, answer: Answer) {
  const room = getRoom(roomId);
  if (!room) return;
  const r = room.rounds[room.currentRoundIndex];
  if (!r || r.phase !== 'answering') return;

  // who can answer?
  if (r.type === 'lie_detection') {
    if (r.targetPlayerId === answer.playerId) { answer.isRealAnswer = true; r.lieDetectionRealAnswerId = answer.answerId; }
  } else {
    if (r.targetPlayerId === answer.playerId) return;
    if (r.targetPlayerId2 === answer.playerId) return;
  }
  if (r.answers.find(a => a.playerId === answer.playerId)) return;

  answer.reactions = {};
  r.answers.push(answer);

  const pl = room.players.find(p => p.id === answer.playerId);
  if (pl) pl.answersSubmitted++;

  const exp = r.type === 'lie_detection' ? room.players.length : r.type === 'double' ? room.players.length - 2 : room.players.length - 1;
  if (r.answers.length >= exp) { clearAll(roomId); answerEnd(io, roomId); }
}

/* ================================================================
   ANSWER PHASE END → REVEAL
   ================================================================ */
function answerEnd(io: Server, roomId: string) {
  console.log(`[answerEnd] roomId=${roomId}`);
  clearAll(roomId);
  const room = getRoom(roomId);
  if (!room) {
    console.error(`[answerEnd] Room not found: ${roomId}`);
    return;
  }
  const r = room.rounds[room.currentRoundIndex];
  if (!r) {
    console.error(`[answerEnd] Round not found: ${roomId}, index=${room.currentRoundIndex}`);
    return;
  }

  if (r.answers.length === 0) {
    io.to(roomId).emit('round_skipped', { reason: 'No answers were submitted' });
    room.currentRoundIndex++;
    setTimeout(() => emitNewRound(io, roomId), 2000);
    return;
  }

  r.phase = 'reveal';
  const rt = getRevealTime(room.players.length);
  console.log(`[answerEnd] Starting reveal phase for ${roomId}, duration=${rt}s`);
  const shuffled = shuffle(r.answers.map(a => ({ answerId: a.answerId, text: a.text, reactions: a.reactions || {} })));
  io.to(roomId).emit('reveal_answers', { answers: shuffled, type: r.type, revealTime: rt });
  timers.set(roomId + ':t', setTimeout(() => startVotingPhase(io, roomId), rt * 1000));
}

/* ================================================================
   REACT TO ANSWER
   ================================================================ */
export function reactToAnswer(io: Server, roomId: string, playerId: string, answerId: string, emoji: string) {
  const room = getRoom(roomId);
  if (!room) return;
  const r = room.rounds[room.currentRoundIndex];
  if (!r || r.phase !== 'reveal') return;
  const a = r.answers.find(x => x.answerId === answerId);
  if (!a) return;
  if (!a.reactions) a.reactions = {};

  // remove player from ALL emoji arrays on this answer first (one reaction per player per answer)
  let hadSameEmoji = false;
  for (const [em, pids] of Object.entries(a.reactions)) {
    const i = pids.indexOf(playerId);
    if (i >= 0) {
      if (em === emoji) hadSameEmoji = true;
      pids.splice(i, 1);
      if (pids.length === 0) delete a.reactions[em];
    }
  }

  // if clicking a different emoji, add to it; if same emoji, it's a toggle-off (already removed)
  if (!hadSameEmoji) {
    if (!a.reactions[emoji]) a.reactions[emoji] = [];
    a.reactions[emoji].push(playerId);
  }

  // broadcast with names
  const withNames: Record<string, { pid: string; name: string }[]> = {};
  for (const [em, pids] of Object.entries(a.reactions)) {
    withNames[em] = pids.map(pid => ({ pid, name: room.players.find(x => x.id === pid)?.displayName || '?' }));
  }
  io.to(roomId).emit('reaction_update', { answerId, reactions: withNames });
}

/* ================================================================
   VOTING PHASE
   ================================================================ */
function startVotingPhase(io: Server, roomId: string) {
  console.log(`[startVotingPhase] roomId=${roomId}`);
  clearAll(roomId);
  const room = getRoom(roomId);
  if (!room) {
    console.error(`[startVotingPhase] Room not found: ${roomId}`);
    return;
  }
  const r = room.rounds[room.currentRoundIndex];
  if (!r) {
    console.error(`[startVotingPhase] Round not found: ${roomId}, index=${room.currentRoundIndex}`);
    return;
  }
  r.phase = 'voting';
  console.log(`[startVotingPhase] Emitting voting_phase for ${roomId}, players=${room.players.length}`);

  // crowd favorite
  let maxR = 0; let cfId: string | null = null;
  for (const a of r.answers) {
    const tot = Object.values(a.reactions || {}).reduce((s, arr) => s + arr.length, 0);
    if (tot > maxR) { maxR = tot; cfId = a.answerId; }
  }
  if (maxR > 0 && cfId) r.crowdFavoriteAnswerId = cfId;

  const vt = getVoteTime(room.players.length);
  const ans = shuffle(r.answers.map(a => ({ answerId: a.answerId, text: a.text, reactions: a.reactions || {} })));
  const pl = room.players.map(p => ({ id: p.id, displayName: p.displayName }));

  // secret_phrase → target guesses which PLAYER sneaked the word
  const voteType = r.type === 'secret_phrase' ? 'secret_phrase' : r.type;
  io.to(roomId).emit('voting_phase', { type: voteType, targetPlayerId: r.targetPlayerId, targetPlayerId2: r.targetPlayerId2, answers: ans, players: pl, voteTimeLimit: vt });
  startVoteTimer(io, roomId, vt);
}

function startVoteTimer(io: Server, roomId: string, duration?: number) {
  let rem = duration || getVoteTime(4);
  const cd = setInterval(() => { rem--; io.to(roomId).emit('vote_timer', { timeLeft: rem }); if (rem <= 0) clearInterval(cd); }, 1000);
  timers.set(roomId + ':vcd', cd);
  timers.set(roomId + ':vt', setTimeout(() => { clearInterval(cd); processRoundEnd(io, roomId); }, rem * 1000));
}

/* ================================================================
   VOTE
   ================================================================ */
export function voteAnswer(io: Server, roomId: string, voterId: string, value: string) {
  const room = getRoom(roomId);
  if (!room) return;
  const r = room.rounds[room.currentRoundIndex];
  if (!r || r.phase !== 'voting') return;

  if (r.type === 'secret_phrase') {
    // only target votes (picks a player they think sneaked the word)
    if (voterId !== r.targetPlayerId) return;
    r.votes[voterId] = value;
    clearAll(roomId);
    processRoundEnd(io, roomId);
  } else if (r.type === 'lie_detection') {
    if (voterId === r.targetPlayerId) return;
    r.votes[voterId] = value;
    if (Object.keys(r.votes).length >= room.players.length - 1) { clearAll(roomId); processRoundEnd(io, roomId); }
  } else if (r.type === 'double') {
    if (voterId !== r.targetPlayerId && voterId !== r.targetPlayerId2) return;
    r.votes[voterId] = value;
    if (r.votes[r.targetPlayerId] && r.votes[r.targetPlayerId2!]) { clearAll(roomId); processRoundEnd(io, roomId); }
  } else {
    if (voterId !== r.targetPlayerId) return;
    r.votes[voterId] = value;
    clearAll(roomId);
    processRoundEnd(io, roomId);
  }
}

/* ================================================================
   PROCESS ROUND END
   ================================================================ */
function processRoundEnd(io: Server, roomId: string) {
  clearAll(roomId);
  const room = getRoom(roomId);
  if (!room) return;
  const r = room.rounds[room.currentRoundIndex];
  if (!r) return;
  r.phase = 'done';

  const res: any = { type: r.type, roundIndex: room.currentRoundIndex };

  /* ── scoring by type ── */
  if (r.type === 'lie_detection') {
    const correct: string[] = [];
    for (const [vid, aid] of Object.entries(r.votes)) {
      if (aid === r.lieDetectionRealAnswerId) { correct.push(vid); const v = room.players.find(p => p.id === vid); if (v) { v.score++; v.roundWins++; } }
    }
    if (correct.length === 0) { const t = room.players.find(p => p.id === r.targetPlayerId); if (t) t.score += 2; res.targetFooledEveryone = true; }
    res.realAnswerId = r.lieDetectionRealAnswerId;
    res.correctVoters = correct.map(id => room.players.find(p => p.id === id)?.displayName || '?');

  } else if (r.type === 'double') {
    const winners: string[] = [];
    for (const [, aid] of Object.entries(r.votes)) {
      const a = r.answers.find(x => x.answerId === aid);
      if (a) { const au = room.players.find(p => p.id === a.playerId); if (au) { au.score++; au.roundWins++; winners.push(au.displayName); } }
    }
    res.winners = winners;

  } else if (r.type === 'secret_phrase') {
    // target voted for a PLAYER id — did they pick the sneaker?
    const targetGuess = r.votes[r.targetPlayerId]; // playerId the target guessed
    const sneakerId = r.secretPhrasePlayerId;
    const sneaker = room.players.find(p => p.id === sneakerId);
    const sneakerName = sneaker?.displayName || '?';
    // check if sneaker actually included the phrase
    const sneakerAnswer = r.answers.find(a => a.playerId === sneakerId);
    const included = sneakerAnswer ? sneakerAnswer.text.toLowerCase().includes((r.secretPhrase || '').toLowerCase()) : false;
    const guessedCorrectly = targetGuess === sneakerId;

    if (included) {
      // sneaker did sneak the word in
      if (guessedCorrectly) {
        // target caught them → target gets point
        const target = room.players.find(p => p.id === r.targetPlayerId);
        if (target) { target.score++; target.roundWins++; }
        res.targetCaughtSneaker = true;
      } else {
        // sneaker got away with it → sneaker gets point
        if (sneaker) { sneaker.score++; sneaker.roundWins++; }
        res.sneakerGotAway = true;
      }
    } else {
      // sneaker didn't even include the word — no points
      res.sneakerFailed = true;
    }
    res.secretPhraseReveal = { phrase: r.secretPhrase, playerName: sneakerName, included, guessedCorrectly };

  } else {
    // standard / caption / future / excuse / prediction / compliment / secret_word
    const tv = r.votes[r.targetPlayerId];
    if (tv) {
      const a = r.answers.find(x => x.answerId === tv);
      if (a) {
        const au = room.players.find(p => p.id === a.playerId);
        if (au) { au.score++; au.roundWins++; au.consecutiveWins++; }
        res.winningAnswerId = tv; res.winningText = a.text;
      }
    }
    // reset consecutive for non-winners
    for (const p of room.players) {
      const won = tv && r.answers.find(a => a.answerId === tv)?.playerId === p.id;
      if (!won) p.consecutiveWins = 0;
    }
  }

  // crowd favorite bonus
  if (r.crowdFavoriteAnswerId) {
    const ca = r.answers.find(a => a.answerId === r.crowdFavoriteAnswerId);
    if (ca) { const au = room.players.find(p => p.id === ca.playerId); if (au) { au.score++; res.crowdFavorite = { text: ca.text }; } }
  }

  // reaction stats
  for (const a of r.answers) {
    const tot = Object.values(a.reactions || {}).reduce((s, arr) => s + arr.length, 0);
    const au = room.players.find(p => p.id === a.playerId);
    if (au) au.totalReactionsReceived += tot;
  }

  checkAchievements(room);
  checkMissions(room);

  io.to(roomId).emit('round_result', res);
  broadcastRoomState(io, roomId);

  room.currentRoundIndex++;
  setTimeout(() => emitNewRound(io, roomId), 3000);
}

/* ================================================================ ACHIEVEMENTS ================================================================ */
function checkAchievements(room: any) {
  for (const p of room.players) {
    if (p.roundWins >= 3 && !p.achievements.includes('roast_king')) p.achievements.push('roast_king');
    // chaos agent: most reactions on single answer in latest round
    const r = room.rounds[room.currentRoundIndex];
    if (r) {
      const pa = r.answers.find((a: any) => a.playerId === p.id);
      if (pa) {
        const tot = Object.values(pa.reactions || {}).reduce((s: number, arr: any) => s + arr.length, 0);
        if (tot >= 5 && !p.achievements.includes('chaos_agent')) p.achievements.push('chaos_agent');
      }
    }
  }
}

/* ================================================================ MISSIONS ================================================================ */
function checkMissions(room: any) {
  const r = room.rounds[room.currentRoundIndex];
  if (!r) return;
  for (const p of room.players) {
    if (p.missionCompleted) continue;
    const m = MISSIONS.find(x => x.id === p.secretMissionId);
    if (!m) continue;
    let done = false;
    switch (m.check) {
      case 'shortest_answer_win': {
        const pa = r.answers.find((a: any) => a.playerId === p.id);
        const vote = r.votes[r.targetPlayerId];
        if (pa && vote && r.answers.find((a: any) => a.answerId === vote)?.playerId === p.id) {
          const shortest = r.answers.reduce((m2: any, a: any) => a.text.length < m2.text.length ? a : m2, r.answers[0]);
          if (shortest.playerId === p.id) done = true;
        }
        break;
      }
      case 'three_reactions': {
        const pa = r.answers.find((a: any) => a.playerId === p.id);
        if (pa && Object.values(pa.reactions || {}).reduce((s: number, arr: any) => s + arr.length, 0) >= 3) done = true;
        break;
      }
      case 'two_wins_in_row': { if (p.consecutiveWins >= 2) done = true; break; }
      case 'win_first_round': { if (room.currentRoundIndex === 0 && p.roundWins >= 1) done = true; break; }
      case 'crowd_favorite': {
        if (r.crowdFavoriteAnswerId) {
          const ca = r.answers.find((a: any) => a.answerId === r.crowdFavoriteAnswerId);
          if (ca && ca.playerId === p.id) done = true;
        }
        break;
      }
    }
    if (done) { p.missionCompleted = true; p.score += m.bonusPoints; }
  }
}

/* ================================================================ END GAME ================================================================ */
function endGame(io: Server, roomId: string) {
  const room = getRoom(roomId);
  if (!room) return;
  clearAll(roomId);

  const leaderboard = room.players.map(p => ({
    displayName: p.displayName, score: p.score, achievements: p.achievements,
    missionCompleted: p.missionCompleted, secretMissionId: p.secretMissionId,
  })).sort((a, b) => b.score - a.score);

  const insights = computeInsights(room);

  // per-player private achievements
  for (const p of room.players) {
    io.to(p.id).emit('your_achievements', {
      achievements: p.achievements, missionCompleted: p.missionCompleted,
      missionDescription: MISSIONS.find(m => m.id === p.secretMissionId)?.description,
    });
  }

  io.to(roomId).emit('leaderboard', { leaderboard, insights });
  room.gameStarted = false;
}

function computeInsights(room: any) {
  const ps = room.players;
  const mysterious = [...ps].sort((a: any, b: any) => a.answersSubmitted - b.answersSubmitted)[0];
  const predictable = [...ps].sort((a: any, b: any) => b.roundWins - a.roundWins)[0];
  const funniest = [...ps].sort((a: any, b: any) => b.totalReactionsReceived - a.totalReactionsReceived)[0];
  const chaotic = [...ps].sort((a: any, b: any) => b.achievements.length - a.achievements.length)[0];
  return {
    mostMysterious: mysterious?.displayName, mostPredictable: predictable?.displayName,
    funniest: funniest?.displayName, biggestChaosGenerator: chaotic?.displayName,
  };
}

/* ================================================================ RESTART ================================================================ */
export function restartGame(io: Server, roomId: string) {
  const room = getRoom(roomId);
  if (!room) return;
  clearAll(roomId);
  for (const p of room.players) {
    p.score = 0; p.connected = true; p.achievements = []; p.missionCompleted = false;
    p.roundWins = 0; p.totalReactionsReceived = 0; p.answersSubmitted = 0; p.consecutiveWins = 0;
    p.secretMissionId = undefined;
  }
  room.rounds = []; room.currentRoundIndex = 0; room.gameStarted = false; room.memeChain = undefined;
  io.to(roomId).emit('game_restarted');
  broadcastRoomState(io, roomId);
}

/* ================================================================
   MEME CHAIN MODE
   ================================================================ */
export function startMemeChain(io: Server, roomId: string) {
  const room = getRoom(roomId);
  if (!room || room.gameStarted) return;
  if (room.players.length < 4) { io.to(roomId).emit('game_error', { message: 'Need at least 4 players' }); return; }
  room.gameStarted = true;
  room.gameMode = 'meme_chain';

  const order = shuffle(room.players.map(p => p.id));
  const first = room.players.find(p => p.id === order[0])!;
  const prompt = pick(MEME_CHAIN_PROMPTS).replace(/{player}/g, first.displayName);
  room.memeChain = { prompt, entries: [], currentPlayerIndex: 0, playerOrder: order, votes: {} };

  io.to(roomId).emit('meme_chain_started', {
    prompt, totalPlayers: order.length,
    playerOrder: order.map(id => room.players.find(p => p.id === id)?.displayName),
  });
  io.to(order[0]).emit('meme_chain_your_turn', { prompt, chain: [] });
  broadcastRoomState(io, roomId);
}

export function submitMemeChainEntry(io: Server, roomId: string, playerId: string, text: string) {
  const room = getRoom(roomId);
  if (!room || !room.memeChain) return;
  const mc = room.memeChain;
  if (mc.playerOrder[mc.currentPlayerIndex] !== playerId) return;

  mc.entries.push({ playerId, text });
  mc.currentPlayerIndex++;

  const chain = mc.entries.map(e => ({ displayName: room.players.find(p => p.id === e.playerId)?.displayName || '?', text: e.text }));
  io.to(roomId).emit('meme_chain_update', { chain, currentIndex: mc.currentPlayerIndex, total: mc.playerOrder.length });

  if (mc.currentPlayerIndex >= mc.playerOrder.length) {
    io.to(roomId).emit('meme_chain_vote', { chain });
    return;
  }
  const next = mc.playerOrder[mc.currentPlayerIndex];
  io.to(next).emit('meme_chain_your_turn', { prompt: mc.prompt, chain });
}

export function voteMemeChain(io: Server, roomId: string, voterId: string, entryIndex: number) {
  const room = getRoom(roomId);
  if (!room || !room.memeChain) return;
  const mc = room.memeChain;
  if (mc.votes[voterId] !== undefined) return;
  mc.votes[voterId] = entryIndex;

  if (Object.keys(mc.votes).length >= room.players.length) {
    // tally
    const counts: Record<number, number> = {};
    for (const idx of Object.values(mc.votes)) counts[idx] = (counts[idx] || 0) + 1;
    let maxV = 0, winIdx = 0;
    for (const [idx, c] of Object.entries(counts)) if (c > maxV) { maxV = c; winIdx = Number(idx); }
    const winner = mc.entries[winIdx];
    if (winner) {
      const au = room.players.find(p => p.id === winner.playerId);
      if (au) au.score++;
    }
    const lb = room.players.map(p => ({ displayName: p.displayName, score: p.score })).sort((a, b) => b.score - a.score);
    io.to(roomId).emit('meme_chain_result', { winnerIndex: winIdx, winnerName: room.players.find(p => p.id === winner?.playerId)?.displayName });
    io.to(roomId).emit('leaderboard', { leaderboard: lb, insights: {} });
    room.gameStarted = false;
  }
}
