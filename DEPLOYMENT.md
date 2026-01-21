# HUM Production Deployment Guide

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│     Vercel      │ ◄─────► │     Railway     │
│   (Frontend)    │   WS    │    (Backend)    │
│   Next.js App   │         │   Socket.io     │
└─────────────────┘         └─────────────────┘
        │                           │
        ▼                           ▼
   hum.vercel.app          hum-server.railway.app
```

---

## Step 1: Deploy Backend to Railway (10 min)

### 1.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### 1.2 Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose `HarshalPatel1972/hum`
4. Railway will detect the monorepo

### 1.3 Configure the Server Service
1. Click on the deployed service
2. Go to **Settings** → **Root Directory**
3. Set to: `server`
4. Go to **Settings** → **Build Command**:
   ```
   npm install && npm run build
   ```
5. Go to **Settings** → **Start Command**:
   ```
   npm start
   ```

### 1.4 Add Environment Variables
Go to **Variables** tab and add:
```
FRONTEND_URL=https://your-app-name.vercel.app
```
(You'll update this after deploying to Vercel)

### 1.5 Generate Domain
1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `hum-server-production.up.railway.app`)

---

## Step 2: Deploy Frontend to Vercel (10 min)

### 2.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### 2.2 Import Project
1. Click **"Add New"** → **"Project"**
2. Import `HarshalPatel1972/hum`
3. Configure:
   - **Root Directory**: `client`
   - **Framework Preset**: Next.js (auto-detected)

### 2.3 Add Environment Variables
In the Vercel dashboard, add:
```
YOUTUBE_API_KEY=AIzaSyATuvPOcZ6x58ITz53MV5hH9OfEfYdv0XA
NEXT_PUBLIC_SOCKET_URL=https://your-railway-url.up.railway.app
```

### 2.4 Deploy
Click **"Deploy"** and wait ~2 minutes.

---

## Step 3: Update Railway with Vercel URL

1. Go back to Railway dashboard
2. Update the `FRONTEND_URL` variable:
   ```
   FRONTEND_URL=https://your-app-name.vercel.app
   ```
3. Railway will auto-redeploy

---

## Step 4: Test Production

1. Open your Vercel URL
2. Create a room
3. Open in another browser/incognito
4. Join the same room
5. Verify sync works!

---

## Environment Variables Summary

### Railway (Backend)
| Variable | Value |
|----------|-------|
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `PORT` | Auto-set by Railway |

### Vercel (Frontend)
| Variable | Value |
|----------|-------|
| `YOUTUBE_API_KEY` | Your YouTube API key |
| `NEXT_PUBLIC_SOCKET_URL` | `https://your-server.railway.app` |

---

## Troubleshooting

### CORS Errors
- Make sure `FRONTEND_URL` in Railway matches your Vercel domain exactly
- Redeploy Railway after changing variables

### Socket Connection Failed
- Check Railway logs for errors
- Verify `NEXT_PUBLIC_SOCKET_URL` is correct in Vercel

### YouTube Search Not Working
- Verify `YOUTUBE_API_KEY` is set in Vercel
- Check API quota in Google Cloud Console

---

## Cost

| Service | Free Tier |
|---------|-----------|
| Railway | 500 hours/month (~20 days continuous) |
| Vercel | Unlimited for personal projects |

For production with more traffic, Railway Pro is $5/month.
