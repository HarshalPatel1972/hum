'use client';

import { useState, useRef, useEffect } from 'react';

interface ControlBarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
}

export default function ControlBar({
  isPlaying,
  currentTime,
  duration,
  volume,
  onPlayPause,
  onSeek,
  onVolumeChange,
}: ControlBarProps) {
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [localTime, setLocalTime] = useState(currentTime);
  const progressRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local time with prop when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalTime(currentTime);
    }
  }, [currentTime, isDragging]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (localTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration === 0) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    setLocalTime(newTime);
    
    // Debounce the seek
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSeek(newTime);
    }, 100);
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !progressRef.current || duration === 0) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    
    setLocalTime(newTime);
  };

  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      onSeek(localTime);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-8">
      {/* Progress Bar */}
      <div 
        ref={progressRef}
        className="relative w-full mb-6 cursor-pointer group"
        onMouseEnter={() => setIsHoveringProgress(true)}
        onMouseLeave={() => {
          setIsHoveringProgress(false);
          handleDragEnd();
        }}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={handleDragEnd}
        onMouseMove={handleProgressDrag}
        onClick={handleProgressClick}
      >
        {/* Time labels */}
        <div className="flex justify-between mb-2 text-xs text-zinc-600 font-mono">
          <span>{formatTime(localTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Track */}
        <div 
          className={`w-full bg-zinc-800 rounded-full overflow-hidden transition-all duration-200 ${
            isHoveringProgress ? 'h-2' : 'h-1'
          }`}
        >
          {/* Progress fill */}
          <div 
            className="h-full bg-gradient-to-r from-zinc-500 to-zinc-400 rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            {/* Knob */}
            <div 
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 
                          w-3 h-3 bg-white rounded-full shadow-lg
                          transition-all duration-200 ${
                isHoveringProgress ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-center gap-8">
        {/* Skip Back */}
        <button 
          onClick={() => onSeek(Math.max(0, currentTime - 10))}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-2"
          aria-label="Skip back 10 seconds"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={onPlayPause}
          className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-zinc-700/50
                     flex items-center justify-center
                     hover:bg-white/20 hover:scale-105 
                     active:scale-95
                     transition-all duration-200"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Skip Forward */}
        <button 
          onClick={() => onSeek(Math.min(duration, currentTime + 10))}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-2"
          aria-label="Skip forward 10 seconds"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25l2.25-2.25m0 0l2.25-2.25M14.25 12l-2.25-2.25M14.25 12l-2.25 2.25m1.5 4.92l6.375-6.375a1.125 1.125 0 000-1.59L13.5 4.83a1.125 1.125 0 00-.796-.33H4.5A2.25 2.25 0 002.25 6.75v10.5a2.25 2.25 0 002.25 2.25h8.284c.298 0 .585-.119.796-.33z" />
          </svg>
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <svg className="w-4 h-4 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.5 5L7 9H3v6h4l4.5 4V5z" />
        </svg>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-24 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-3
                     [&::-webkit-slider-thumb]:h-3
                     [&::-webkit-slider-thumb]:bg-zinc-400
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:hover:bg-white
                     [&::-webkit-slider-thumb]:transition-colors"
        />
        <svg className="w-4 h-4 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.5 5L7 9H3v6h4l4.5 4V5zm5.5 3.5a5 5 0 010 7M19.5 6a9 9 0 010 12" strokeWidth={2} stroke="currentColor" fill="none" />
        </svg>
      </div>
    </div>
  );
}
