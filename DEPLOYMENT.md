# HUM Production Deployment Guide

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│     Vercel      │ ◄─────► │     Fly.io      │
│   (Frontend)    │   WS    │    (Backend)    │
│   Next.js App   │         │   Socket.io     │
└─────────────────┘         └─────────────────┘
        │                           │
        ▼                           ▼
   hum.vercel.app         hum-sync-server.fly.dev
```

---

## Step 1: Deploy Backend to Fly.io (15 min)

### 1.1 Install Fly CLI

**Windows (PowerShell as Admin):**
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**Or download from:** https://fly.io/docs/flyctl/install/

### 1.2 Sign Up & Login
```bash
flyctl auth signup
# Or if you have an account:
flyctl auth login
```

### 1.3 Build the Server
```bash
cd server
npm install
npm run build
```

### 1.4 Launch on Fly.io
```bash
cd server
flyctl launch --name hum-sync-server --region bom --no-deploy
```
- Say **No** to Postgres/Redis
- Say **Yes** to .dockerignore if asked

### 1.5 Set Environment Variable
```bash
flyctl secrets set FRONTEND_URL=https://your-app.vercel.app
```

### 1.6 Deploy
```bash
flyctl deploy
```

### 1.7 Get Your URL
```bash
flyctl status
```
Your server URL will be: `https://hum-sync-server.fly.dev`

---

## Step 2: Deploy Frontend to Vercel (5 min)

### 2.1 Go to Vercel
1. Visit [vercel.com](https://vercel.com)
2. Sign up/login with GitHub

### 2.2 Import Project
1. Click **"Add New"** → **"Project"**
2. Import `HarshalPatel1972/hum`
3. Set **Root Directory**: `client`

### 2.3 Add Environment Variables
```
YOUTUBE_API_KEY=AIzaSyATuvPOcZ6x58ITz53MV5hH9OfEfYdv0XA
NEXT_PUBLIC_SOCKET_URL=https://hum-sync-server.fly.dev
```

### 2.4 Deploy
Click **Deploy** - done in ~2 minutes!

---

## Step 3: Update Fly.io with Vercel URL

```bash
cd server
flyctl secrets set FRONTEND_URL=https://your-actual-vercel-url.vercel.app
```

---

## Quick Reference

### Fly.io Commands
```bash
flyctl status          # Check app status
flyctl logs            # View logs
flyctl secrets list    # List env vars
flyctl deploy          # Redeploy after changes
```

### Environment Variables

**Fly.io (Backend):**
| Variable | Value |
|----------|-------|
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `PORT` | `8080` (auto-set in fly.toml) |

**Vercel (Frontend):**
| Variable | Value |
|----------|-------|
| `YOUTUBE_API_KEY` | Your YouTube API key |
| `NEXT_PUBLIC_SOCKET_URL` | `https://hum-sync-server.fly.dev` |

---

## Cost: $0

| Service | Free Tier |
|---------|-----------|
| **Fly.io** | 3 shared VMs, always-on ✓ |
| **Vercel** | Unlimited for personal projects |

---

## Troubleshooting

### "Connection refused" errors
```bash
flyctl logs  # Check for startup errors
```

### CORS errors
Make sure `FRONTEND_URL` in Fly.io matches your Vercel URL exactly:
```bash
flyctl secrets set FRONTEND_URL=https://exact-url.vercel.app
```

### YouTube search not working
Check that `YOUTUBE_API_KEY` is set in Vercel dashboard.
