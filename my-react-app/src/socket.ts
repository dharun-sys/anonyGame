import { io, Socket } from 'socket.io-client';

const SERVER = import.meta.env.VITE_SERVER_URL || 'https://anonygame-production.up.railway.app';

export const socket: Socket = io(SERVER, {
  // Mobile-friendly settings
  transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  // Prevent aggressive disconnects on mobile
  forceNew: false,
  autoConnect: true,
});

export default socket;
