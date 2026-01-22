'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Simple counter approach - most reliable
    const interval = setInterval(() => {
      setStep(prev => prev + 1);
    }, 500); // Every 500ms advance a step

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // step 1 = show हम (at 500ms)
    // step 2 = show तुम (at 1000ms) 
    // step 3 = show धुन (at 1500ms)
    // step 5 = fade out (at 2500ms)
    // step 6 = complete (at 3000ms)
    if (step >= 6) {
      onComplete();
    }
  }, [step, onComplete]);

  const showWord1 = step >= 1;
  const showWord2 = step >= 2;
  const showWord3 = step >= 3;
  const fadeOut = step >= 5;

  if (fadeOut) {
    return (
      <motion.div
        className="fixed inset-0 z-[100] bg-[#09090b]"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#09090b] flex items-center justify-center">
      <div className="flex items-center gap-6">
        {/* हम */}
        <div 
          className="flex flex-col items-center transition-all duration-300"
          style={{ 
            opacity: showWord1 ? 1 : 0, 
            transform: showWord1 ? 'translateY(0)' : 'translateY(20px)' 
          }}
        >
          <span className="text-5xl md:text-7xl font-bold text-white tracking-tight">हम</span>
          <span className="text-xs text-zinc-600 tracking-[0.3em] uppercase mt-2">Us</span>
        </div>

        {/* तुम */}
        <div 
          className="flex flex-col items-center transition-all duration-300"
          style={{ 
            opacity: showWord2 ? 1 : 0, 
            transform: showWord2 ? 'translateY(0)' : 'translateY(20px)' 
          }}
        >
          <span className="text-5xl md:text-7xl font-bold text-white tracking-tight">तुम</span>
          <span className="text-xs text-zinc-600 tracking-[0.3em] uppercase mt-2">You</span>
        </div>

        {/* धुन */}
        <div 
          className="flex flex-col items-center transition-all duration-300"
          style={{ 
            opacity: showWord3 ? 1 : 0, 
            transform: showWord3 ? 'translateY(0)' : 'translateY(20px)' 
          }}
        >
          <span className="text-5xl md:text-7xl font-bold text-white tracking-tight">धुन</span>
          <span className="text-xs text-zinc-600 tracking-[0.3em] uppercase mt-2">Melody</span>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-20 flex items-center gap-2">
        <div className={`w-1 h-1 rounded-full transition-opacity duration-300 ${showWord1 ? 'bg-zinc-500' : 'bg-zinc-800'}`} />
        <div className={`w-1 h-1 rounded-full transition-opacity duration-300 ${showWord2 ? 'bg-zinc-500' : 'bg-zinc-800'}`} />
        <div className={`w-1 h-1 rounded-full transition-opacity duration-300 ${showWord3 ? 'bg-zinc-500' : 'bg-zinc-800'}`} />
      </div>
    </div>
  );
}
