'use client';

import { useEffect, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DynamicBackgroundProps {
  thumbnail: string | null;
  children: ReactNode;
}

// Extract dominant color from image using canvas
async function extractColor(imageUrl: string): Promise<[number, number, number]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve([9, 9, 11]); // Default dark
        return;
      }

      // Sample small area for performance
      canvas.width = 50;
      canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);

      const imageData = ctx.getImageData(0, 0, 50, 50).data;
      let r = 0, g = 0, b = 0, count = 0;

      for (let i = 0; i < imageData.length; i += 4) {
        // Skip very dark pixels
        if (imageData[i] + imageData[i + 1] + imageData[i + 2] > 30) {
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
          count++;
        }
      }

      if (count === 0) {
        resolve([9, 9, 11]);
        return;
      }

      resolve([
        Math.round(r / count),
        Math.round(g / count),
        Math.round(b / count)
      ]);
    };

    img.onerror = () => {
      resolve([9, 9, 11]);
    };

    img.src = imageUrl;
  });
}

// Darken color by mixing with black
function darkenColor(rgb: [number, number, number], amount: number = 0.85): string {
  const [r, g, b] = rgb;
  const darkened = [
    Math.round(r * (1 - amount)),
    Math.round(g * (1 - amount)),
    Math.round(b * (1 - amount))
  ];
  return `rgb(${darkened[0]}, ${darkened[1]}, ${darkened[2]})`;
}

export default function DynamicBackground({ thumbnail, children }: DynamicBackgroundProps) {
  const [primaryColor, setPrimaryColor] = useState('rgb(9, 9, 11)');
  const [secondaryColor, setSecondaryColor] = useState('rgb(15, 15, 20)');

  useEffect(() => {
    if (!thumbnail) return;

    extractColor(thumbnail).then((color) => {
      setPrimaryColor(darkenColor(color, 0.88));
      // Slightly different secondary
      const secondary: [number, number, number] = [
        Math.min(255, color[0] + 20),
        Math.min(255, color[1] + 10),
        Math.min(255, color[2] + 30)
      ];
      setSecondaryColor(darkenColor(secondary, 0.92));
    });
  }, [thumbnail]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated gradient background */}
      <motion.div
        className="fixed inset-0 z-0"
        animate={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, rgb(9, 9, 11) 100%)`
        }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />

      {/* Radial glow in center */}
      <motion.div
        className="fixed inset-0 z-0"
        animate={{
          background: `radial-gradient(circle at 50% 40%, ${primaryColor} 0%, transparent 60%)`
        }}
        transition={{ duration: 2, ease: 'easeInOut' }}
        style={{ opacity: 0.4 }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
