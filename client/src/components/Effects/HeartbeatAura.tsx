'use client';

import { motion } from 'framer-motion';

interface HeartbeatAuraProps {
  isPlaying: boolean;
  color?: string;
}

export default function HeartbeatAura({ isPlaying, color = 'rgba(255, 255, 255, 0.03)' }: HeartbeatAuraProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      {/* Primary aura */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
        animate={isPlaying ? {
          scale: [1, 1.15, 1.05, 1.2, 1],
          opacity: [0.3, 0.5, 0.4, 0.6, 0.3],
        } : {
          scale: 0.8,
          opacity: 0.1,
        }}
        transition={isPlaying ? {
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        } : {
          duration: 1,
          ease: 'easeOut',
        }}
      />

      {/* Secondary smaller aura */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
          filter: 'blur(40px)',
        }}
        animate={isPlaying ? {
          scale: [1.1, 1, 1.2, 1.05, 1.1],
          opacity: [0.4, 0.3, 0.5, 0.35, 0.4],
        } : {
          scale: 0.7,
          opacity: 0.05,
        }}
        transition={isPlaying ? {
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        } : {
          duration: 1,
          ease: 'easeOut',
        }}
      />
    </div>
  );
}
