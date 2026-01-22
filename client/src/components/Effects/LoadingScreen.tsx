'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [showWord1, setShowWord1] = useState(false);
  const [showWord2, setShowWord2] = useState(false);
  const [showWord3, setShowWord3] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Word 1: हम at 500ms
    const t1 = setTimeout(() => setShowWord1(true), 500);
    
    // Word 2: तुम at 1100ms
    const t2 = setTimeout(() => setShowWord2(true), 1100);
    
    // Word 3: धुन at 1700ms
    const t3 = setTimeout(() => setShowWord3(true), 1700);
    
    // Fade out at 2500ms
    const t4 = setTimeout(() => setFadeOut(true), 2500);
    
    // Complete at 3300ms
    const t5 = setTimeout(() => onComplete(), 3300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  if (fadeOut) {
    return (
      <motion.div
        className="fixed inset-0 z-[100] bg-[#09090b]"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#09090b] flex items-center justify-center">
      <div className="flex items-center gap-6">
        {/* Word 1: हम */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={showWord1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-5xl md:text-7xl font-bold text-white tracking-tight">हम</span>
          <span className="text-xs text-zinc-600 tracking-[0.3em] uppercase mt-2">Us</span>
        </motion.div>

        {/* Word 2: तुम */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={showWord2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-5xl md:text-7xl font-bold text-white tracking-tight">तुम</span>
          <span className="text-xs text-zinc-600 tracking-[0.3em] uppercase mt-2">You</span>
        </motion.div>

        {/* Word 3: धुन */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={showWord3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-5xl md:text-7xl font-bold text-white tracking-tight">धुन</span>
          <span className="text-xs text-zinc-600 tracking-[0.3em] uppercase mt-2">Melody</span>
        </motion.div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-20 flex items-center gap-2">
        <motion.div
          className="w-1 h-1 rounded-full bg-zinc-700"
          animate={{ opacity: showWord1 ? 1 : 0 }}
        />
        <motion.div
          className="w-1 h-1 rounded-full bg-zinc-700"
          animate={{ opacity: showWord2 ? 1 : 0 }}
        />
        <motion.div
          className="w-1 h-1 rounded-full bg-zinc-700"
          animate={{ opacity: showWord3 ? 1 : 0 }}
        />
      </div>
    </div>
  );
}
