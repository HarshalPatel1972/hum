'use client';

import { useRef, useImperativeHandle, forwardRef } from 'react';
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
}

const VideoLayer = forwardRef<VideoLayerRef, VideoLayerProps>(
  ({ videoId, isPlaying, volume, onPlay, onPause, onProgress, onReady, onDuration }, ref) => {
    const playerRef = useRef<ReactPlayer>(null);

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        playerRef.current?.seekTo(seconds, 'seconds');
      },
      getCurrentTime: () => {
        return playerRef.current?.getCurrentTime() || 0;
      },
    }));

    // Don't render if no video
    if (!videoId) {
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-[#09090b]" />
      );
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;

    return (
      <div className="absolute inset-0 overflow-hidden">
        {/* The Video - Cinematic Filter Layer */}
        <div className="absolute inset-0 scale-150 grayscale opacity-30 blur-sm mix-blend-overlay">
          <ReactPlayer
            ref={playerRef}
            url={url}
            playing={isPlaying}
            controls={false}
            width="100%"
            height="100%"
            onPlay={onPlay}
            onPause={onPause}
            onProgress={onProgress}
            onReady={onReady}
            onDuration={onDuration}
            progressInterval={100}
            volume={volume}
            muted={false}
            config={{
              playerVars: {
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
              },
            }}
          />
        </div>

        {/* Glass Wall - Blocks all YouTube interactions */}
        <div 
          className="absolute inset-0 z-10"
          style={{ pointerEvents: 'all' }}
          aria-hidden="true"
        />

        {/* Gradient Overlay for depth */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#09090b] via-transparent to-[#09090b]/80" />
      </div>
    );
  }
);

VideoLayer.displayName = 'VideoLayer';

export default VideoLayer;
