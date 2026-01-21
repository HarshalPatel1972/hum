'use client';

import { useState, useEffect } from 'react';

interface Message {
  id: string;
  message: string;
  senderId: string;
  timestamp: number;
}

interface WhisperToastProps {
  messages: Message[];
  onMessageExpire: (id: string) => void;
}

export default function WhisperToast({ messages, onMessageExpire }: WhisperToastProps) {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none">
      {messages.map((msg) => (
        <WhisperMessage
          key={msg.id}
          message={msg}
          onExpire={() => onMessageExpire(msg.id)}
        />
      ))}
    </div>
  );
}

interface WhisperMessageProps {
  message: Message;
  onExpire: () => void;
}

function WhisperMessage({ message, onExpire }: WhisperMessageProps) {
  const [opacity, setOpacity] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Fade in
    requestAnimationFrame(() => {
      setOpacity(1);
    });

    // Start fade out after 4 seconds
    const fadeTimer = setTimeout(() => {
      setIsLeaving(true);
      setOpacity(0);
    }, 4000);

    // Remove after 5 seconds
    const removeTimer = setTimeout(() => {
      onExpire();
    }, 5000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onExpire]);

  return (
    <div
      className={`px-4 py-2 bg-zinc-900/90 backdrop-blur-sm border border-zinc-800/50 
                  rounded-full shadow-lg transition-all duration-500 ease-out ${
        isLeaving ? 'translate-y-2' : 'translate-y-0'
      }`}
      style={{ opacity }}
    >
      <p className="text-sm text-zinc-300">
        <span className="text-zinc-500 mr-2">#{message.senderId}</span>
        {message.message}
      </p>
    </div>
  );
}
