import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

// Room state interface
interface RoomState {
  videoId: string;
  isPlaying: boolean;
  lastActionTime: number;
  timestampAtLastAction: number;
}

interface RoomUsers {
  users: Set<string>;
}

const rooms: Map<string, RoomState> = new Map();
const roomUsers: Map<string, RoomUsers> = new Map();

const DEFAULT_VIDEO_ID = 'dQw4w9WgXcQ';

// Production CORS configuration
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3002',
  process.env.FRONTEND_URL, // Set this in Railway
].filter(Boolean) as string[];

const app = express();
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

function getCurrentPlaybackTime(state: RoomState): number {
  if (!state.isPlaying) {
    return state.timestampAtLastAction;
  }
  const elapsed = (Date.now() - state.lastActionTime) / 1000;
  return state.timestampAtLastAction + elapsed;
}

function getRoomUserCount(roomId: string): number {
  return roomUsers.get(roomId)?.users.size || 0;
}

function broadcastUserCount(roomId: string) {
  const count = getRoomUserCount(roomId);
  io.to(roomId).emit('user_count_update', { count, roomId });
  console.log(`[Presence] Room ${roomId}: ${count} users`);
}

io.on('connection', (socket: Socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  
  let currentRoom: string | null = null;

  socket.on('join_room', (roomId: string) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      const prevRoomUsers = roomUsers.get(currentRoom);
      if (prevRoomUsers) {
        prevRoomUsers.users.delete(socket.id);
        broadcastUserCount(currentRoom);
      }
    }

    socket.join(roomId);
    currentRoom = roomId;
    console.log(`[Room] ${socket.id} joined room: ${roomId}`);

    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, { users: new Set() });
    }
    roomUsers.get(roomId)!.users.add(socket.id);

    let roomState = rooms.get(roomId);
    
    if (!roomState) {
      roomState = {
        videoId: DEFAULT_VIDEO_ID,
        isPlaying: false,
        lastActionTime: Date.now(),
        timestampAtLastAction: 0
      };
      rooms.set(roomId, roomState);
      console.log(`[Room] Created new room: ${roomId}`);
    }

    const currentSeconds = getCurrentPlaybackTime(roomState);
    
    socket.emit('receive_state', {
      ...roomState,
      currentSeconds,
      serverTime: Date.now()
    });
    
    broadcastUserCount(roomId);
    
    console.log(`[Sync] Sent state to ${socket.id}: playing=${roomState.isPlaying}, timestamp=${currentSeconds.toFixed(2)}s`);
  });

  socket.on('update_state', (data: {
    roomId: string;
    videoId?: string;
    isPlaying: boolean;
    timestampAtLastAction: number;
  }) => {
    const { roomId, videoId, isPlaying, timestampAtLastAction } = data;
    
    const roomState = rooms.get(roomId);
    if (!roomState) {
      console.log(`[Error] Room not found: ${roomId}`);
      return;
    }

    roomState.isPlaying = isPlaying;
    roomState.timestampAtLastAction = timestampAtLastAction;
    roomState.lastActionTime = Date.now();
    if (videoId) {
      roomState.videoId = videoId;
    }

    console.log(`[Update] Room ${roomId}: playing=${isPlaying}, timestamp=${timestampAtLastAction.toFixed(2)}s`);

    socket.to(roomId).emit('receive_state', {
      ...roomState,
      currentSeconds: timestampAtLastAction,
      serverTime: Date.now()
    });
  });

  socket.on('change_video', (data: { roomId: string; videoId: string; title?: string; channel?: string }) => {
    const { roomId, videoId, title, channel } = data;
    
    let roomState = rooms.get(roomId);
    if (!roomState) {
      roomState = {
        videoId,
        isPlaying: false,
        lastActionTime: Date.now(),
        timestampAtLastAction: 0
      };
      rooms.set(roomId, roomState);
    } else {
      roomState.videoId = videoId;
      roomState.isPlaying = false;
      roomState.lastActionTime = Date.now();
      roomState.timestampAtLastAction = 0;
    }

    console.log(`[Video] Room ${roomId}: changed to ${videoId} - "${title}" by ${channel}`);

    io.to(roomId).emit('receive_state', {
      ...roomState,
      currentSeconds: 0,
      serverTime: Date.now(),
      title,
      channel
    });
  });

  socket.on('send_message', (data: { roomId: string; message: string }) => {
    const { roomId, message } = data;
    
    if (!message.trim()) return;
    
    console.log(`[Chat] Room ${roomId}: "${message.substring(0, 50)}..."`);
    
    socket.to(roomId).emit('receive_message', {
      message: message.trim(),
      senderId: socket.id.substring(0, 6),
      timestamp: Date.now()
    });
  });

  // WebRTC Signaling for Voice Chat
  socket.on('voice:offer', (data: { roomId: string; offer: RTCSessionDescriptionInit; targetId: string }) => {
    console.log(`[Voice] Offer from ${socket.id} to ${data.targetId}`);
    io.to(data.targetId).emit('voice:offer', {
      offer: data.offer,
      senderId: socket.id
    });
  });

  socket.on('voice:answer', (data: { roomId: string; answer: RTCSessionDescriptionInit; targetId: string }) => {
    console.log(`[Voice] Answer from ${socket.id} to ${data.targetId}`);
    io.to(data.targetId).emit('voice:answer', {
      answer: data.answer,
      senderId: socket.id
    });
  });

  socket.on('voice:ice-candidate', (data: { roomId: string; candidate: RTCIceCandidateInit; targetId: string }) => {
    io.to(data.targetId).emit('voice:ice-candidate', {
      candidate: data.candidate,
      senderId: socket.id
    });
  });

  // When a user enables voice - notify ALL others in room
  socket.on('voice:enabled', (data: { roomId: string }) => {
    console.log(`[Voice] ${socket.id} enabled voice in room ${data.roomId}`);
    socket.to(data.roomId).emit('voice:user-enabled', {
      userId: socket.id
    });
  });

  // When a user disables voice - notify ALL others in room
  socket.on('voice:disabled', (data: { roomId: string }) => {
    console.log(`[Voice] ${socket.id} disabled voice in room ${data.roomId}`);
    socket.to(data.roomId).emit('voice:user-disabled', {
      userId: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    
    if (currentRoom) {
      const users = roomUsers.get(currentRoom);
      if (users) {
        users.users.delete(socket.id);
        broadcastUserCount(currentRoom);
        
        if (users.users.size === 0) {
          setTimeout(() => {
            if (getRoomUserCount(currentRoom!) === 0) {
              roomUsers.delete(currentRoom!);
              rooms.delete(currentRoom!);
              console.log(`[Room] Cleaned up empty room: ${currentRoom}`);
            }
          }, 30000);
        }
      }
    }
  });
});

// Health check for Railway
app.get('/', (_req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'HUM Sync Engine',
    rooms: rooms.size,
    totalUsers: Array.from(roomUsers.values()).reduce((sum, r) => sum + r.users.size, 0)
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║     HUM Sync Engine - Production Ready    ║
║              Port: ${PORT}                   ║
╚═══════════════════════════════════════════╝
  `);
});
