import React from 'react';
import { cn } from '@/lib/utils';

interface WaveformProps {
  isAnimating?: boolean;
  className?: string;
}

export function Waveform({ isAnimating = false, className }: WaveformProps) {
  const bars = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    height: Math.random() * 60 + 20, // Random height between 20-80
    delay: i * 0.1,
  }));

  return (
    <div className={cn(
      "flex items-end justify-center space-x-1 h-20 bg-gray-50 dark:bg-gray-800 rounded-lg p-4",
      className
    )}>
      {bars.map((bar) => (
        <div
          key={bar.id}
          className={cn(
            "bg-google-blue dark:bg-dark-blue w-1 rounded-full transition-all duration-300",
            isAnimating && "animate-pulse"
          )}
          style={{
            height: `${bar.height}%`,
            animationDelay: `${bar.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
