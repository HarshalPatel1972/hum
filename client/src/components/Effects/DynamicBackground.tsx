'use client';

import { ReactNode, useMemo } from 'react';

interface DynamicBackgroundProps {
  thumbnail: string | null;
  children: ReactNode;
}

export default function DynamicBackground({ children }: DynamicBackgroundProps) {
  // Use simple static gradient - removed expensive color extraction
  const background = useMemo(() => ({
    background: 'linear-gradient(135deg, rgb(9, 9, 11) 0%, rgb(15, 15, 20) 50%, rgb(9, 9, 11) 100%)'
  }), []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Static gradient background */}
      <div
        className="fixed inset-0 z-0"
        style={background}
      />

      {/* Subtle radial glow in center */}
      <div
        className="fixed inset-0 z-0 opacity-40"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgb(20, 20, 25) 0%, transparent 60%)'
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
