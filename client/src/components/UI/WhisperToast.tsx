'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [queue, setQueue] = useState<Message[]>([]);

  // Manage message queue - show one at a time
  useEffect(() => {
    if (messages.length > 0) {
      setQueue(prev => {
        const newMessages = messages.filter(msg => 
          !prev.some(p => p.id === msg.id) && 
          (!currentMessage || currentMessage.id !== msg.id)
        );
        return [...prev, ...newMessages];
      });
    }
  }, [messages, currentMessage]);

  // Display next message from queue
  useEffect(() => {
    if (!currentMessage && queue.length > 0) {
      const [nextMessage, ...rest] = queue;
      setCurrentMessage(nextMessage);
      setQueue(rest);

      // Auto-expire after 4 seconds
      const timer = setTimeout(() => {
        onMessageExpire(nextMessage.id);
        setCurrentMessage(null);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [currentMessage, queue, onMessageExpire]);

  return (
    <div className="fixed top-[45vh] left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <AnimatePresence>
        {currentMessage && (
          <motion.div
            key={currentMessage.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="px-5 py-3 bg-zinc-900/95 backdrop-blur-md border border-zinc-800/70 
                       rounded-full shadow-2xl"
          >
            <p className="text-sm text-zinc-300">
              <span className="text-zinc-500 mr-2 font-medium">#{currentMessage.senderId}</span>
              {currentMessage.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
