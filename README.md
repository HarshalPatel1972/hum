# HUM ~ TUM ~ DHUN 🎵

**The ultimate synchronized music listening experience**

[![Deploy Status](https://img.shields.io/badge/status-deployed-success)](https://hum-pi.vercel.app)

## 🚀 Live Demo
- **Frontend**: [hum-pi.vercel.app](https://hum-pi.vercel.app)
- **Backend**: [hum-sync-server.onrender.com](https://hum-sync-server.onrender.com)

## ✨ Features

### Core Experience
- 🎧 **Perfect Sync** - Sub-500ms synchronization across all devices
- 🎵 **YouTube Integration** - Play any song from YouTube's library
- 🔄 **Auto-play Queue** - Previous/Next track navigation with history
- 💎 **Premium UI** - Glassmorphism, spring animations, and micro-interactions

### Advanced Controls
- 👤 **Personal/Room Modes** - Control only yourself or affect everyone
- ⏯️ **Smart Resume** - Reload without disrupting others
- 🔊 **Voice Chat** - WebRTC peer-to-peer audio with speaking indicators
- 💬 **Ephemeral Chat** - Whisper messages that fade away

### Performance
- 🚀 **RAM Optimized** - ~500-600MB (down from 1400MB)
- 🎨 **Lightweight Effects** - SVG grain overlay, CSS animations
- 📱 **Mobile First** - Touch-optimized controls
- ⚡ **Instant Sync** - 0.5s threshold with periodic checks

## 🎨 Design Philosophy

**Premium, not MVP** - Every interaction feels polished:
- Glassmorphic elements with backdrop blur
- Spring-physics animations (Framer Motion)
- Glow effects and pulsing indicators
- Smooth micro-interactions on hover/tap

**Performance-first** - Beautiful but efficient:
- Replaced canvas grain with SVG filter (-200MB)
- Removed color extraction (-300MB)
- Hidden audio player instead of video (-400MB)
- Memoized heavy components

## 🏗️ Tech Stack

### Frontend (Next.js 14+)
- **Framework**: Next.js with App Router
- **Styling**: Tailwind CSS + Custom CSS
- **Animations**: Framer Motion
- **Fonts**: Inter, Outfit (Google Fonts)
- **Audio**: ReactPlayer (YouTube)
- **Voice**: WebRTC with native browser APIs

### Backend (Node.js + Socket.io)
- **Runtime**: Node.js + TypeScript
- **Real-time**: Socket.io for state sync
- **Signaling**: WebRTC signaling server
- **Hosting**: Render.com (free tier)

## 🚦 Quick Start

### Prerequisites
- Node.js 18+
- YouTube Data API v3 key

### Installation

```bash
# Clone the repo
git clone https://github.com/HarshalPatel1972/hum.git
cd hum

# Install dependencies (root)
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### Environment Setup

**Client** (`client/.env.local`):
```env
YOUTUBE_API_KEY=your_youtube_api_key
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

**Server** (optional for production):
```env
FRONTEND_URL=https://hum-pi.vercel.app
PORT=3001
```

### Development

```bash
# From root directory
npm run dev

# Opens:
# - Client: http://localhost:3000
# - Server: http://localhost:3001
```

## 📁 Project Structure

```
hum/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/
│   │   │   ├── UI/        # ControlBar, SearchModal, NowPlaying
│   │   │   ├── Player/    # VideoLayer (audio player)
│   │   │   ├── Voice/     # VoiceChat (WebRTC)
│   │   │   └── Effects/   # GrainOverlay, LoadingScreen
│   │   └── lib/           # socket, username-generator
│   └── public/
│
├── server/                # Node.js backend
│   └── src/
│       └── index.ts       # Socket.io + WebRTC signaling
│
└── package.json           # Root workspace
```

## 🎯 Key Features Explained

### 1. Personal vs Room Control
Toggle between:
- **Personal**: Play/pause only affects you
- **Room**: Play/pause syncs for everyone

### 2. Perfect Synchronization
- 0.5s drift threshold (tighter than most apps)
- Periodic sync checks every 5 seconds
- Cooldown mechanism prevents sync loops
- Late joiners sync instantly without disruption

### 3. Voice Chat
- Peer-to-peer WebRTC connections
- Speaking indicators with voice activity detection
- Mute/unmute with visual feedback
- Automatic cleanup on disconnect

### 4. Creative Usernames
Auto-generated poetic handles like:
- `jade-cosmic-wave`
- `ruby-velvet-pulse`
- `amber-stellar-glow`

## 🔧 Configuration

### YouTube API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add to `client/.env.local`

### Deployment

**Frontend (Vercel)**:
```bash
cd client
vercel deploy
```

**Backend (Render)**:
- Connect GitHub repo
- Set `FRONTEND_URL` environment variable
- Deploy from `server` directory

## 🎨 Design Tokens

```css
/* Key colors */
--bg-primary: #09090b (zinc-950)
--glass-bg: rgba(255,255,255,0.05)
--glass-border: rgba(255,255,255,0.1)
--accent: rgba(255,255,255,0.8)

/* Animations */
--spring: cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-out: cubic-bezier(0.33, 1, 0.68, 1)
```

## 📊 Performance Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| RAM Usage | 1400MB | ~550MB | **-61%** |
| Sync Accuracy | ±2s | ±0.5s | **4x better** |
| Initial Load | ~3s | ~1.5s | **2x faster** |

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Submit a PR with clear description

## 📝 License

MIT - feel free to use for personal or commercial projects

## 🙏 Credits

- **Built by**: Harshal Patel
- **Inspiration**: Listening to music with friends, but better
- **Tech**: Next.js, Socket.io, WebRTC, Framer Motion

---

**Made with ❤️ for music lovers everywhere**

*हम ~ तुम ~ धुन* - We, You, Tune
