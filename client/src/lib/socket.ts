import { io, Socket } from 'socket.io-client';

// Use environment variable for production, fallback to localhost
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export interface RoomState {
  videoId: string;
  isPlaying: boolean;
  lastActionTime: number;
  timestampAtLastAction: number;
  currentSeconds: number;
  serverTime: number;
}

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
