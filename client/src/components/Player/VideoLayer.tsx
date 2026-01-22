'use client';

import { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import ReactPlayer from 'react-player/youtube';
import { OnProgressProps } from 'react-player/base';

export interface VideoLayerRef {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
}

interface VideoLayerProps {
  videoId: string;
  isPlaying: boolean;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onProgress: (state: OnProgressProps) => void;
  onReady: () => void;
  onDuration: (duration: number) => void;
  onEnded?: () => void;
  thumbnail?: string | null;
}

const VideoLayer = forwardRef<VideoLayerRef, VideoLayerProps>(
  ({ videoId, isPlaying, volume, onPlay, onPause, onProgress, onReady, onDuration, onEnded, thumbnail }, ref) => {
    const playerRef = useRef<ReactPlayer>(null);
    const [internalPlaying, setInternalPlaying] = useState(false);
    const wakeLockRef = useRef<any>(null);

    // IMPORTANT: useImperativeHandle must be called BEFORE any early returns!
    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        if (playerRef.current) {
          playerRef.current.seekTo(seconds, 'seconds');
        }
      },
      getCurrentTime: () => {
        return playerRef.current?.getCurrentTime() || 0;
      },
    }), []);

    // Request wake lock for mobile to prevent sleep
    useEffect(() => {
      const requestWakeLock = async () => {
        if ('wakeLock' in navigator && isPlaying) {
          try {
            wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
            console.log('[WakeLock] Screen wake lock acquired');
          } catch (err) {
            console.log('[WakeLock] Failed to acquire:', err);
          }
        }
      };

      requestWakeLock();

      return () => {
        if (wakeLockRef.current) {
          wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
      };
    }, [isPlaying]);

    // Aggressive prevention of auto-pause on mobile
    useEffect(() => {
      const preventPause = (e: Event) => {
        if (isPlaying) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return false;
        }
      };

      // Handle all possible pause triggers
      document.addEventListener('visibilitychange', preventPause, { capture: true });
      document.addEventListener('pagehide', preventPause, { capture: true });
      document.addEventListener('freeze', preventPause, { capture: true });
      window.addEventListener('blur', preventPause, { capture: true });
      
      // Mobile-specific events
      document.addEventListener('webkitvisibilitychange', preventPause, { capture: true });
      
      return () => {
        document.removeEventListener('visibilitychange', preventPause, { capture: true });
        document.removeEventListener('pagehide', preventPause, { capture: true });
        document.removeEventListener('freeze', preventPause, { capture: true });
        window.removeEventListener('blur', preventPause, { capture: true });
        document.removeEventListener('webkitvisibilitychange', preventPause, { capture: true });
      };
    }, [isPlaying]);

    // Force playing state on visibility change
    useEffect(() => {
      const handleVisibilityChange = () => {
        if (document.hidden && isPlaying && playerRef.current) {
          // Force continue playing
          const player = playerRef.current.getInternalPlayer();
          if (player && player.playVideo) {
            setTimeout(() => player.playVideo(), 100);
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isPlaying]);

    // Sync internal state
    useEffect(() => {
      setInternalPlaying(isPlaying);
    }, [isPlaying]);

    // Don't render if no video
    if (!videoId) {
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-[#09090b]" />
      );
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;

    return (
      <div className="absolute inset-0 overflow-hidden">
        {/* Blurred Thumbnail Background */}
        {thumbnail && (
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${thumbnail})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(60px) brightness(0.4)',
              transform: 'scale(1.2)',
            }}
          />
        )}

        {/* Hidden Audio Player - audio only, no visual */}
        <div className="absolute opacity-0 pointer-events-none" style={{ width: 1, height: 1 }}>
          <ReactPlayer
            ref={playerRef}
            url={url}
            playing={internalPlaying}
            controls={false}
            width="1px"
            height="1px"
            onPlay={onPlay}
            onPause={onPause}
            onProgress={onProgress}
            onReady={onReady}
            onDuration={onDuration}
            onEnded={onEnded}
            progressInterval={500}
            volume={volume}
            muted={false}
            playsinline={true}
            pip={false}
            config={{
              playerVars: {
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                playsinline: 1,
                enablejsapi: 1,
              },
            }}
          />
        </div>

        {/* Gradient Overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-[#09090b]/80" />
      </div>
    );
  }
);

VideoLayer.displayName = 'VideoLayer';

export default VideoLayer;
