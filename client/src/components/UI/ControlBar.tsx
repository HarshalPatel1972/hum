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
  const [isDragging, setIsDragging] = useState(false);
  const [localTime, setLocalTime] = useState(currentTime);
  const progressRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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
        className="relative w-full mb-8 cursor-pointer group"
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
        <div className="flex justify-between mb-3 text-xs text-zinc-500 font-mono tracking-wider">
          <span>{formatTime(localTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Track */}
        <motion.div 
          className="w-full bg-zinc-800/50 rounded-full overflow-hidden backdrop-blur-sm"
          animate={{ height: isHoveringProgress ? 8 : 3 }}
          transition={{ duration: 0.2 }}
        >
          {/* Progress fill */}
          <motion.div 
            className="h-full rounded-full relative"
            style={{ 
              width: `${progress}%`,
              background: 'linear-gradient(90deg, rgba(161, 161, 170, 0.6) 0%, rgba(250, 250, 250, 0.9) 100%)'
            }}
          >
            {/* Knob */}
            <motion.div 
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 
                          w-4 h-4 bg-white rounded-full shadow-lg shadow-white/20"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: isHoveringProgress ? 1 : 0,
                scale: isHoveringProgress ? 1 : 0,
              }}
              transition={{ duration: 0.15 }}
            />
          </motion.div>
        </motion.div>
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
          <motion.div
            animate={{ rotate: isPlaying ? 0 : 0 }}
            transition={{ duration: 0.3 }}
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
          </motion.div>
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
        <motion.svg 
          className="w-4 h-4 text-zinc-600" 
          fill="currentColor" 
          viewBox="0 0 24 24"
          whileHover={{ scale: 1.1 }}
        >
          <path d="M11.5 5L7 9H3v6h4l4.5 4V5z" />
        </motion.svg>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-24 accent-white"
        />
        <motion.svg 
          className="w-4 h-4 text-zinc-600" 
          fill="none" 
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          whileHover={{ scale: 1.1 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 5L7 9H3v6h4l4.5 4V5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5a4 4 0 010 7M18 6a7 7 0 010 12" />
        </motion.svg>
      </div>
    </div>
  );
}
