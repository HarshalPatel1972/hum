'use client';

import { useState, useEffect, useRef } from 'react';

interface ControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
}

export default function Controls({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
}: ControlsProps) {
  const [sliderValue, setSliderValue] = useState(currentTime);
  const [isDragging, setIsDragging] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update slider when currentTime changes (but not while dragging)
  useEffect(() => {
    if (!isDragging) {
      setSliderValue(currentTime);
    }
  }, [currentTime, isDragging]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSliderValue(value);

    // Debounce the seek event
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onSeek(value);
    }, 150);
  };

  const handleSliderMouseDown = () => {
    setIsDragging(true);
  };

  const handleSliderMouseUp = () => {
    setIsDragging(false);
    onSeek(sliderValue);
  };

  return (
    <div className="w-full max-w-4xl mt-6 px-4">
      {/* Seek Bar */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-zinc-500 text-sm font-mono w-12">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={sliderValue}
          onChange={handleSliderChange}
          onMouseDown={handleSliderMouseDown}
          onMouseUp={handleSliderMouseUp}
          onTouchStart={handleSliderMouseDown}
          onTouchEnd={handleSliderMouseUp}
          className="flex-1"
        />
        <span className="text-zinc-500 text-sm font-mono w-12 text-right">
          {formatTime(duration)}
        </span>
      </div>

      {/* Play/Pause Button */}
      <div className="flex justify-center">
        <button
          onClick={onPlayPause}
          className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 
                     flex items-center justify-center
                     hover:bg-zinc-700 hover:border-zinc-600 transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-zinc-500"
        >
          {isPlaying ? (
            // Pause Icon
            <svg
              className="w-6 h-6 text-zinc-100"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            // Play Icon
            <svg
              className="w-6 h-6 text-zinc-100 ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
