import { useState, useEffect } from 'react';
import { TTSConverter } from '@/components/TTSConverter';
import { ProcessingStatus } from '@/components/ProcessingStatus';
import { AudioPlayer } from '@/components/AudioPlayer';
import { ConversionHistory } from '@/components/ConversionHistory';
import { ChatInterface } from '@/components/ChatInterface';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import type { Conversion } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Volume2, Sun, Moon, Infinity, Mic, Zap } from 'lucide-react';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [currentConversionId, setCurrentConversionId] = useState<string | null>(null);
  const [showProcessing, setShowProcessing] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  // Poll for conversion status
  const { data: conversionData, isLoading } = useQuery<Conversion>({
    queryKey: ['/api/conversions', currentConversionId],
    enabled: !!currentConversionId,
    refetchInterval: currentConversionId && !showAudioPlayer ? 2000 : false,
  });

  useEffect(() => {
    if (conversionData) {
      if (conversionData.status === 'processing' && !showProcessing) {
        setShowProcessing(true);
        setShowAudioPlayer(false);
      } else if (conversionData.status === 'completed') {
        setShowProcessing(false);
        setShowAudioPlayer(true);
        toast({
          title: "Conversion Complete!",
          description: "Your audio file is ready for download and playback.",
        });
      } else if (conversionData.status === 'failed') {
        setShowProcessing(false);
        setCurrentConversionId(null);
        toast({
          title: "Conversion Failed",
          description: "There was an error processing your text. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [conversionData, showProcessing, toast]);

  const handleConversionStart = (conversionId: string) => {
    setCurrentConversionId(conversionId);
    setShowProcessing(true);
    setShowAudioPlayer(false);
  };

  const handleDownload = () => {
    if (currentConversionId) {
      window.open(`/api/audio/${currentConversionId}.mp3`, '_blank');
    }
  };

  const handleShare = () => {
    if (currentConversionId && conversionData?.audioPath) {
      const url = `${window.location.origin}${conversionData.audioPath}`;
      if (navigator.share) {
        navigator.share({
          title: 'AI Generated Audio',
          url: url,
        });
      } else {
        navigator.clipboard.writeText(url);
        toast({
          title: "Link Copied",
          description: "Audio link copied to clipboard.",
        });
      }
    }
  };

  const handleConvertAnother = () => {
    setCurrentConversionId(null);
    setShowProcessing(false);
    setShowAudioPlayer(false);
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg theme-transition">
      {/* Header */}
      <header className="theme-transition bg-light-card dark:bg-dark-card shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-google-blue dark:bg-dark-blue rounded-lg flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-light-text dark:text-dark-text">
                AI Text-to-Speech
              </h1>
            </div>
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="relative h-8 w-14 rounded-full p-0 focus:ring-2 focus:ring-google-blue dark:focus:ring-dark-blue"
              data-testid="button-theme-toggle"
            >
              <div className={`absolute inset-0 rounded-full bg-gray-300 dark:bg-gray-600 theme-transition`}>
                <div className={`absolute top-1 h-6 w-6 rounded-full bg-white theme-transition transform ${
                  theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                }`}>
                  {theme === 'light' ? (
                    <Sun className="w-4 h-4 text-google-yellow absolute top-0.5 left-0.5" />
                  ) : (
                    <Moon className="w-4 h-4 text-gray-400 absolute top-0.5 left-0.5" />
                  )}
                </div>
              </div>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Text Input Section */}
        <TTSConverter onConversionStart={handleConversionStart} />

        {/* Processing Section */}
        {showProcessing && conversionData?.segments && Array.isArray(conversionData.segments) && (
          <ProcessingStatus
            segments={conversionData.segments as any[]}
            currentSegment={(conversionData.segments as any[]).findIndex((s: any) => s.status === 'processing')}
          />
        )}

        {/* Audio Player Section */}
        {showAudioPlayer && conversionData && (
          <AudioPlayer
            audioUrl={conversionData.audioPath ? `/api/audio/${currentConversionId}.mp3` : undefined}
            duration={conversionData.duration || undefined}
            fileSize={conversionData.fileSize || undefined}
            onDownload={handleDownload}
            onShare={handleShare}
            onConvertAnother={handleConvertAnother}
          />
        )}

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="theme-transition bg-light-card dark:bg-dark-card text-center shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-google-blue dark:bg-dark-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <Infinity className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
                Unlimited Text
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Process documents of any length with automatic chunking and seamless audio combining.
              </p>
            </CardContent>
          </Card>
          
          <Card className="theme-transition bg-light-card dark:bg-dark-card text-center shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-google-green dark:bg-dark-green rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
                Natural Voices
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Choose from multiple high-quality AI voices with natural intonation and expression.
              </p>
            </CardContent>
          </Card>
          
          <Card className="theme-transition bg-light-card dark:bg-dark-card text-center shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-google-red dark:bg-dark-red rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
                Fast Processing
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Advanced parallel processing ensures quick conversion even for large documents.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <ChatInterface />

        {/* Conversion History */}
        <ConversionHistory />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 theme-transition bg-light-card dark:bg-dark-card mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Powered by advanced AI technology for natural, high-quality speech synthesis
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <a href="#" className="hover:text-google-blue dark:hover:text-dark-blue theme-transition">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-google-blue dark:hover:text-dark-blue theme-transition">
                Terms of Service
              </a>
              <a href="#" className="hover:text-google-blue dark:hover:text-dark-blue theme-transition">
                API Documentation
              </a>
              <a href="#" className="hover:text-google-blue dark:hover:text-dark-blue theme-transition">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
