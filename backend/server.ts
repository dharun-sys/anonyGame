import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createRoom, getRoom, joinRoom, leaveRoom, broadcastRoomState, rejoinRoom, deleteRoom } from './socket/roomHandler';
import { startGame, submitAnswer, voteAnswer, restartGame, reactToAnswer, startMemeChain, submitMemeChainEntry, voteMemeChain } from './socket/gameHandler';
import { newPlayer } from './models/Player';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

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
    cb?.({ ok: true, roomId: upper });
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
    io.to(roomId).emit('room_ended');
    io.in(roomId).socketsLeave(roomId);
    deleteRoom(roomId);
  });

  /* ── DISCONNECT ── */

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      leaveRoom(roomId, socket.id);
      broadcastRoomState(io, roomId);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
