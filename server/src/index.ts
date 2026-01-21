import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

// Room state interface
interface RoomState {
  videoId: string;
  isPlaying: boolean;
  lastActionTime: number;        // UTC Timestamp of when the Play/Pause happened
  timestampAtLastAction: number; // The video timestamp (in seconds) when the action happened
}

// Track users per room
interface RoomUsers {
  users: Set<string>;
}

// In-memory storage
const rooms: Map<string, RoomState> = new Map();
const roomUsers: Map<string, RoomUsers> = new Map();

// Default video to start with
const DEFAULT_VIDEO_ID = 'dQw4w9WgXcQ'; // Never Gonna Give You Up as placeholder

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Calculate current playback position based on room state
function getCurrentPlaybackTime(state: RoomState): number {
  if (!state.isPlaying) {
    return state.timestampAtLastAction;
  }
  const elapsed = (Date.now() - state.lastActionTime) / 1000;
  return state.timestampAtLastAction + elapsed;
}

// Get user count for a room
function getRoomUserCount(roomId: string): number {
  return roomUsers.get(roomId)?.users.size || 0;
}

// Broadcast user count update to room
function broadcastUserCount(roomId: string) {
  const count = getRoomUserCount(roomId);
  io.to(roomId).emit('user_count_update', { count, roomId });
  console.log(`[Presence] Room ${roomId}: ${count} users`);
}

// Socket.io connection handling
io.on('connection', (socket: Socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  
  // Track which room this socket is in
  let currentRoom: string | null = null;

  // Handle joining a room
  socket.on('join_room', (roomId: string) => {
    // Leave previous room if any
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

    // Track user in room
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, { users: new Set() });
    }
    roomUsers.get(roomId)!.users.add(socket.id);

    // Get or create room state
    let roomState = rooms.get(roomId);
    
    if (!roomState) {
      // Create new room with default state
      roomState = {
        videoId: DEFAULT_VIDEO_ID,
        isPlaying: false,
        lastActionTime: Date.now(),
        timestampAtLastAction: 0
      };
      rooms.set(roomId, roomState);
      console.log(`[Room] Created new room: ${roomId}`);
    }

    // Calculate current real-time timestamp for sync
    const currentSeconds = getCurrentPlaybackTime(roomState);
    
    // Send current state to joining user with calculated timestamp
    socket.emit('receive_state', {
      ...roomState,
      currentSeconds,
      serverTime: Date.now()
    });
    
    // Broadcast updated user count
    broadcastUserCount(roomId);
    
    console.log(`[Sync] Sent state to ${socket.id}: playing=${roomState.isPlaying}, timestamp=${currentSeconds.toFixed(2)}s`);
  });

  // Handle state updates (Play/Pause/Seek)
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

    // Update room state
    roomState.isPlaying = isPlaying;
    roomState.timestampAtLastAction = timestampAtLastAction;
    roomState.lastActionTime = Date.now();
    if (videoId) {
      roomState.videoId = videoId;
    }

    console.log(`[Update] Room ${roomId}: playing=${isPlaying}, timestamp=${timestampAtLastAction.toFixed(2)}s`);

    // Broadcast to all OTHER clients in the room
    socket.to(roomId).emit('receive_state', {
      ...roomState,
      currentSeconds: timestampAtLastAction,
      serverTime: Date.now()
    });
  });

  // Handle video change
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

    // Broadcast to ALL clients in the room (including sender)
    io.to(roomId).emit('receive_state', {
      ...roomState,
      currentSeconds: 0,
      serverTime: Date.now(),
      title,
      channel
    });
  });

  // Handle ephemeral chat messages
  socket.on('send_message', (data: { roomId: string; message: string }) => {
    const { roomId, message } = data;
    
    if (!message.trim()) return;
    
    console.log(`[Chat] Room ${roomId}: "${message.substring(0, 50)}..."`);
    
    // Broadcast to all OTHER clients in the room
    socket.to(roomId).emit('receive_message', {
      message: message.trim(),
      senderId: socket.id.substring(0, 6), // Short ID for privacy
      timestamp: Date.now()
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    
    // Remove from room tracking
    if (currentRoom) {
      const users = roomUsers.get(currentRoom);
      if (users) {
        users.users.delete(socket.id);
        broadcastUserCount(currentRoom);
        
        // Clean up empty rooms after delay
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

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    rooms: rooms.size,
    totalUsers: Array.from(roomUsers.values()).reduce((sum, r) => sum + r.users.size, 0)
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   HUM Sync Engine - Phase 3: The Lounge   ║
║              Port: ${PORT}                   ║
╚═══════════════════════════════════════════╝
  `);
});
