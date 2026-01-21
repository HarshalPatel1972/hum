'use client';

import { ReactNode } from 'react';
import { useIdle } from '@/hooks/useIdle';

interface ImmersiveContainerProps {
  children: ReactNode;
  className?: string;
}

export default function ImmersiveContainer({ children, className = '' }: ImmersiveContainerProps) {
  const isIdle = useIdle(3000);

  return (
    <div className={`relative min-h-screen bg-[#09090b] overflow-hidden ${className}`}>
      {/* Content wrapper with fade transition */}
      <div 
        className={`relative z-30 transition-opacity duration-700 ease-in-out ${
          isIdle ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {children}
      </div>

      {/* Cursor hint when idle */}
      {isIdle && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <p className="text-zinc-700 text-sm tracking-widest uppercase animate-pulse">
            Move to reveal
          </p>
        </div>
      )}
    </div>
  );
}
