'use client';

import { useMemo } from 'react';

interface PresenceBarProps {
  userCount: number;
  isConnected: boolean;
}

// Generate a deterministic color from a number
function getOrbColor(index: number): string {
  const colors = [
    'bg-emerald-400',
    'bg-sky-400', 
    'bg-violet-400',
    'bg-amber-400',
    'bg-rose-400',
    'bg-cyan-400',
    'bg-fuchsia-400',
    'bg-lime-400',
  ];
  return colors[index % colors.length];
}

export default function PresenceBar({ userCount, isConnected }: PresenceBarProps) {
  // Generate orbs for each user
  const orbs = useMemo(() => {
    const orbArray = [];
    const displayCount = Math.min(userCount, 8); // Cap at 8 orbs
    
    for (let i = 0; i < displayCount; i++) {
      orbArray.push({
        id: i,
        color: getOrbColor(i),
        delay: i * 0.2,
      });
    }
    return orbArray;
  }, [userCount]);

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-600">
        <div className="w-2 h-2 rounded-full bg-zinc-700" />
        <span>Connecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Orbs */}
      <div className="flex items-center -space-x-1">
        {orbs.map((orb) => (
          <div
            key={orb.id}
            className={`w-2.5 h-2.5 rounded-full ${orb.color} 
                       shadow-lg shadow-current/30
                       animate-pulse`}
            style={{
              animationDelay: `${orb.delay}s`,
              animationDuration: '2s',
            }}
          />
        ))}
      </div>

      {/* User count */}
      <span className="text-xs text-zinc-500 tracking-wide">
        {userCount} {userCount === 1 ? 'listener' : 'listeners'}
      </span>

      {/* Overflow indicator */}
      {userCount > 8 && (
        <span className="text-xs text-zinc-600">
          +{userCount - 8}
        </span>
      )}
    </div>
  );
}
