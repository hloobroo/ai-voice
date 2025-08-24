import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface Conversion {
  id: string;
  text: string;
  voice: string;
  duration?: number;
  fileSize?: number;
  createdAt?: Date;
  audioPath?: string;
}

interface ConversionHistoryProps {
  className?: string;
}

export function ConversionHistory({ className }: ConversionHistoryProps) {
  const { data: conversions = [], isLoading } = useQuery<Conversion[]>({
    queryKey: ['/api/conversions'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const formatDuration = (seconds: number = 0) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (date: Date | string | undefined) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Less than an hour ago';
    }
  };

  const getTitle = (text: string) => {
    const words = text.split(' ').slice(0, 6).join(' ');
    return words.length < text.length ? `${words}...` : words;
  };

  const voiceLabels: Record<string, string> = {
    alloy: 'Alloy voice',
    echo: 'Echo voice',
    fable: 'Fable voice',
    onyx: 'Onyx voice',
    nova: 'Nova voice',
    shimmer: 'Shimmer voice',
  };

  const handleDownload = (conversion: Conversion) => {
    if (conversion.audioPath) {
      window.open(`/api/audio/${conversion.id}.mp3`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("theme-transition bg-light-card dark:bg-dark-card shadow-lg", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("theme-transition bg-light-card dark:bg-dark-card shadow-lg", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
            Recent Conversions
          </h3>
          <Button variant="link" className="text-google-blue dark:text-dark-blue p-0">
            View All
          </Button>
        </div>
        
        <div className="space-y-3" data-testid="conversion-history-list">
          {conversions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No conversions yet. Create your first text-to-speech conversion above!
              </p>
            </div>
          ) : (
            conversions.slice(0, 3).map((conversion, index) => (
              <div
                key={conversion.id}
                className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 theme-transition cursor-pointer"
                data-testid={`conversion-item-${index}`}
              >
                <div className="flex-shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    index === 0 && "bg-google-blue dark:bg-dark-blue",
                    index === 1 && "bg-google-green dark:bg-dark-green",
                    index === 2 && "bg-google-red dark:bg-dark-red"
                  )}>
                    <Play className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-light-text dark:text-dark-text truncate">
                    {getTitle(conversion.text)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <span>{formatTimeAgo(conversion.createdAt)}</span> • 
                    <span className="ml-1">{formatDuration(conversion.duration)}</span> • 
                    <span className="ml-1">{voiceLabels[conversion.voice] || 'Unknown voice'}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-google-blue dark:text-dark-blue hover:text-blue-600 dark:hover:text-blue-400 p-1"
                    data-testid={`button-play-${index}`}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(conversion)}
                    className="text-gray-500 dark:text-gray-400 hover:text-google-green dark:hover:text-dark-green p-1"
                    data-testid={`button-download-${index}`}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
