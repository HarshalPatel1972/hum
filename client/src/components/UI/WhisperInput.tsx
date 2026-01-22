'use client';

import { useState, useRef, useEffect } from 'react';
import { getSessionUsername } from '@/lib/username-generator';

interface WhisperInputProps {
  onSendMessage: (message: string) => void;
}

export default function WhisperInput({ onSendMessage }: WhisperInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [username, setUsername] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUsername(getSessionUsername());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={`transition-all duration-300 ${
        isFocused ? 'w-64' : 'w-40'
      }`}
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Whisper..."
          maxLength={100}
          className="w-full px-4 py-2 bg-zinc-900/80 backdrop-blur-sm 
                     border border-zinc-800/50 rounded-full
                     text-sm text-zinc-300 placeholder-zinc-600
                     focus:outline-none focus:border-zinc-700
                     transition-all duration-200"
        />
        
        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim()}
          className={`absolute right-1 top-1/2 -translate-y-1/2 
                      w-7 h-7 rounded-full flex items-center justify-center
                      transition-all duration-200 ${
            message.trim() 
              ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' 
              : 'bg-transparent text-zinc-700'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </form>
  );
}
