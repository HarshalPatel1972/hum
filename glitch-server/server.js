const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Room state storage
const rooms = new Map();
const roomUsers = new Map();

const DEFAULT_VIDEO_ID = ''; // No default music - room starts empty

// Production CORS - add your Vercel URL here
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3002',
  process.env.FRONTEND_URL,
].filter(Boolean);

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

// Calculate current playback position
function getCurrentPlaybackTime(state) {
  if (!state.isPlaying) {
    return state.timestampAtLastAction;
  }
  const elapsed = (Date.now() - state.lastActionTime) / 1000;
  return state.timestampAtLastAction + elapsed;
}

function getRoomUserCount(roomId) {
  return roomUsers.get(roomId)?.users.size || 0;
}

function broadcastUserCount(roomId) {
  const count = getRoomUserCount(roomId);
  io.to(roomId).emit('user_count_update', { count, roomId });
  console.log(`[Presence] Room ${roomId}: ${count} users`);
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  
  let currentRoom = null;

  socket.on('join_room', (roomId) => {
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
    roomUsers.get(roomId).users.add(socket.id);

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
  });

  socket.on('update_state', (data) => {
    const { roomId, videoId, isPlaying, timestampAtLastAction } = data;
    
    const roomState = rooms.get(roomId);
    if (!roomState) return;

    roomState.isPlaying = isPlaying;
    roomState.timestampAtLastAction = timestampAtLastAction;
    roomState.lastActionTime = Date.now();
    if (videoId) roomState.videoId = videoId;

    console.log(`[Update] Room ${roomId}: playing=${isPlaying}, timestamp=${timestampAtLastAction.toFixed(2)}s`);

    socket.to(roomId).emit('receive_state', {
      ...roomState,
      currentSeconds: timestampAtLastAction,
      serverTime: Date.now()
    });
  });

  socket.on('change_video', (data) => {
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

    console.log(`[Video] Room ${roomId}: changed to ${videoId}`);

    io.to(roomId).emit('receive_state', {
      ...roomState,
      currentSeconds: 0,
      serverTime: Date.now(),
      title,
      channel
    });
  });

  socket.on('send_message', (data) => {
    const { roomId, message } = data;
    if (!message.trim()) return;
    
    socket.to(roomId).emit('receive_message', {
      message: message.trim(),
      senderId: socket.id.substring(0, 6),
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    
    if (currentRoom) {
      const users = roomUsers.get(currentRoom);
      if (users) {
        users.users.delete(socket.id);
        broadcastUserCount(currentRoom);
        
        // Cleanup empty rooms after 30 seconds
        if (users.users.size === 0) {
          const roomToClean = currentRoom;
          setTimeout(() => {
            if (getRoomUserCount(roomToClean) === 0) {
              roomUsers.delete(roomToClean);
              rooms.delete(roomToClean);
              console.log(`[Room] Cleaned up: ${roomToClean}`);
            }
          }, 30000);
        }
      }
    }
  });
});

// Health check endpoints (for UptimeRobot)
app.get('/', (req, res) => {
  res.json({ 
    status: 'alive',
    service: 'HUM Sync Engine',
    rooms: rooms.size,
    uptime: process.uptime()
  });
});

app.get('/health', (req, res) => {
  res.send('OK');
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║       HUM Sync Engine - Glitch            ║
║              Port: ${PORT}                   ║
╚═══════════════════════════════════════════╝
  `);
});
