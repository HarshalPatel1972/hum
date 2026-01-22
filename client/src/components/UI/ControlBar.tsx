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
  onPrevTrack?: () => void;
  onNextTrack?: () => void;
}

export default function ControlBar({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  onPrevTrack,
  onNextTrack,
}: ControlBarProps) {
  const [sliderValue, setSliderValue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Sync slider with actual time when not dragging
  useEffect(() => {
    if (!isDragging && duration > 0) {
      setSliderValue((currentTime / duration) * 100);
    }
  }, [currentTime, duration, isDragging]);

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value);
    setSliderValue(percent);
    setIsDragging(true);
  };

  const handleSliderRelease = () => {
    if (duration > 0) {
      const newTime = (sliderValue / 100) * duration;
      onSeek(newTime);
    }
    setIsDragging(false);
  };

  const displayTime = isDragging ? (sliderValue / 100) * duration : currentTime;

  return (
    <div className="w-full max-w-2xl mx-auto px-8">
      {/* Progress Bar with Glass Effect */}
      <div className="relative w-full mb-8">
        {/* Time labels */}
        <div className="flex justify-between mb-3 text-xs text-zinc-500 font-mono tracking-wider">
          <motion.span
            key={Math.floor(displayTime)}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {formatTime(displayTime)}
          </motion.span>
          <span className="text-zinc-600">{formatTime(duration)}</span>
        </div>

        {/* Slider container with glassmorphism */}
        <div className="relative h-10 flex items-center group">
          {/* Glow effect on hover */}
          <motion.div
            className="absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-30"
            style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.3))' }}
            animate={{ opacity: isDragging ? 0.5 : 0 }}
          />
          
          {/* Background track */}
          <div className="absolute left-0 right-0 h-2 bg-zinc-800/50 backdrop-blur-sm rounded-full" />
          
          {/* Progress fill with gradient */}
          <motion.div 
            className="absolute left-0 h-2 rounded-full"
            style={{ 
              width: `${sliderValue}%`,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.8))',
            }}
            animate={{ scaleY: isDragging ? 1.2 : 1 }}
          />
          
          {/* Animated thumb */}
          <motion.div 
            className="absolute w-5 h-5 rounded-full shadow-lg border-2 border-zinc-900 pointer-events-none"
            style={{ 
              left: `calc(${sliderValue}% - 10px)`,
              background: 'radial-gradient(circle, rgba(255,255,255,1), rgba(255,255,255,0.8))',
            }}
            animate={{ 
              scale: isDragging ? 1.3 : 1,
              boxShadow: isDragging 
                ? '0 0 20px rgba(255,255,255,0.5)' 
                : '0 4px 12px rgba(0,0,0,0.4)'
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
          
          {/* Actual range input */}
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={sliderValue}
            onChange={handleSliderChange}
            onMouseUp={handleSliderRelease}
            onTouchEnd={handleSliderRelease}
            onBlur={handleSliderRelease}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>
      </div>

      {/* Controls Row with Glass Morphism */}
      <div className="flex items-center justify-center gap-4">
        {/* Previous Track */}
        <motion.button 
          onClick={onPrevTrack}
          className="w-10 h-10 rounded-full flex items-center justify-center
                     bg-white/5 backdrop-blur-md border border-white/10
                     text-zinc-400 hover:text-white hover:bg-white/10
                     transition-all"
          whileHover={{ scale: 1.1, borderColor: 'rgba(255,255,255,0.2)' }}
          whileTap={{ scale: 0.95 }}
          aria-label="Previous track"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </motion.button>

        {/* Skip Back 10s */}
        <motion.button 
          onClick={() => onSeek(Math.max(0, currentTime - 10))}
          className="w-9 h-9 rounded-full flex items-center justify-center
                     bg-white/5 backdrop-blur-md border border-white/10
                     text-zinc-500 hover:text-zinc-300 hover:bg-white/10
                     transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Skip back 10 seconds"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953L9.567 7.71a1.125 1.125 0 011.683.977v8.123z" />
          </svg>
        </motion.button>

        {/* Play/Pause - Premium Glass Button */}
        <motion.button
          onClick={onPlayPause}
          className="w-20 h-20 rounded-full flex items-center justify-center relative group"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
          whileHover={{ 
            scale: 1.08,
            boxShadow: '0 0 40px rgba(255,255,255,0.2), inset 0 0 20px rgba(255,255,255,0.1)'
          }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: isPlaying 
              ? '0 0 30px rgba(255,255,255,0.15)' 
              : '0 8px 20px rgba(0,0,0,0.3)'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Glow ring when playing */}
          {isPlaying && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: '2px solid rgba(255,255,255,0.3)' }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          
          {/* Icon */}
          {isPlaying ? (
            <motion.svg 
              className="w-7 h-7 text-white" 
              fill="currentColor" 
              viewBox="0 0 24 24"
              initial={{ rotate: 0 }}
              animate={{ rotate: 0 }}
            >
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </motion.svg>
          ) : (
            <motion.svg 
              className="w-7 h-7 text-white ml-1" 
              fill="currentColor" 
              viewBox="0 0 24 24"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <path d="M8 5v14l11-7z" />
            </motion.svg>
          )}
        </motion.button>

        {/* Skip Forward 10s */}
        <motion.button 
          onClick={() => onSeek(Math.min(duration, currentTime + 10))}
          className="w-9 h-9 rounded-full flex items-center justify-center
                     bg-white/5 backdrop-blur-md border border-white/10
                     text-zinc-500 hover:text-zinc-300 hover:bg-white/10
                     transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Skip forward 10 seconds"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
          </svg>
        </motion.button>

        {/* Next Track */}
        <motion.button 
          onClick={onNextTrack}
          className="w-10 h-10 rounded-full flex items-center justify-center
                     bg-white/5 backdrop-blur-md border border-white/10
                     text-zinc-400 hover:text-white hover:bg-white/10
                     transition-all"
          whileHover={{ scale: 1.1, borderColor: 'rgba(255,255,255,0.2)' }}
          whileTap={{ scale: 0.95 }}
          aria-label="Next track"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
