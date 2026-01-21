'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Command } from 'cmdk';

interface SearchResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: (video: SearchResult) => void;
}

export default function SearchModal({ isOpen, onClose, onSelectVideo }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  const searchVideos = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.results) {
        setResults(data.results);
      }
    } catch (error) {
      console.error('[Search] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (value: string) => {
    setQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchVideos(value);
    }, 300);
  };

  // Handle selection
  const handleSelect = (result: SearchResult) => {
    onSelectVideo(result);
    setQuery('');
    setResults([]);
    onClose();
  };

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Trigger open from parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-xl mx-4 bg-zinc-900/90 backdrop-blur-xl 
                   border border-zinc-800/50 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command 
          className="w-full"
          shouldFilter={false}
        >
          {/* Search Input */}
          <div className="flex items-center px-4 border-b border-zinc-800/50">
            <svg 
              className="w-5 h-5 text-zinc-500 mr-3" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
            <Command.Input
              value={query}
              onValueChange={handleInputChange}
              placeholder="Search for music..."
              className="flex-1 py-4 bg-transparent text-lg text-zinc-100 
                         placeholder-zinc-600 outline-none"
              autoFocus
            />
            {isLoading && (
              <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-400 
                              rounded-full animate-spin" />
            )}
          </div>

          {/* Results */}
          <Command.List className="max-h-80 overflow-y-auto p-2">
            {query && results.length === 0 && !isLoading && (
              <Command.Empty className="py-8 text-center text-zinc-600">
                No results found
              </Command.Empty>
            )}
            
            {results.map((result) => (
              <Command.Item
                key={result.videoId}
                value={result.videoId}
                onSelect={() => handleSelect(result)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                           hover:bg-zinc-800/70 transition-colors group"
              >
                {/* Thumbnail */}
                <img
                  src={result.thumbnail}
                  alt=""
                  className="w-14 h-10 object-cover rounded bg-zinc-800"
                />
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate 
                               group-hover:text-white transition-colors">
                    {result.title}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {result.channel}
                  </p>
                </div>

                {/* Play indicator */}
                <svg 
                  className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 
                             opacity-0 group-hover:opacity-100 transition-all"
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </Command.Item>
            ))}
          </Command.List>

          {/* Footer hint */}
          <div className="px-4 py-3 border-t border-zinc-800/50 flex items-center 
                          justify-between text-xs text-zinc-600">
            <span>Select a track to play for everyone</span>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500">↵</kbd>
              <span>to select</span>
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500 ml-2">esc</kbd>
              <span>to close</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
