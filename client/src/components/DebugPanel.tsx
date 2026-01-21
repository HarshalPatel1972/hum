'use client';

import { useState, useEffect } from 'react';

interface DebugPanelProps {
  serverTime: number | null;
  localTime: number;
  isPlaying: boolean;
  videoTimestamp: number;
  roomId: string;
  isConnected: boolean;
}

export default function DebugPanel({
  serverTime,
  localTime,
  isPlaying,
  videoTimestamp,
  roomId,
  isConnected,
}: DebugPanelProps) {
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    if (serverTime) {
      const calculatedLatency = Date.now() - serverTime;
      setLatency(calculatedLatency);
    }
  }, [serverTime]);

  return (
    <div className="fixed bottom-4 right-4 bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 min-w-64 font-mono text-xs">
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-zinc-400 font-semibold uppercase tracking-wider">
          Debug Panel
        </span>
      </div>

      <div className="space-y-2 text-zinc-400">
        <div className="flex justify-between">
          <span>Room ID:</span>
          <span className="text-zinc-200">{roomId}</span>
        </div>

        <div className="flex justify-between">
          <span>Connection:</span>
          <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <hr className="border-zinc-800" />

        <div className="flex justify-between">
          <span>Play State:</span>
          <span className={isPlaying ? 'text-green-400' : 'text-yellow-400'}>
            {isPlaying ? 'Playing' : 'Paused'}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Video Time:</span>
          <span className="text-zinc-200">{videoTimestamp.toFixed(2)}s</span>
        </div>

        <hr className="border-zinc-800" />

        <div className="flex justify-between">
          <span>Server Time:</span>
          <span className="text-zinc-200">
            {serverTime ? new Date(serverTime).toLocaleTimeString() : '--'}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Local Time:</span>
          <span className="text-zinc-200">
            {new Date(localTime).toLocaleTimeString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Latency:</span>
          <span
            className={
              latency !== null && latency < 100
                ? 'text-green-400'
                : latency !== null && latency < 200
                ? 'text-yellow-400'
                : 'text-red-400'
            }
          >
            {latency !== null ? `${latency}ms` : '--'}
          </span>
        </div>
      </div>
    </div>
  );
}
