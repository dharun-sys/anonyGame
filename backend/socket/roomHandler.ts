import { Server } from 'socket.io';
import { Room } from '../models/Room';
import { Player } from '../models/Player';

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function getRoom(roomId: string): Room | null {
  return rooms.get(roomId) || null;
}

export function createRoom(hostId: string): Room {
  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();

  const room: Room = {
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

export function joinRoom(roomId: string, player: Player): { ok: boolean; reason?: string } {
  const room = rooms.get(roomId);
  if (!room) return { ok: false, reason: 'Room not found' };
  if (room.players.length >= 10) return { ok: false, reason: 'Room is full (max 10)' };
  if (room.players.find((p) => p.id === player.id)) return { ok: false, reason: 'Already in room' };
  room.players.push(player);
  return { ok: true };
}

/**
 * Rejoin an existing room by displayName (for refresh during game).
 * Updates the player's socket id to the new one.
 */
export function rejoinRoom(
  roomId: string,
  displayName: string,
  newSocketId: string
): { ok: boolean; reason?: string; player?: Player } {
  const room = rooms.get(roomId);
  if (!room) return { ok: false, reason: 'Room not found' };
  const player = room.players.find((p) => p.displayName === displayName);
  if (!player) return { ok: false, reason: 'Player not found in room' };
  const oldId = player.id;
  player.id = newSocketId;
  player.connected = true;
  // update hostId if this player was host
  if (room.hostId === oldId) room.hostId = newSocketId;
  // update references in rounds
  for (const round of room.rounds) {
    if (round.targetPlayerId === oldId) round.targetPlayerId = newSocketId;
    if ((round as any).targetPlayerId2 === oldId) (round as any).targetPlayerId2 = newSocketId;
    if ((round as any).secretPhrasePlayerId === oldId) (round as any).secretPhrasePlayerId = newSocketId;
    for (const ans of round.answers) {
      if (ans.playerId === oldId) ans.playerId = newSocketId;
    }
  }
  return { ok: true, player };
}

export function leaveRoom(roomId: string, socketId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  // If game is in progress, just mark disconnected (allow rejoin)
  if (room.gameStarted) {
    const player = room.players.find((p) => p.id === socketId);
    if (player) player.connected = false;
    return;
  }

  // Otherwise remove player entirely
  room.players = room.players.filter((p) => p.id !== socketId);
  if (room.hostId === socketId && room.players.length > 0) {
    room.hostId = room.players[0].id;
  }
  if (room.players.length === 0) rooms.delete(roomId);
}

export function deleteRoom(roomId: string) {
  rooms.delete(roomId);
}

export function broadcastRoomState(io: Server, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
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
