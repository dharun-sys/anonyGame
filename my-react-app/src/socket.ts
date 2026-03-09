import { io, Socket } from 'socket.io-client';

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';
export const socket: Socket = io('anonygame-production.up.railway.app');

export default socket;
