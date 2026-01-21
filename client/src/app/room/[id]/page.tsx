'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ImmersiveContainer from '@/components/Layout/ImmersiveContainer';
import NowPlaying from '@/components/UI/NowPlaying';
import ControlBar from '@/components/UI/ControlBar';
import SearchModal from '@/components/UI/SearchModal';
import PresenceBar from '@/components/UI/PresenceBar';
import WhisperInput from '@/components/UI/WhisperInput';
import WhisperToast from '@/components/UI/WhisperToast';
import { getSocket, RoomState, disconnectSocket } from '@/lib/socket';
import { OnProgressProps } from 'react-player/base';

// Dynamic import to avoid SSR issues
const VideoLayer = dynamic(() => import('@/components/Player/VideoLayer'), {
  ssr: false,
});

interface VideoLayerRef {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
}

interface SearchResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
}

interface ChatMessage {
  id: string;
  message: string;
  senderId: string;
  timestamp: number;
}

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id as string;

  // Player state
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ');
  const [videoTitle, setVideoTitle] = useState('Never Gonna Give You Up');
  const [videoChannel, setVideoChannel] = useState('Rick Astley');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isReady, setIsReady] = useState(false);
  
  // Socket state
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(1);
  
  // UI state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Refs
  const playerRef = useRef<VideoLayerRef>(null);
  const isRemoteUpdate = useRef(false);
  const lastEmitTime = useRef(0);

  // Keyboard shortcut for search (CMD+K / CTRL+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Socket connection and events
  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_room', roomId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Handle receiving state from server
    socket.on('receive_state', (state: RoomState & { title?: string; channel?: string }) => {
      console.log('[Room] Received state:', state);
      
      // Mark that this is a remote update to avoid echo
      isRemoteUpdate.current = true;

      // Update video if changed
      if (state.videoId !== videoId) {
        setVideoId(state.videoId);
      }
      
      // Update title/channel if provided
      if (state.title) setVideoTitle(state.title);
      if (state.channel) setVideoChannel(state.channel);

      // Update play state
      setIsPlaying(state.isPlaying);

      // Seek to the correct position
      if (playerRef.current && isReady) {
        const targetTime = state.currentSeconds;
        const currentPlayerTime = playerRef.current.getCurrentTime();
        const timeDiff = Math.abs(currentPlayerTime - targetTime);

        // Only seek if difference is significant (>0.5 seconds)
        if (timeDiff > 0.5) {
          console.log(`[Sync] Seeking from ${currentPlayerTime.toFixed(2)}s to ${targetTime.toFixed(2)}s`);
          playerRef.current.seekTo(targetTime);
        }
      }

      // Reset remote update flag after a short delay
      setTimeout(() => {
        isRemoteUpdate.current = false;
      }, 300);
    });

    // Handle user count updates
    socket.on('user_count_update', (data: { count: number }) => {
      setUserCount(data.count);
    });

    // Handle incoming chat messages
    socket.on('receive_message', (data: { message: string; senderId: string; timestamp: number }) => {
      const newMessage: ChatMessage = {
        id: `${data.timestamp}-${data.senderId}`,
        ...data
      };
      setMessages(prev => [...prev, newMessage]);
    });

    // Join room if already connected
    if (socket.connected) {
      setIsConnected(true);
      socket.emit('join_room', roomId);
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receive_state');
      socket.off('user_count_update');
      socket.off('receive_message');
      disconnectSocket();
    };
  }, [roomId, isReady, videoId]);

  // Emit state update to server (debounced)
  const emitStateUpdate = useCallback((playing: boolean, timestamp: number) => {
    const now = Date.now();
    // Debounce: only emit if 100ms has passed since last emit
    if (now - lastEmitTime.current < 100) return;
    if (isRemoteUpdate.current) return;

    lastEmitTime.current = now;
    const socket = getSocket();
    
    socket.emit('update_state', {
      roomId,
      videoId,
      isPlaying: playing,
      timestampAtLastAction: timestamp,
    });
    
    console.log(`[Emit] State update: playing=${playing}, timestamp=${timestamp.toFixed(2)}s`);
  }, [roomId, videoId]);

  // Handle play
  const handlePlay = () => {
    if (isRemoteUpdate.current) return;
    const time = playerRef.current?.getCurrentTime() || currentTime;
    setIsPlaying(true);
    emitStateUpdate(true, time);
  };

  // Handle pause
  const handlePause = () => {
    if (isRemoteUpdate.current) return;
    const time = playerRef.current?.getCurrentTime() || currentTime;
    setIsPlaying(false);
    emitStateUpdate(false, time);
  };

  // Handle play/pause toggle from controls
  const handlePlayPause = () => {
    const time = playerRef.current?.getCurrentTime() || currentTime;
    const newPlaying = !isPlaying;
    setIsPlaying(newPlaying);
    emitStateUpdate(newPlaying, time);
  };

  // Handle seek from controls
  const handleSeek = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds);
      setCurrentTime(seconds);
      emitStateUpdate(isPlaying, seconds);
    }
  };

  // Handle progress update
  const handleProgress = (state: OnProgressProps) => {
    setCurrentTime(state.playedSeconds);
  };

  // Handle duration
  const handleDuration = (dur: number) => {
    setDuration(dur);
  };

  // Handle player ready
  const handleReady = () => {
    setIsReady(true);
  };

  // Handle volume change
  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
  };

  // Handle video selection from search
  const handleSelectVideo = (result: SearchResult) => {
    const socket = getSocket();
    socket.emit('change_video', { 
      roomId, 
      videoId: result.videoId,
      title: result.title,
      channel: result.channel
    });
    setVideoTitle(result.title);
    setVideoChannel(result.channel);
  };

  // Handle sending chat message
  const handleSendMessage = (message: string) => {
    const socket = getSocket();
    socket.emit('send_message', { roomId, message });
  };

  // Handle message expiration
  const handleMessageExpire = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="relative min-h-screen bg-[#09090b] overflow-hidden">
      {/* Video Layer - Ambient Background */}
      <VideoLayer
        ref={playerRef}
        videoId={videoId}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onProgress={handleProgress}
        onReady={handleReady}
        onDuration={handleDuration}
      />

      {/* Whisper Toast Messages */}
      <WhisperToast messages={messages} onMessageExpire={handleMessageExpire} />

      {/* Content Overlay */}
      <ImmersiveContainer>
        <div className="relative z-30 min-h-screen flex flex-col">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left: Presence */}
            <PresenceBar userCount={userCount} isConnected={isConnected} />

            {/* Center: Room ID + Slogan */}
            <div className="flex flex-col items-center">
              <span className="text-xs tracking-[0.3em] uppercase text-zinc-600">
                {roomId}
              </span>
              <span className="text-[10px] tracking-wider text-zinc-700 mt-0.5">
                हम। तुम। धुन।
              </span>
            </div>

            {/* Right: Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 
                         border border-zinc-800/50 rounded-lg
                         text-xs text-zinc-500 hover:text-zinc-400 
                         hover:border-zinc-700 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 bg-zinc-800 rounded text-[10px]">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Center: Now Playing */}
          <div className="flex-1 flex items-center justify-center py-16">
            <NowPlaying
              title={videoTitle}
              artist={videoChannel}
              isPlaying={isPlaying}
            />
          </div>

          {/* Bottom: Controls + Chat */}
          <div className="pb-8 space-y-6">
            <ControlBar
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              onVolumeChange={handleVolumeChange}
            />

            {/* Whisper Input */}
            <div className="flex justify-center">
              <WhisperInput onSendMessage={handleSendMessage} />
            </div>
          </div>
        </div>
      </ImmersiveContainer>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectVideo={handleSelectVideo}
      />
    </div>
  );
}
