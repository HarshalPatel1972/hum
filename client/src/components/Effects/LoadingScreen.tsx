'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isExiting, setIsExiting] = useState(false);

  const words = [
    { hindi: 'हम', english: 'Us' },
    { hindi: 'तुम', english: 'You' },
    { hindi: 'धुन', english: 'Melody' },
  ];

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Show word 1: हम at 500ms
    timers.push(setTimeout(() => setCurrentIndex(0), 500));
    
    // Show word 2: तुम at 1100ms
    timers.push(setTimeout(() => setCurrentIndex(1), 1100));
    
    // Show word 3: धुन at 1700ms
    timers.push(setTimeout(() => setCurrentIndex(2), 1700));
    
    // Start exit animation at 2500ms
    timers.push(setTimeout(() => setIsExiting(true), 2500));
    
    // Complete at 3300ms
    timers.push(setTimeout(() => onComplete(), 3300));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          className="fixed inset-0 z-[100] bg-[#09090b] flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <div className="flex items-center gap-6">
            {words.map((word, index) => (
              <motion.div
                key={word.hindi}
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={currentIndex >= index 
                  ? { opacity: 1, y: 0 } 
                  : { opacity: 0, y: 20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <span className="text-5xl md:text-7xl font-bold text-white tracking-tight">
                  {word.hindi}
                </span>
                <span className="text-xs text-zinc-600 tracking-[0.3em] uppercase mt-2">
                  {word.english}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Subtle dots separator */}
          <div className="absolute bottom-20 flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-zinc-700"
                initial={{ opacity: 0 }}
                animate={currentIndex >= i ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
