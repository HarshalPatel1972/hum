'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Keyboard shortcut to escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/70 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Modal */}
          <motion.div 
            className="relative w-full max-w-xl mx-4 bg-zinc-900 
                       border border-zinc-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Command 
              className="w-full"
              shouldFilter={false}
            >
              {/* Search Input */}
              <div className="flex items-center px-5 py-4 border-b border-zinc-800 bg-zinc-900">
                <svg 
                  className="w-5 h-5 text-zinc-500 mr-3 flex-shrink-0" 
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
                  className="flex-1 bg-transparent text-lg text-zinc-100 
                             placeholder-zinc-500 outline-none"
                  autoFocus
                />
                {isLoading && (
                  <div className="w-5 h-5 border-2 border-zinc-600 border-t-white 
                                  rounded-full animate-spin flex-shrink-0" />
                )}
              </div>

              {/* Results */}
              <Command.List className="max-h-80 overflow-y-auto">
                {query && results.length === 0 && !isLoading && (
                  <Command.Empty className="py-12 text-center text-zinc-500">
                    No results found for "{query}"
                  </Command.Empty>
                )}
                
                {!query && (
                  <div className="py-12 text-center text-zinc-600">
                    <p className="text-sm">Type to search for music</p>
                  </div>
                )}
                
                {results.length > 0 && (
                  <div className="p-2">
                    {results.map((result) => (
                      <Command.Item
                        key={result.videoId}
                        value={result.videoId}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center gap-4 px-3 py-3 rounded-lg cursor-pointer
                                   hover:bg-zinc-800 transition-colors group"
                      >
                        {/* Thumbnail */}
                        <img
                          src={result.thumbnail}
                          alt=""
                          className="w-16 h-12 object-cover rounded-md bg-zinc-800 flex-shrink-0"
                        />
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-200 truncate 
                                       group-hover:text-white transition-colors">
                            {result.title}
                          </p>
                          <p className="text-xs text-zinc-500 truncate mt-0.5">
                            {result.channel}
                          </p>
                        </div>

                        {/* Play indicator */}
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center
                                        opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <svg 
                            className="w-4 h-4 text-white ml-0.5"
                            fill="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </Command.Item>
                    ))}
                  </div>
                )}
              </Command.List>

              {/* Footer hint */}
              <div className="px-5 py-3 border-t border-zinc-800 flex items-center 
                              justify-between text-xs text-zinc-500 bg-zinc-900/50">
                <span>Select a track to play for everyone</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 text-[10px]">↵</kbd>
                    <span>select</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 text-[10px]">esc</kbd>
                    <span>close</span>
                  </div>
                </div>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
