'use client';

import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import ReactPlayer from 'react-player/youtube';
import { OnProgressProps } from 'react-player/base';

export interface YouTubePlayerRef {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  play: () => void;
  pause: () => void;
}

interface YouTubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onProgress: (state: OnProgressProps) => void;
  onReady: () => void;
  onSeek: (seconds: number) => void;
}

const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
  ({ videoId, isPlaying, onPlay, onPause, onProgress, onReady, onSeek }, ref) => {
    const playerRef = useRef<ReactPlayer>(null);

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        playerRef.current?.seekTo(seconds, 'seconds');
      },
      getCurrentTime: () => {
        return playerRef.current?.getCurrentTime() || 0;
      },
      play: () => {
        // ReactPlayer handles this via playing prop
      },
      pause: () => {
        // ReactPlayer handles this via playing prop
      },
    }));

    const url = `https://www.youtube.com/watch?v=${videoId}`;

    return (
      <div className="aspect-video w-full max-w-4xl rounded-xl overflow-hidden bg-zinc-900 shadow-2xl">
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
          onSeek={onSeek}
          progressInterval={100}
          config={{
            playerVars: {
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
            },
          }}
        />
      </div>
    );
  }
);

YouTubePlayer.displayName = 'YouTubePlayer';

export default YouTubePlayer;
