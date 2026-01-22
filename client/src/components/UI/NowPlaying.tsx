'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NowPlayingProps {
  title: string;
  artist: string;
  isPlaying: boolean;
}

export default function NowPlaying({ title, artist, isPlaying }: NowPlayingProps) {
  const [bars, setBars] = useState<number[]>([0.4, 0.7, 0.5, 0.8, 0.6, 0.5, 0.7]);

  // Animate waveform bars when playing
  useEffect(() => {
    if (!isPlaying) {
      setBars([0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2]);
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => 0.15 + Math.random() * 0.85));
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Truncate long titles
  const displayTitle = title.length > 50 ? title.substring(0, 47) + '...' : title;
  const displayArtist = artist.length > 40 ? artist.substring(0, 37) + '...' : artist;

  return (
    <div className="flex flex-col items-center text-center px-4 w-full max-w-2xl">
      {/* Waveform Visualizer */}
      <div className="flex items-end justify-center gap-1.5 h-16 mb-8">
        {bars.map((height, i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full"
            style={{
              background: 'linear-gradient(to top, rgba(161, 161, 170, 0.4), rgba(250, 250, 250, 0.8))',
            }}
            animate={{
              height: `${height * 100}%`,
              opacity: isPlaying ? 1 : 0.3,
            }}
            transition={{
              duration: 0.15,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* Fixed height container for title - prevents layout shift */}
      <div className="h-16 md:h-20 flex items-center justify-center overflow-hidden w-full">
        <AnimatePresence mode="wait">
          <motion.h1
            key={title}
            className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight text-center line-clamp-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {displayTitle}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* Fixed height container for artist */}
      <div className="h-6 flex items-center justify-center mt-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={artist}
            className="text-xs md:text-sm font-light tracking-[0.25em] uppercase text-zinc-400 truncate max-w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {displayArtist}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Playing indicator */}
      <motion.div 
        className="mt-6 flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.span
          className="w-2 h-2 rounded-full"
          animate={{
            backgroundColor: isPlaying ? '#22c55e' : '#52525b',
            scale: isPlaying ? [1, 1.2, 1] : 1,
          }}
          transition={{
            backgroundColor: { duration: 0.3 },
            scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
        <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">
          {isPlaying ? 'Now Playing' : 'Paused'}
        </span>
      </motion.div>
    </div>
  );
}
