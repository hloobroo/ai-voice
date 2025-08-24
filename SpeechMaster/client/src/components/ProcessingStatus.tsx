import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Check, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Segment {
  index: number;
  text: string;
  wordCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

interface ProcessingStatusProps {
  segments: Segment[];
  currentSegment?: number;
  className?: string;
}

export function ProcessingStatus({ segments, currentSegment = 0, className }: ProcessingStatusProps) {
  const completedCount = segments.filter(s => s.status === 'completed').length;
  const totalCount = segments.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card className={cn("theme-transition bg-light-card dark:bg-dark-card shadow-lg", className)}>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
            Processing Your Text
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Converting text to speech in segments for optimal quality
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-light-text dark:text-dark-text">
              Overall Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-progress-percentage">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-light-text dark:text-dark-text mb-3">
            Segment Processing Status
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-3">
            {segments.map((segment) => (
              <div
                key={segment.index}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg",
                  segment.status === 'completed' && "bg-gray-50 dark:bg-gray-800",
                  segment.status === 'processing' && "bg-blue-50 dark:bg-blue-900/30 border border-google-blue dark:border-dark-blue",
                  segment.status === 'failed' && "bg-red-50 dark:bg-red-900/30 border border-red-500",
                  segment.status === 'pending' && "bg-gray-50 dark:bg-gray-800 opacity-60"
                )}
                data-testid={`segment-${segment.index}`}
              >
                <div className="flex-shrink-0">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    segment.status === 'completed' && "bg-google-green dark:bg-dark-green",
                    segment.status === 'processing' && "bg-google-blue dark:bg-dark-blue",
                    segment.status === 'failed' && "bg-red-500",
                    segment.status === 'pending' && "bg-gray-300 dark:bg-gray-600"
                  )}>
                    {segment.status === 'completed' && <Check className="w-4 h-4 text-white" />}
                    {segment.status === 'processing' && <Loader2 className="w-4 h-4 text-white animate-spin" />}
                    {segment.status === 'failed' && <span className="text-white text-xs">!</span>}
                    {segment.status === 'pending' && <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="text-sm font-medium text-light-text dark:text-dark-text">
                    Segment {segment.index + 1} ({segment.wordCount} words)
                  </div>
                  <div className={cn(
                    "text-xs",
                    segment.status === 'completed' && "text-gray-600 dark:text-gray-400",
                    segment.status === 'processing' && "text-google-blue dark:text-dark-blue",
                    segment.status === 'failed' && "text-red-600 dark:text-red-400",
                    segment.status === 'pending' && "text-gray-500 dark:text-gray-400"
                  )}>
                    {segment.status === 'completed' && 'Completed'}
                    {segment.status === 'processing' && 'Processing...'}
                    {segment.status === 'failed' && (segment.error || 'Failed')}
                    {segment.status === 'pending' && 'Queued'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {currentSegment < segments.length && segments[currentSegment] && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-google-blue dark:border-dark-blue">
            <div className="text-sm font-medium text-google-blue dark:text-dark-blue mb-2">
              Currently Processing
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" data-testid="text-current-segment">
              "{segments[currentSegment].text.substring(0, 100)}..."
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
