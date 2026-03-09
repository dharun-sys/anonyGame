import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createRoom, getRoom, joinRoom, leaveRoom, broadcastRoomState, rejoinRoom, deleteRoom } from './socket/roomHandler';
import { startGame, submitAnswer, voteAnswer, restartGame, reactToAnswer, startMemeChain, submitMemeChainEntry, voteMemeChain } from './socket/gameHandler';
import { newPlayer } from './models/Player';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = http.createServer(app);

// Socket.io with mobile-friendly settings
const io = new Server(server, { 
  cors: { origin: '*' },
  // Longer timeouts for mobile connections
  pingTimeout: 60000,      // 60 seconds before considering connection dead
  pingInterval: 25000,     // Send ping every 25 seconds to keep connection alive
  // Allow both transports for better mobile compatibility
  transports: ['websocket', 'polling'],
  // Increase buffer size for reconnection
  maxHttpBufferSize: 1e6,
});

app.get('/', (_req, res) => res.send('Anonymous Party Game server'));

io.on('connection', (socket) => {
  console.log('[connect]', socket.id);

  /* ── ROOM ── */

  socket.on('create_room', (payload, cb) => {
    const displayName: string = payload?.displayName || 'Host';
    const room = createRoom(socket.id);
    joinRoom(room.roomId, newPlayer(socket.id, displayName));
    socket.join(room.roomId);
    broadcastRoomState(io, room.roomId);
    if (cb) cb({ ok: true, roomId: room.roomId });
  });

  socket.on('join_room', (payload, cb) => {
    const { roomId, displayName } = payload || {};
    if (!roomId) return cb?.({ ok: false, reason: 'Missing room code' });
    const upper = (roomId as string).toUpperCase();
    const room = getRoom(upper);
    if (!room) return cb?.({ ok: false, reason: 'Room not found' });
    if (room.gameStarted) return cb?.({ ok: false, reason: 'Game already in progress' });
    const res = joinRoom(upper, newPlayer(socket.id, displayName || 'Anon'));
    if (!res.ok) return cb?.(res);
    socket.join(upper);
    broadcastRoomState(io, upper);
    cb?.({ ok: true, roomId: upper });
  });

  /* ── GAME ── */

  socket.on('start_game', (payload) => {
    const { roomId, mode } = payload || {};
    const room = getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;
    if (mode === 'meme_chain') startMemeChain(io, roomId);
    else startGame(io, roomId);
  });

  socket.on('submit_answer', (payload) => {
    const { roomId, text } = payload || {};
    if (!roomId || !text) return;
    submitAnswer(io, roomId, { answerId: uuidv4(), playerId: socket.id, text, reactions: {} });
  });

  socket.on('vote_answer', (payload) => {
    const { roomId, answerId, value } = payload || {};
    if (!roomId) return;
    voteAnswer(io, roomId, socket.id, answerId || value);
  });

  socket.on('react_answer', (payload) => {
    const { roomId, answerId, emoji } = payload || {};
    if (!roomId || !answerId || !emoji) return;
    reactToAnswer(io, roomId, socket.id, answerId, emoji);
  });

  /* ── MEME CHAIN ── */

  socket.on('meme_chain_submit', (payload) => {
    const { roomId, text } = payload || {};
    if (!roomId || !text) return;
    submitMemeChainEntry(io, roomId, socket.id, text);
  });

  socket.on('meme_chain_vote', (payload) => {
    const { roomId, entryIndex } = payload || {};
    if (roomId == null || entryIndex == null) return;
    voteMemeChain(io, roomId, socket.id, entryIndex);
  });

  /* ── REJOIN ── */

  socket.on('rejoin_room', (payload, cb) => {
    const { roomId, displayName } = payload || {};
    if (!roomId || !displayName) return cb?.({ ok: false, reason: 'Missing fields' });
    const upper = (roomId as string).toUpperCase();
    const res = rejoinRoom(upper, displayName, socket.id);
    if (!res.ok) return cb?.(res);
    socket.join(upper);
    broadcastRoomState(io, upper);
    
    // Send current round state if game is in progress
    const room = getRoom(upper);
    if (room && room.gameStarted && room.rounds.length > 0) {
      const r = room.rounds[room.currentRoundIndex];
      if (r) {
        const tName = room.players.find(p => p.id === r.targetPlayerId)?.displayName ?? '';
        const tName2 = (r as any).targetPlayerId2 
          ? room.players.find(p => p.id === (r as any).targetPlayerId2)?.displayName ?? '' 
          : undefined;
        
        // Emit current round info to the rejoining player
        socket.emit('new_round', {
          roundIndex: room.currentRoundIndex,
          totalRounds: room.rounds.length,
          type: r.type,
          questionText: (r as any).questionText || '',
          targetPlayerId: r.targetPlayerId,
          targetPlayerId2: (r as any).targetPlayerId2,
          targetName: tName,
          targetName2: tName2,
          timeLimit: 0, // Timer already running on server
          isSecretPhraseRound: r.type === 'secret_phrase',
        });
        
        // If in reveal phase, send answers
        if (r.phase === 'reveal' || r.phase === 'voting') {
          const shuffled = r.answers.map(a => ({ 
            answerId: a.answerId, 
            text: a.text, 
            reactions: a.reactions || {} 
          }));
          socket.emit('reveal_answers', { answers: shuffled, type: r.type, revealTime: 0 });
        }
        
        // If in voting phase, send voting info
        if (r.phase === 'voting') {
          const pl = room.players.map(p => ({ id: p.id, displayName: p.displayName }));
          const voteType = r.type === 'secret_phrase' ? 'secret_phrase' : r.type;
          socket.emit('voting_phase', { 
            type: voteType, 
            targetPlayerId: r.targetPlayerId, 
            targetPlayerId2: (r as any).targetPlayerId2, 
            answers: r.answers.map(a => ({ answerId: a.answerId, text: a.text, reactions: a.reactions || {} })),
            players: pl, 
            voteTimeLimit: 0 
          });
        }
        
        // Resend secret phrase assignment if applicable
        if (r.type === 'secret_phrase' && (r as any).secretPhrasePlayerId === socket.id && (r as any).secretPhrase) {
          socket.emit('secret_phrase_assignment', { phrase: (r as any).secretPhrase });
        }
        
        // Resend lie detection target status
        if (r.type === 'lie_detection' && r.targetPlayerId === socket.id) {
          socket.emit('lie_detection_target', { message: 'Write your REAL answer – others will try to fake it!' });
        }
      }
    }
    
    cb?.({ ok: true, roomId: upper, gameState: res.gameState });
  });

  /* ── HOST CONTROLS ── */

  socket.on('restart_game', (payload) => {
    const { roomId } = payload || {};
    const room = getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;
    restartGame(io, roomId);
  });

  socket.on('end_game', (payload) => {
    const { roomId } = payload || {};
    const room = getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;
    console.log(`[end_game] Host ${socket.id} ending room ${roomId}`);
    io.to(roomId).emit('room_ended');
    io.in(roomId).socketsLeave(roomId);
    deleteRoom(roomId);
  });

  /* ── DISCONNECT ── */

  socket.on('disconnecting', (reason) => {
    console.log(`[disconnecting] socket=${socket.id}, reason=${reason}, rooms=${[...socket.rooms].join(',')}`);
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      leaveRoom(roomId, socket.id);
      broadcastRoomState(io, roomId);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
