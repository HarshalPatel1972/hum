'use client';

import { useState, useEffect } from 'react';
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
  onPlayPause,
  onSeek,
}: ControlBarProps) {
  const [localTime, setLocalTime] = useState(currentTime);
  const [isSeeking, setIsSeeking] = useState(false);

  // Sync local time with prop when not seeking
  useEffect(() => {
    if (!isSeeking) {
      setLocalTime(currentTime);
    }
  }, [currentTime, isSeeking]);

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setLocalTime(newTime);
    setIsSeeking(true);
  };

  const handleSeekCommit = () => {
    onSeek(localTime);
    setIsSeeking(false);
  };

  const progress = duration > 0 ? (localTime / duration) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-8">
      {/* Progress Bar */}
      <div className="relative w-full mb-8">
        {/* Time labels */}
        <div className="flex justify-between mb-3 text-xs text-zinc-500 font-mono tracking-wider">
          <span>{formatTime(localTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Seek slider container */}
        <div className="relative h-6 flex items-center">
          {/* Background track */}
          <div className="absolute left-0 right-0 h-1.5 bg-zinc-800 rounded-full" />
          
          {/* Progress fill */}
          <div 
            className="absolute left-0 h-1.5 rounded-full bg-gradient-to-r from-zinc-500 to-white pointer-events-none"
            style={{ width: `${progress}%` }}
          />
          
          {/* Native range input - most reliable for touch/click */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={localTime}
            onChange={handleSeekChange}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            style={{ WebkitAppearance: 'none' }}
          />
          
          {/* Visible thumb */}
          <div 
            className="absolute w-4 h-4 bg-white rounded-full shadow-lg pointer-events-none"
            style={{ left: `calc(${progress}% - 8px)` }}
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
    </div>
  );
}
