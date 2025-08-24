import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Loader2, Brain, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  className?: string;
}

const GPT4ALL_API_URL = 'http://localhost:8000';

export function ChatInterface({ className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check service status on mount
  useEffect(() => {
    checkServiceStatus();
    const interval = setInterval(checkServiceStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const checkServiceStatus = async () => {
    try {
      const response = await fetch(`${GPT4ALL_API_URL}/status`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setServiceStatus(data.ready ? 'ready' : 'loading');
      } else {
        setServiceStatus('error');
      }
    } catch (error) {
      console.log('GPT4All service not available yet:', error);
      setServiceStatus('error');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || serviceStatus !== 'ready') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${GPT4ALL_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: inputMessage.trim(),
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <Card className={cn("theme-transition bg-light-card dark:bg-dark-card shadow-lg", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-google-blue dark:bg-dark-blue rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-light-text dark:text-dark-text">
                Local AI Chat
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant={serviceStatus === 'ready' ? 'default' : serviceStatus === 'loading' ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {serviceStatus === 'ready' && <Zap className="w-3 h-3 mr-1" />}
                  {serviceStatus === 'loading' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                  {serviceStatus === 'ready' ? 'GPT4All Ready' : serviceStatus === 'loading' ? 'Loading Model...' : 'Service Offline'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  No API Key Required
                </Badge>
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearChat}
              className="text-gray-500 dark:text-gray-400"
              data-testid="button-clear-chat"
            >
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <ScrollArea className="h-80 w-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Start a conversation with your local AI assistant!
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  Powered by GPT4All-J running locally
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    message.role === 'user' ? 'ml-auto' : 'mr-auto'
                  )}
                  data-testid={`message-${message.role}-${message.id}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-google-blue dark:bg-dark-blue rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "rounded-lg px-3 py-2 break-words",
                    message.role === 'user' 
                      ? 'bg-google-blue dark:bg-dark-blue text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-light-text dark:text-dark-text'
                  )}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p className={cn(
                      "text-xs mt-1 opacity-70",
                      message.role === 'user' ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-gray-500 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <div className="w-8 h-8 bg-google-blue dark:bg-dark-blue rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-google-blue dark:text-dark-blue" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="flex space-x-2">
          <Textarea
            ref={textareaRef}
            placeholder={
              serviceStatus === 'ready' 
                ? "Ask your local AI anything..." 
                : serviceStatus === 'loading'
                ? "Please wait for the model to load..."
                : "Service unavailable"
            }
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || serviceStatus !== 'ready'}
            className="flex-1 min-h-[44px] max-h-32 resize-none"
            data-testid="textarea-chat-input"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading || serviceStatus !== 'ready'}
            size="icon"
            className="h-11 w-11 bg-google-blue dark:bg-dark-blue hover:bg-blue-600 dark:hover:bg-blue-400"
            data-testid="button-send-message"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {serviceStatus === 'error' && (
          <div className="text-center py-4">
            <p className="text-red-500 dark:text-red-400 text-sm">
              GPT4All service is not running. Please start the Python service first.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkServiceStatus}
              className="mt-2"
              data-testid="button-retry-connection"
            >
              Retry Connection
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}