"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoom = getRoom;
exports.createRoom = createRoom;
exports.joinRoom = joinRoom;
exports.rejoinRoom = rejoinRoom;
exports.leaveRoom = leaveRoom;
exports.deleteRoom = deleteRoom;
exports.broadcastRoomState = broadcastRoomState;
const rooms = new Map();
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++)
        code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}
function getRoom(roomId) {
    return rooms.get(roomId) || null;
}
function createRoom(hostId) {
    let code = generateRoomCode();
    while (rooms.has(code))
        code = generateRoomCode();
    const room = {
        roomId: code,
        hostId,
        players: [],
        gameStarted: false,
        currentRoundIndex: 0,
        rounds: [],
        createdAt: Date.now(),
        gameMode: 'standard',
    };
    rooms.set(code, room);
    return room;
}
function joinRoom(roomId, player) {
    const room = rooms.get(roomId);
    if (!room)
        return { ok: false, reason: 'Room not found' };
    if (room.players.length >= 10)
        return { ok: false, reason: 'Room is full (max 10)' };
    if (room.players.find((p) => p.id === player.id))
        return { ok: false, reason: 'Already in room' };
    room.players.push(player);
    return { ok: true };
}
/**
 * Rejoin an existing room by displayName (for refresh during game).
 * Updates the player's socket id to the new one.
 */
function rejoinRoom(roomId, displayName, newSocketId) {
    const room = rooms.get(roomId);
    if (!room)
        return { ok: false, reason: 'Room not found' };
    const player = room.players.find((p) => p.displayName === displayName);
    if (!player)
        return { ok: false, reason: 'Player not found in room' };
    const oldId = player.id;
    player.id = newSocketId;
    player.connected = true;
    // update hostId if this player was host
    if (room.hostId === oldId)
        room.hostId = newSocketId;
    // update references in rounds
    for (const round of room.rounds) {
        if (round.targetPlayerId === oldId)
            round.targetPlayerId = newSocketId;
        if (round.targetPlayerId2 === oldId)
            round.targetPlayerId2 = newSocketId;
        if (round.secretPhrasePlayerId === oldId)
            round.secretPhrasePlayerId = newSocketId;
        for (const ans of round.answers) {
            if (ans.playerId === oldId)
                ans.playerId = newSocketId;
        }
    }
    return { ok: true, player };
}
function leaveRoom(roomId, socketId) {
    const room = rooms.get(roomId);
    if (!room)
        return;
    // If game is in progress, just mark disconnected (allow rejoin)
    if (room.gameStarted) {
        const player = room.players.find((p) => p.id === socketId);
        if (player)
            player.connected = false;
        return;
    }
    // Otherwise remove player entirely
    room.players = room.players.filter((p) => p.id !== socketId);
    if (room.hostId === socketId && room.players.length > 0) {
        room.hostId = room.players[0].id;
    }
    if (room.players.length === 0)
        rooms.delete(roomId);
}
function deleteRoom(roomId) {
    rooms.delete(roomId);
}
function broadcastRoomState(io, roomId) {
    const room = rooms.get(roomId);
    if (!room)
        return;
    const safePlayers = room.players.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        score: p.score,
        connected: p.connected,
    }));
    io.to(roomId).emit('room_state', {
        roomId: room.roomId,
        hostId: room.hostId,
        players: safePlayers,
        gameStarted: room.gameStarted,
        currentRoundIndex: room.currentRoundIndex,
        totalRounds: room.rounds.length,
        gameMode: room.gameMode || 'standard',
    });
}
