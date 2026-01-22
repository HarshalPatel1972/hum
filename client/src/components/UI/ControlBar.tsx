'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

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
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(currentTime);
  const progressRef = useRef<HTMLDivElement>(null);

  // Update seek time from props when not seeking
  useEffect(() => {
    if (!isSeeking) {
      setSeekTime(currentTime);
    }
  }, [currentTime, isSeeking]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (seekTime / duration) * 100 : 0;

  // Calculate time from position
  const getTimeFromPosition = (clientX: number): number => {
    if (!progressRef.current || duration === 0) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return percent * duration;
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSeeking(true);
    const time = getTimeFromPosition(e.clientX);
    setSeekTime(time);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSeeking) return;
    const time = getTimeFromPosition(e.clientX);
    setSeekTime(time);
  };

  const handleMouseUp = () => {
    if (isSeeking) {
      onSeek(seekTime);
      setIsSeeking(false);
    }
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsSeeking(true);
    const touch = e.touches[0];
    const time = getTimeFromPosition(touch.clientX);
    setSeekTime(time);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSeeking) return;
    const touch = e.touches[0];
    const time = getTimeFromPosition(touch.clientX);
    setSeekTime(time);
  };

  const handleTouchEnd = () => {
    if (isSeeking) {
      onSeek(seekTime);
      setIsSeeking(false);
    }
  };

  // Click to seek
  const handleClick = (e: React.MouseEvent) => {
    const time = getTimeFromPosition(e.clientX);
    setSeekTime(time);
    onSeek(time);
  };

  return (
    <div 
      className="w-full max-w-2xl mx-auto px-8"
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isSeeking) {
          onSeek(seekTime);
          setIsSeeking(false);
        }
      }}
    >
      {/* Progress Bar */}
      <div 
        ref={progressRef}
        className="relative w-full mb-8 cursor-pointer group touch-none"
        onMouseEnter={() => setIsHoveringProgress(true)}
        onMouseLeave={() => setIsHoveringProgress(false)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Time labels */}
        <div className="flex justify-between mb-3 text-xs text-zinc-500 font-mono tracking-wider">
          <span>{formatTime(seekTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Track */}
        <div 
          className="relative w-full h-6 flex items-center"
        >
          {/* Background track */}
          <div className="absolute left-0 right-0 h-1.5 bg-zinc-800 rounded-full" />
          
          {/* Progress fill */}
          <div 
            className="absolute left-0 h-1.5 rounded-full bg-gradient-to-r from-zinc-500 to-white"
            style={{ width: `${progress}%` }}
          />
          
          {/* Knob */}
          <motion.div 
            className="absolute w-4 h-4 bg-white rounded-full shadow-lg"
            style={{ left: `calc(${progress}% - 8px)` }}
            animate={{ 
              scale: isHoveringProgress || isSeeking ? 1 : 0.7,
              opacity: isHoveringProgress || isSeeking ? 1 : 0.5
            }}
            transition={{ duration: 0.15 }}
          />
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-center gap-6">
        {/* Skip Back */}
        <motion.button 
          onClick={() => onSeek(Math.max(0, currentTime - 10))}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-3"
          aria-label="Skip back 10 seconds"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953L9.567 7.71a1.125 1.125 0 011.683.977v8.123z" />
          </svg>
        </motion.button>

        {/* Play/Pause */}
        <motion.button
          onClick={onPlayPause}
          className="w-16 h-16 rounded-full flex items-center justify-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          whileHover={{ scale: 1.08, boxShadow: '0 0 30px rgba(255,255,255,0.15)' }}
          whileTap={{ scale: 0.95 }}
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
        </motion.button>

        {/* Skip Forward */}
        <motion.button 
          onClick={() => onSeek(Math.min(duration, currentTime + 10))}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-3"
          aria-label="Skip forward 10 seconds"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
          </svg>
        </motion.button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center justify-center gap-3 mt-8">
        <svg className="w-4 h-4 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.5 5L7 9H3v6h4l4.5 4V5z" />
        </svg>
        <div className="relative w-24 h-6 flex items-center">
          {/* Track background */}
          <div className="absolute left-0 right-0 h-1 bg-zinc-700 rounded-full" />
          {/* Filled track */}
          <div 
            className="absolute left-0 h-1 bg-zinc-400 rounded-full" 
            style={{ width: `${volume * 100}%` }}
          />
          {/* Actual slider input */}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
          {/* Thumb indicator */}
          <div 
            className="absolute w-3 h-3 bg-white rounded-full shadow-md pointer-events-none"
            style={{ left: `calc(${volume * 100}% - 6px)` }}
          />
        </div>
        <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 5L7 9H3v6h4l4.5 4V5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5a4 4 0 010 7M18 6a7 7 0 010 12" />
        </svg>
      </div>
    </div>
  );
}
