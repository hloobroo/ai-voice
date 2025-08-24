import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AudioPlayer as AudioPlayerComponent } from '@/components/ui/audio-player';
import { Waveform } from '@/components/ui/waveform';
import { Download, Share, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  audioUrl?: string;
  duration?: number;
  fileSize?: number;
  onDownload?: () => void;
  onShare?: () => void;
  onConvertAnother?: () => void;
  className?: string;
}

export function AudioPlayer({
  audioUrl,
  duration = 0,
  fileSize = 0,
  onDownload,
  onShare,
  onConvertAnother,
  className
}: AudioPlayerProps) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Card className={cn("theme-transition bg-light-card dark:bg-dark-card shadow-lg", className)}>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
            Your Audio is Ready!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Total duration: <span data-testid="text-duration">{formatDuration(duration)}</span> • 
            File size: <span data-testid="text-file-size">{formatFileSize(fileSize)}</span>
          </p>
        </div>

        {/* Waveform Visualization */}
        <div className="mb-6">
          <Waveform isAnimating={false} />
        </div>

        {/* Audio Player */}
        <div className="mb-6">
          <AudioPlayerComponent src={audioUrl} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={onDownload}
            className="bg-google-green dark:bg-dark-green hover:bg-green-600 dark:hover:bg-green-400 text-white font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            data-testid="button-download"
          >
            <Download className="w-4 h-4 mr-2" />
            Download MP3
          </Button>
          
          <Button
            variant="outline"
            onClick={onShare}
            className="font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            data-testid="button-share"
          >
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          
          <Button
            variant="outline"
            onClick={onConvertAnother}
            className="border-google-blue dark:border-dark-blue text-google-blue dark:text-dark-blue hover:bg-google-blue dark:hover:bg-dark-blue hover:text-white font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            data-testid="button-convert-another"
          >
            <Plus className="w-4 h-4 mr-2" />
            Convert Another
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
