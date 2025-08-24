import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src?: string;
  className?: string;
}

export function AudioPlayer({ src, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnd = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const seekTime = (value[0] / 100) * duration;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn("space-y-4", className)}>
      {src && (
        <audio ref={audioRef} src={src} preload="metadata" />
      )}
      
      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-full"
          data-testid="button-skip-back"
        >
          <SkipBack className="w-4 h-4" />
        </Button>
        
        <Button
          size="icon"
          className="w-16 h-16 rounded-full bg-google-blue dark:bg-dark-blue hover:bg-blue-600 dark:hover:bg-blue-400"
          onClick={togglePlay}
          disabled={!src}
          data-testid="button-play-pause"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-1" />
          )}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-full"
          data-testid="button-skip-forward"
        >
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <span data-testid="text-current-time">{formatTime(currentTime)}</span>
          <span data-testid="text-total-time">{formatTime(duration)}</span>
        </div>
        <Slider
          value={[progress]}
          onValueChange={handleSeek}
          max={100}
          step={1}
          className="w-full"
          data-testid="slider-progress"
        />
      </div>
    </div>
  );
}
