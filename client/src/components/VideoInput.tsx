'use client';

import { useState } from 'react';

interface VideoInputProps {
  onVideoChange: (videoId: string) => void;
}

export default function VideoInput({ onVideoChange }: VideoInputProps) {
  const [url, setUrl] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const extractVideoId = (input: string): string | null => {
    // Handle full YouTube URLs
    const urlPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ];

    for (const pattern of urlPatterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractVideoId(url.trim());
    if (videoId) {
      onVideoChange(videoId);
      setUrl('');
      setIsOpen(false);
    }
  };

  return (
    <div className="mb-6">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg
                     text-zinc-400 hover:text-zinc-200 hover:border-zinc-600
                     transition-all duration-200"
        >
          Change Video
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-xl">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube URL or Video ID"
            className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg
                       text-zinc-100 placeholder-zinc-600 text-sm
                       focus:outline-none focus:border-zinc-500"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium
                       hover:bg-white transition-colors"
          >
            Load
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setUrl('');
            }}
            className="px-4 py-2 text-zinc-500 hover:text-zinc-300 text-sm"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
