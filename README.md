# HUM - Synchronized Music Listening

> **Phase 1: The Sync Engine** - Achieve <100ms latency synchronization of YouTube video state between multiple clients.

## Tech Stack

- **Backend**: Node.js, Express, Socket.io v4
- **Frontend**: Next.js 14+ (App Router), Tailwind CSS, react-player
- **Language**: TypeScript

## Quick Start

```bash
# 1. Install all dependencies
npm run install:all

# 2. Start both server and client
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

## Project Structure

```
hum/
├── server/          # Express + Socket.io backend
│   └── src/
│       └── index.ts # Main server file
├── client/          # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── page.tsx       # Landing page
│       │   └── room/[id]/     # Room page
│       ├── components/        # React components
│       └── lib/
│           └── socket.ts      # Socket.io client
└── package.json     # Root package with startup scripts
```

## Features

- **Room-based sync**: Create or join rooms by ID
- **Real-time sync**: Play, pause, and seek synced across all clients
- **Late-join sync**: New users jump to current playback position
- **Debug panel**: Monitor connection status, latency, and sync accuracy

## How It Works

The sync algorithm uses server-authoritative timestamps:

1. **Room state** stores `timestampAtLastAction` and `lastActionTime` (when action occurred)
2. **On join**: Server calculates current position: `currentSeconds = timestampAtLastAction + ((now - lastActionTime) / 1000)`
3. **On action**: Server broadcasts new state to all other clients
4. **Client seek**: Seeks to server-provided timestamp to account for latency
