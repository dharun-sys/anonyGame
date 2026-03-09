"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const roomHandler_1 = require("./socket/roomHandler");
const gameHandler_1 = require("./socket/gameHandler");
const Player_1 = require("./models/Player");
const uuid_1 = require("uuid");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: '*' } });
app.get('/', (_req, res) => res.send('Anonymous Party Game server'));
io.on('connection', (socket) => {
    console.log('[connect]', socket.id);
    /* ── ROOM ── */
    socket.on('create_room', (payload, cb) => {
        const displayName = payload?.displayName || 'Host';
        const room = (0, roomHandler_1.createRoom)(socket.id);
        (0, roomHandler_1.joinRoom)(room.roomId, (0, Player_1.newPlayer)(socket.id, displayName));
        socket.join(room.roomId);
        (0, roomHandler_1.broadcastRoomState)(io, room.roomId);
        if (cb)
            cb({ ok: true, roomId: room.roomId });
    });
    socket.on('join_room', (payload, cb) => {
        const { roomId, displayName } = payload || {};
        if (!roomId)
            return cb?.({ ok: false, reason: 'Missing room code' });
        const upper = roomId.toUpperCase();
        const room = (0, roomHandler_1.getRoom)(upper);
        if (!room)
            return cb?.({ ok: false, reason: 'Room not found' });
        if (room.gameStarted)
            return cb?.({ ok: false, reason: 'Game already in progress' });
        const res = (0, roomHandler_1.joinRoom)(upper, (0, Player_1.newPlayer)(socket.id, displayName || 'Anon'));
        if (!res.ok)
            return cb?.(res);
        socket.join(upper);
        (0, roomHandler_1.broadcastRoomState)(io, upper);
        cb?.({ ok: true, roomId: upper });
    });
    /* ── GAME ── */
    socket.on('start_game', (payload) => {
        const { roomId, mode } = payload || {};
        const room = (0, roomHandler_1.getRoom)(roomId);
        if (!room || room.hostId !== socket.id)
            return;
        if (mode === 'meme_chain')
            (0, gameHandler_1.startMemeChain)(io, roomId);
        else
            (0, gameHandler_1.startGame)(io, roomId);
    });
    socket.on('submit_answer', (payload) => {
        const { roomId, text } = payload || {};
        if (!roomId || !text)
            return;
        (0, gameHandler_1.submitAnswer)(io, roomId, { answerId: (0, uuid_1.v4)(), playerId: socket.id, text, reactions: {} });
    });
    socket.on('vote_answer', (payload) => {
        const { roomId, answerId, value } = payload || {};
        if (!roomId)
            return;
        (0, gameHandler_1.voteAnswer)(io, roomId, socket.id, answerId || value);
    });
    socket.on('react_answer', (payload) => {
        const { roomId, answerId, emoji } = payload || {};
        if (!roomId || !answerId || !emoji)
            return;
        (0, gameHandler_1.reactToAnswer)(io, roomId, socket.id, answerId, emoji);
    });
    /* ── MEME CHAIN ── */
    socket.on('meme_chain_submit', (payload) => {
        const { roomId, text } = payload || {};
        if (!roomId || !text)
            return;
        (0, gameHandler_1.submitMemeChainEntry)(io, roomId, socket.id, text);
    });
    socket.on('meme_chain_vote', (payload) => {
        const { roomId, entryIndex } = payload || {};
        if (roomId == null || entryIndex == null)
            return;
        (0, gameHandler_1.voteMemeChain)(io, roomId, socket.id, entryIndex);
    });
    /* ── REJOIN ── */
    socket.on('rejoin_room', (payload, cb) => {
        const { roomId, displayName } = payload || {};
        if (!roomId || !displayName)
            return cb?.({ ok: false, reason: 'Missing fields' });
        const upper = roomId.toUpperCase();
        const res = (0, roomHandler_1.rejoinRoom)(upper, displayName, socket.id);
        if (!res.ok)
            return cb?.(res);
        socket.join(upper);
        (0, roomHandler_1.broadcastRoomState)(io, upper);
        cb?.({ ok: true, roomId: upper });
    });
    /* ── HOST CONTROLS ── */
    socket.on('restart_game', (payload) => {
        const { roomId } = payload || {};
        const room = (0, roomHandler_1.getRoom)(roomId);
        if (!room || room.hostId !== socket.id)
            return;
        (0, gameHandler_1.restartGame)(io, roomId);
    });
    socket.on('end_game', (payload) => {
        const { roomId } = payload || {};
        const room = (0, roomHandler_1.getRoom)(roomId);
        if (!room || room.hostId !== socket.id)
            return;
        io.to(roomId).emit('room_ended');
        io.in(roomId).socketsLeave(roomId);
        (0, roomHandler_1.deleteRoom)(roomId);
    });
    /* ── DISCONNECT ── */
    socket.on('disconnecting', () => {
        for (const roomId of socket.rooms) {
            if (roomId === socket.id)
                continue;
            (0, roomHandler_1.leaveRoom)(roomId, socket.id);
            (0, roomHandler_1.broadcastRoomState)(io, roomId);
        }
    });
});
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
