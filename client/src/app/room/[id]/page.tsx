'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import GrainOverlay from '@/components/Effects/GrainOverlay';
import DynamicBackground from '@/components/Effects/DynamicBackground';
import HeartbeatAura from '@/components/Effects/HeartbeatAura';
import LoadingScreen from '@/components/Effects/LoadingScreen';
import NowPlaying from '@/components/UI/NowPlaying';
import ControlBar from '@/components/UI/ControlBar';
import SearchModal from '@/components/UI/SearchModal';
import PresenceBar from '@/components/UI/PresenceBar';
import WhisperInput from '@/components/UI/WhisperInput';
import WhisperToast from '@/components/UI/WhisperToast';
import { getSocket, RoomState, disconnectSocket } from '@/lib/socket';
import { OnProgressProps } from 'react-player/base';
import { useIdle } from '@/hooks/useIdle';

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

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Player state
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ');
  const [videoTitle, setVideoTitle] = useState('Never Gonna Give You Up');
  const [videoChannel, setVideoChannel] = useState('Rick Astley');
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
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
  
  // Idle state for fade
  const isIdle = useIdle(4000);
  
  // Refs
  const playerRef = useRef<VideoLayerRef>(null);
  const isRemoteUpdate = useRef(false);
  const lastEmitTime = useRef(0);

  // Update thumbnail when video changes
  useEffect(() => {
    setVideoThumbnail(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
  }, [videoId]);

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

    socket.on('receive_state', (state: RoomState & { title?: string; channel?: string }) => {
      isRemoteUpdate.current = true;

      if (state.videoId !== videoId) {
        setVideoId(state.videoId);
      }
      
      if (state.title) setVideoTitle(state.title);
      if (state.channel) setVideoChannel(state.channel);

      setIsPlaying(state.isPlaying);

      if (playerRef.current && isReady) {
        const targetTime = state.currentSeconds;
        const currentPlayerTime = playerRef.current.getCurrentTime();
        const timeDiff = Math.abs(currentPlayerTime - targetTime);

        if (timeDiff > 0.5) {
          playerRef.current.seekTo(targetTime);
        }
      }

      setTimeout(() => {
        isRemoteUpdate.current = false;
      }, 300);
    });

    socket.on('user_count_update', (data: { count: number }) => {
      setUserCount(data.count);
    });

    socket.on('receive_message', (data: { message: string; senderId: string; timestamp: number }) => {
      const newMessage: ChatMessage = {
        id: `${data.timestamp}-${data.senderId}`,
        ...data
      };
      setMessages(prev => [...prev, newMessage]);
    });

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

  const emitStateUpdate = useCallback((playing: boolean, timestamp: number) => {
    const now = Date.now();
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
  }, [roomId, videoId]);

  const handlePlay = () => {
    if (isRemoteUpdate.current) return;
    const time = playerRef.current?.getCurrentTime() || currentTime;
    setIsPlaying(true);
    emitStateUpdate(true, time);
  };

  const handlePause = () => {
    if (isRemoteUpdate.current) return;
    const time = playerRef.current?.getCurrentTime() || currentTime;
    setIsPlaying(false);
    emitStateUpdate(false, time);
  };

  const handlePlayPause = () => {
    const time = playerRef.current?.getCurrentTime() || currentTime;
    const newPlaying = !isPlaying;
    setIsPlaying(newPlaying);
    emitStateUpdate(newPlaying, time);
  };

  const handleSeek = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds);
      setCurrentTime(seconds);
      emitStateUpdate(isPlaying, seconds);
    }
  };

  const handleProgress = (state: OnProgressProps) => {
    setCurrentTime(state.playedSeconds);
  };

  const handleDuration = (dur: number) => {
    setDuration(dur);
  };

  const handleReady = () => {
    setIsReady(true);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
  };

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
    setVideoThumbnail(result.thumbnail);
  };

  const handleSendMessage = (message: string) => {
    const socket = getSocket();
    socket.emit('send_message', { roomId, message });
  };

  const handleMessageExpire = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  return (
    <>
      {/* Cinematic Loading Screen */}
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}

      {/* Film Grain Overlay */}
      <GrainOverlay />

      {/* Dynamic Background with Color Extraction */}
      <DynamicBackground thumbnail={videoThumbnail}>
        <div className="relative min-h-screen overflow-hidden">
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

          {/* Heartbeat Aura */}
          <HeartbeatAura isPlaying={isPlaying} />

          {/* Whisper Toast Messages */}
          <WhisperToast messages={messages} onMessageExpire={handleMessageExpire} />

          {/* Content Overlay with Fade-on-Idle */}
          <motion.div
            className="relative z-30 min-h-screen flex flex-col"
            animate={{ opacity: isIdle ? 0 : 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-5">
              {/* Left: Presence */}
              <PresenceBar userCount={userCount} isConnected={isConnected} />

              {/* Center: Room ID + Slogan */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] tracking-[0.4em] uppercase text-zinc-600 font-medium">
                  {roomId}
                </span>
                <span className="text-[10px] tracking-wider text-zinc-700 mt-1">
                  हम। तुम। धुन।
                </span>
              </div>

              {/* Right: Search Button */}
              <motion.button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-4 py-2 
                           bg-white/5 backdrop-blur-sm
                           border border-white/10 rounded-full
                           text-xs text-zinc-400 hover:text-zinc-200 
                           hover:bg-white/10 hover:border-white/20 
                           transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden sm:inline font-medium">Search</span>
                <kbd className="hidden sm:inline px-1.5 py-0.5 bg-white/10 rounded text-[9px] font-mono">
                  ⌘K
                </kbd>
              </motion.button>
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
            <div className="pb-10 space-y-8">
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
          </motion.div>

          {/* Idle indicator */}
          {isIdle && (
            <motion.div
              className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-zinc-700/50 text-xs tracking-[0.3em] uppercase">
                Move to reveal
              </p>
            </motion.div>
          )}
        </div>
      </DynamicBackground>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectVideo={handleSelectVideo}
      />
    </>
  );
}
