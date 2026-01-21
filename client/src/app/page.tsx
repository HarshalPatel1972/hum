'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.push(`/room/${roomId.trim()}`);
    }
  };

  const generateRandomRoom = () => {
    const randomId = Math.random().toString(36).substring(2, 8);
    setRoomId(randomId);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Logo */}
      <div className="mb-12 text-center">
        <h1 className="text-6xl font-bold tracking-tight mb-2">
          <span className="bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-200 bg-clip-text text-transparent">
            HUM
          </span>
        </h1>
        <p className="text-zinc-500 text-lg">Listen together, in sync.</p>
      </div>

      {/* Join Form */}
      <form onSubmit={handleJoin} className="w-full max-w-md space-y-4">
        <div className="relative">
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID"
            className="w-full px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-xl 
                       text-zinc-100 placeholder-zinc-600 text-lg
                       focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600
                       transition-all duration-200"
          />
        </div>

        <button
          type="submit"
          disabled={!roomId.trim()}
          className="w-full px-6 py-4 bg-zinc-100 text-zinc-900 rounded-xl font-semibold text-lg
                     hover:bg-white transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
        >
          Join Room
        </button>

        <button
          type="button"
          onClick={generateRandomRoom}
          className="w-full px-6 py-3 bg-transparent border border-zinc-800 text-zinc-400 rounded-xl
                     hover:border-zinc-600 hover:text-zinc-300 transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          Generate Random Room
        </button>
      </form>

      {/* Footer */}
      <footer className="mt-16 text-zinc-600 text-sm">
        Phase 1: The Sync Engine
      </footer>
    </main>
  );
}
