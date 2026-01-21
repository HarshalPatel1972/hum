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

  return (
    <div className="flex flex-col items-center text-center px-8 max-w-3xl">
      {/* Waveform Visualizer */}
      <div className="flex items-end justify-center gap-1.5 h-20 mb-10">
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

      {/* Animated Song Title */}
      <AnimatePresence mode="wait">
        <motion.h1
          key={title}
          className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-4 leading-[1.1]"
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {title}
        </motion.h1>
      </AnimatePresence>

      {/* Animated Artist Name */}
      <AnimatePresence mode="wait">
        <motion.p
          key={artist}
          className="text-sm md:text-base font-light tracking-[0.35em] uppercase text-zinc-400"
          initial={{ opacity: 0, y: 20, filter: 'blur(5px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, filter: 'blur(5px)' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          {artist}
        </motion.p>
      </AnimatePresence>

      {/* Playing indicator */}
      <motion.div 
        className="mt-8 flex items-center gap-3"
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
        <span className="text-xs tracking-[0.2em] uppercase text-zinc-500">
          {isPlaying ? 'Now Playing' : 'Paused'}
        </span>
      </motion.div>
    </div>
  );
}
