import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Paperclip, Loader2, User, Bot, Volume2, MessageSquare, History as HistoryIcon } from 'lucide-react';
import { Message } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { AnimatedAvatar } from './AnimatedAvatar';
import { VoiceMicAnimation } from './VoiceMicAnimation';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isListening: boolean;
  onToggleMic: () => void;
  isLoading: boolean;
  onFileUpload: (file: File) => void;
  nextStep?: string;
  missingFields?: string[];
  isSpeaking: boolean;
  currentSpeechCharIndex: number;
  transcript?: string;
}

const TypingMessage: React.FC<{ content: string; isSpeaking: boolean; currentCharIndex: number }> = ({ 
  content, 
  isSpeaking, 
  currentCharIndex 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [autoIndex, setAutoIndex] = useState(0);
  const wasSpeaking = useRef(false);

  if (isSpeaking) wasSpeaking.current = true;

  // Auto-typing fallback when not speaking AND hasn't spoken yet
  useEffect(() => {
    if (!isSpeaking && !wasSpeaking.current && autoIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedText(content.substring(0, autoIndex + 1));
        setAutoIndex((prev) => prev + 1);
      }, 15);
      return () => clearTimeout(timer);
    }
  }, [autoIndex, content, isSpeaking]);

  // Voice-synced typing
  useEffect(() => {
    if (isSpeaking) {
      // Find the end of the current word to avoid cutting words in half
      const nextSpace = content.indexOf(' ', currentCharIndex);
      const endIndex = nextSpace === -1 ? content.length : nextSpace;
      setDisplayedText(content.substring(0, endIndex));
    } else if (wasSpeaking.current) {
      // Once speaking ends, ensure full text is shown and don't restart typing
      setDisplayedText(content);
    }
  }, [currentCharIndex, content, isSpeaking]);

  return <ReactMarkdown>{displayedText}</ReactMarkdown>;
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isListening,
  onToggleMic,
  isLoading,
  onFileUpload,
  nextStep,
  missingFields,
  isSpeaking,
  currentSpeechCharIndex,
  transcript
}) => {
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lastAiMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
      {/* Header */}
      <div className="bg-white p-4 border-b flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <AnimatedAvatar isSpeaking={isSpeaking} size="sm" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Voice Mode Active
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={cn(
            "p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider",
            showHistory ? "bg-primary-soft text-primary" : "text-gray-500 hover:bg-gray-100"
          )}
        >
          {showHistory ? <MessageSquare className="w-4 h-4" /> : <HistoryIcon className="w-4 h-4" />}
          {showHistory ? "Voice View" : "Chat History"}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Voice Animation Layer */}
        <div className={cn(
          "absolute inset-0 transition-all duration-500 z-10",
          showHistory ? "opacity-0 pointer-events-none scale-95" : "opacity-100 pointer-events-auto scale-100"
        )}>
          <VoiceMicAnimation 
            isListening={isListening}
            isSpeaking={isSpeaking}
            transcript={transcript}
            aiResponse={lastAiMessage}
          />
        </div>

        {/* Chat History Layer */}
        <div className={cn(
          "absolute inset-0 transition-all duration-500 z-20 bg-white/95 backdrop-blur-sm",
          showHistory ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
        )}>
          <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    m.role === 'user' ? "bg-gray-200" : ""
                  )}>
                    {m.role === 'user' ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <AnimatedAvatar isSpeaking={isSpeaking && m.id === messages[messages.length - 1].id} size="sm" />
                    )}
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm shadow-sm",
                    m.role === 'user' 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                  )}>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {m.role === 'assistant' && m.id === messages[messages.length - 1].id ? (
                        <TypingMessage 
                          content={m.content} 
                          isSpeaking={isSpeaking} 
                          currentCharIndex={currentSpeechCharIndex} 
                        />
                      ) : (
                        <ReactMarkdown>
                          {m.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <div className="flex gap-3 mr-auto max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-4 bg-white border-t z-30">
        {nextStep && !isLoading && !showHistory && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2 mb-4"
          >
            <div className="flex flex-wrap justify-center gap-2">
              <div className="px-4 py-2 bg-primary-soft text-primary-dark rounded-full text-xs font-bold border border-primary-border flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
                Next Step: {nextStep}
              </div>
              {missingFields && missingFields.length > 0 && (
                <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200 shadow-sm">
                  {missingFields.length} fields remaining
                </div>
              )}
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-primary-light transition-colors">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
            title="Upload ID for OCR"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileUpload(file);
            }}
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your report or speak..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
          />
          <button
            type="button"
            onClick={onToggleMic}
            className={cn(
              "p-2 rounded-lg transition-all",
              isListening ? "bg-red-500 text-white shadow-lg shadow-red-200" : "text-gray-500 hover:bg-gray-200"
            )}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
