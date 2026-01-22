'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import GrainOverlay from '@/components/Effects/GrainOverlay';
import DynamicBackground from '@/components/Effects/DynamicBackground';
import HeartbeatAura from '@/components/Effects/HeartbeatAura';
import LoadingScreen from '@/components/Effects/LoadingScreen';
import NowPlaying from '@/components/UI/NowPlaying';
import ControlBar from '@/components/UI/ControlBar';
import SearchModal from '@/components/UI/SearchModal';
import WhisperInput from '@/components/UI/WhisperInput';
import WhisperToast from '@/components/UI/WhisperToast';
import VideoLayer, { VideoLayerRef } from '@/components/Player/VideoLayer';
import { getSocket, RoomState, disconnectSocket } from '@/lib/socket';
import { OnProgressProps } from 'react-player/base';
// Removed idle hook - no longer fading on idle

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
  const router = useRouter();
  const roomId = params.id as string;

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Player state
  const [videoId, setVideoId] = useState('');
  const [videoTitle, setVideoTitle] = useState('No track selected');
  const [videoChannel, setVideoChannel] = useState('Search to add music');
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isReady, setIsReady] = useState(false);
  
  // Track history for prev/next
  const [trackHistory, setTrackHistory] = useState<SearchResult[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  
  // Socket state
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(1);
  
  // UI state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Removed idle fade feature
  
  // Refs
  const playerRef = useRef<VideoLayerRef>(null);
  const isRemoteUpdate = useRef(false);
  const lastEmitTime = useRef(0);
  const pendingSync = useRef<{ time: number; playing: boolean } | null>(null);
  const syncCooldown = useRef(false);

  // Update thumbnail when video changes
  useEffect(() => {
    setVideoThumbnail(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
  }, [videoId]);

  // Keyboard shortcut for search (CMD+K / CTRL+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle browser back button for search modal
  useEffect(() => {
    const handlePopState = () => {
      if (isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSearchOpen]);

  // Open search with history state
  const openSearch = () => {
    window.history.pushState({ search: true }, '');
    setIsSearchOpen(true);
  };

  // Close search - go back in history if we pushed state
  const closeSearch = () => {
    if (isSearchOpen) {
      window.history.back();
    }
  };

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

      if (state.videoId && state.videoId !== videoId) {
        setVideoId(state.videoId);
      }
      
      if (state.title) setVideoTitle(state.title);
      if (state.channel) setVideoChannel(state.channel);

      setIsPlaying(state.isPlaying);

      // Ignore updates during cooldown
      if (syncCooldown.current) {
        console.log('[Sync] Ignoring update during cooldown');
        return;
      }

      const targetTime = state.currentSeconds || 0;
      
      // If player is ready, seek immediately
      if (playerRef.current && isReady) {
        const currentPlayerTime = playerRef.current.getCurrentTime();
        const timeDiff = Math.abs(currentPlayerTime - targetTime);

        if (timeDiff > 1.0) { // Increased threshold to 1s to be less aggressive
          console.log('[Sync] Seeking to:', targetTime);
          syncCooldown.current = true; // Set cooldown
          playerRef.current.seekTo(targetTime);
          
          // Reset cooldown after 2 seconds
          setTimeout(() => {
            syncCooldown.current = false;
          }, 2000);
        }
      } else {
        // Player not ready yet - store pending sync
        console.log('[Sync] Player not ready, storing pending sync:', targetTime);
        pendingSync.current = { time: targetTime, playing: state.isPlaying };
      }

      setTimeout(() => {
        isRemoteUpdate.current = false;
      }, 500); // Increased buffer time
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
    console.log('[handleSeek] Called with:', seconds, 'playerRef:', !!playerRef.current);
    if (playerRef.current) {
      console.log('[handleSeek] Calling seekTo...');
      playerRef.current.seekTo(seconds);
      setCurrentTime(seconds);
      emitStateUpdate(isPlaying, seconds);
    } else {
      console.log('[handleSeek] playerRef is null!');
    }
  };

  const handleProgress = (state: OnProgressProps) => {
    setCurrentTime(state.playedSeconds);
  };

  const handleDuration = (dur: number) => {
    setDuration(dur);
  };

  const handleReady = () => {
    console.log('[Player] Ready');
    setIsReady(true);
    
    // Apply pending sync if we received state before player was ready
    if (pendingSync.current && playerRef.current) {
      console.log('[Sync] Applying pending sync:', pendingSync.current);
      playerRef.current.seekTo(pendingSync.current.time);
      setIsPlaying(pendingSync.current.playing);
      pendingSync.current = null;
    }
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
      channel: result.channel,
      autoPlay: true  // Auto-play when selecting
    });
    setVideoTitle(result.title);
    setVideoChannel(result.channel);
    setVideoThumbnail(result.thumbnail);
    setIsPlaying(true);  // Auto-play locally
    
    // Add to track history
    setTrackHistory(prev => [...prev, result]);
    setCurrentTrackIndex(prev => prev + 1);
  };

  const handlePrevTrack = () => {
    if (currentTrackIndex > 0) {
      const prevTrack = trackHistory[currentTrackIndex - 1];
      if (prevTrack) {
        setCurrentTrackIndex(currentTrackIndex - 1);
        const socket = getSocket();
        socket.emit('change_video', { 
          roomId, 
          videoId: prevTrack.videoId,
          title: prevTrack.title,
          channel: prevTrack.channel,
          autoPlay: false
        });
        setVideoId(prevTrack.videoId);
        setVideoTitle(prevTrack.title);
        setVideoChannel(prevTrack.channel);
        setVideoThumbnail(prevTrack.thumbnail);
        setIsPlaying(false); // Pause on prev
      }
    }
  };

  const handleNextTrack = () => {
    // If we have more tracks in history, play next
    if (currentTrackIndex < trackHistory.length - 1) {
      const nextTrack = trackHistory[currentTrackIndex + 1];
      if (nextTrack) {
        setCurrentTrackIndex(currentTrackIndex + 1);
        const socket = getSocket();
        socket.emit('change_video', { 
          roomId, 
          videoId: nextTrack.videoId,
          title: nextTrack.title,
          channel: nextTrack.channel,
          autoPlay: true
        });
        setVideoId(nextTrack.videoId);
        setVideoTitle(nextTrack.title);
        setVideoChannel(nextTrack.channel);
        setVideoThumbnail(nextTrack.thumbnail);
        setIsPlaying(true);
      }
    } else {
      // Open search to find next song
      openSearch();
    }
  };

  const handleEnded = () => {
    console.log('[Player] Track ended, playing next...');
    handleNextTrack();
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
            volume={volume}
            onPlay={handlePlay}
            onPause={handlePause}
            onProgress={handleProgress}
            onReady={handleReady}
            onDuration={handleDuration}
            onEnded={handleEnded}
          />

          {/* Heartbeat Aura */}
          <HeartbeatAura isPlaying={isPlaying} />

          {/* Whisper Toast Messages */}
          <WhisperToast messages={messages} onMessageExpire={handleMessageExpire} />

          {/* Content Overlay with Fade-on-Idle */}
          <div
            className="relative z-30 min-h-screen flex flex-col"
          >
            {/* Top Bar */}
            <div className="flex items-start justify-between px-6 py-5">
              {/* Left: Back Button + Listener Count */}
              <div className="flex flex-col items-start gap-2">
                <motion.button
                  onClick={() => router.back()}
                  className="flex items-center justify-center w-8 h-8 rounded-full
                             bg-white/5 hover:bg-white/10 border border-white/10
                             text-zinc-400 hover:text-white transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Go back"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-zinc-600'}`} />
                  <span>{userCount} listening</span>
                </div>
              </div>

              {/* Center: Room ID + Slogan */}
              <div className="absolute left-1/2 top-5 -translate-x-1/2 flex flex-col items-center gap-1">
                <span className="text-[10px] tracking-[0.4em] uppercase text-zinc-600 font-medium">
                  {roomId}
                </span>
                <span className="text-[10px] tracking-wider text-zinc-700 mt-1">
                  हम | तुम | धुन
                </span>
              </div>

              {/* Right: Search Button */}
              <motion.button
                onClick={openSearch}
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
                onPrevTrack={handlePrevTrack}
                onNextTrack={handleNextTrack}
              />

              {/* Whisper Input */}
              <div className="flex justify-center">
                <WhisperInput onSendMessage={handleSendMessage} />
              </div>
            </div>
          </div>
        </div>
      </DynamicBackground>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        onSelectVideo={handleSelectVideo}
      />
    </>
  );
}
