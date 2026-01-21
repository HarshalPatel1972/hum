'use client';

import { useEffect, useState } from 'react';

interface NowPlayingProps {
  title: string;
  artist: string;
  isPlaying: boolean;
}

export default function NowPlaying({ title, artist, isPlaying }: NowPlayingProps) {
  const [bars, setBars] = useState<number[]>([0.4, 0.7, 0.5, 0.8, 0.6]);

  // Animate waveform bars when playing
  useEffect(() => {
    if (!isPlaying) {
      setBars([0.3, 0.3, 0.3, 0.3, 0.3]);
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => 0.2 + Math.random() * 0.8));
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="flex flex-col items-center text-center px-8">
      {/* Waveform Visualizer */}
      <div className="flex items-end justify-center gap-1 h-16 mb-8">
        {bars.map((height, i) => (
          <div
            key={i}
            className="w-1 bg-gradient-to-t from-zinc-600 to-zinc-400 rounded-full transition-all duration-150 ease-out"
            style={{ 
              height: `${height * 100}%`,
              opacity: isPlaying ? 1 : 0.4
            }}
          />
        ))}
      </div>

      {/* Song Title */}
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#e4e4e7] mb-3 max-w-2xl leading-tight">
        {title}
      </h1>

      {/* Artist */}
      <p className="text-sm md:text-base font-light tracking-[0.3em] uppercase text-zinc-500">
        {artist}
      </p>

      {/* Playing indicator */}
      <div className="mt-6 flex items-center gap-2">
        <span 
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            isPlaying ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'
          }`}
        />
        <span className="text-xs tracking-widest uppercase text-zinc-600">
          {isPlaying ? 'Now Playing' : 'Paused'}
        </span>
      </div>
    </div>
  );
}
