import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TTSConverterProps {
  onConversionStart: (conversionId: string) => void;
}

export function TTSConverter({ onConversionStart }: TTSConverterProps) {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("alloy");
  const [speed, setSpeed] = useState("1.0");
  const [format, setFormat] = useState("mp3");
  const { toast } = useToast();

  const convertMutation = useMutation({
    mutationFn: async (data: { text: string; voice: string; speed: string; format: string }) => {
      const response = await apiRequest('POST', '/api/conversions', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Conversion Started",
        description: "Your text is being converted to speech. This may take a few moments.",
      });
      onConversionStart(data.id);
    },
    onError: (error) => {
      toast({
        title: "Conversion Failed",
        description: error.message || "Failed to start conversion. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      toast({
        title: "Text Required",
        description: "Please enter some text to convert to speech.",
        variant: "destructive",
      });
      return;
    }

    convertMutation.mutate({ text, voice, speed, format });
  };

  const charCount = text.length;

  return (
    <Card className="theme-transition bg-light-card dark:bg-dark-card shadow-lg">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="text-input" className="block text-lg font-medium text-light-text dark:text-dark-text mb-3">
              Enter your text
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                (Unlimited length supported)
              </span>
            </Label>
            
            <div className="relative">
              <Textarea
                id="text-input"
                placeholder="Type or paste your text here. The system will automatically process large content in segments and combine them into a single audio file..."
                className="w-full h-64 resize-none text-base leading-relaxed"
                value={text}
                onChange={(e) => setText(e.target.value)}
                data-testid="textarea-text-input"
              />
              
              <div className="absolute bottom-3 right-3 text-sm text-gray-500 dark:text-gray-400 bg-light-card dark:bg-dark-card px-2 py-1 rounded">
                <span data-testid="text-char-count">{charCount.toLocaleString()}</span> characters
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">Voice</Label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger data-testid="select-voice">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                  <SelectItem value="echo">Echo (Male)</SelectItem>
                  <SelectItem value="fable">Fable (British)</SelectItem>
                  <SelectItem value="onyx">Onyx (Deep)</SelectItem>
                  <SelectItem value="nova">Nova (Young Female)</SelectItem>
                  <SelectItem value="shimmer">Shimmer (Soft Female)</SelectItem>
                  <SelectItem value="ash">Ash (Clear)</SelectItem>
                  <SelectItem value="coral">Coral (Warm)</SelectItem>
                  <SelectItem value="sage">Sage (Calm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">Speed</Label>
              <Select value={speed} onValueChange={setSpeed}>
                <SelectTrigger data-testid="select-speed">
                  <SelectValue placeholder="Select speed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.75">0.75x (Slow)</SelectItem>
                  <SelectItem value="1.0">1.0x (Normal)</SelectItem>
                  <SelectItem value="1.25">1.25x (Fast)</SelectItem>
                  <SelectItem value="1.5">1.5x (Very Fast)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger data-testid="select-format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp3">MP3 (Recommended)</SelectItem>
                  <SelectItem value="wav">WAV (High Quality)</SelectItem>
                  <SelectItem value="ogg">OGG (Open Source)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              type="submit"
              disabled={convertMutation.isPending || !text.trim()}
              className="bg-google-blue dark:bg-dark-blue hover:bg-blue-600 dark:hover:bg-blue-400 text-white font-medium px-8 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              data-testid="button-convert"
            >
              <Play className="w-4 h-4 mr-2" />
              {convertMutation.isPending ? 'Converting...' : 'Convert to Speech'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
