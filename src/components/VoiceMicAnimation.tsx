import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface VoiceMicAnimationProps {
  isListening: boolean;
  isSpeaking: boolean;
  transcript?: string;
  aiResponse?: string;
}

export const VoiceMicAnimation: React.FC<VoiceMicAnimationProps> = ({
  isListening,
  isSpeaking,
  transcript,
  aiResponse
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-b from-primary-soft to-white p-8 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <AnimatePresence>
        {(isListening || isSpeaking) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
              "absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-20",
              isListening ? "bg-red-400" : "bg-primary-light"
            )}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-2xl">
        {/* Central Visualizer */}
        <div className="relative flex items-center justify-center w-64 h-64">
          {/* Pulse Rings */}
          <AnimatePresence>
            {(isListening || isSpeaking) && (
              <>
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className={cn(
                      "absolute inset-0 rounded-full border-2",
                      isListening ? "border-red-400/30" : "border-primary-light/30"
                    )}
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{
                      scale: [1, 1.5 + i * 0.2, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Main Icon Container */}
          <motion.div
            className={cn(
              "w-48 h-48 rounded-full flex items-center justify-center shadow-2xl relative z-20",
              isListening 
                ? "bg-red-500 text-white" 
                : isSpeaking 
                  ? "bg-primary text-white" 
                  : "bg-white text-gray-400 border-4 border-gray-100"
            )}
            animate={isListening || isSpeaking ? {
              scale: [1, 1.05, 1],
            } : {}}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {isListening ? (
              <Mic className="w-20 h-20 animate-pulse" />
            ) : isSpeaking ? (
              <Volume2 className="w-20 h-20" />
            ) : (
              <MicOff className="w-20 h-20 opacity-50" />
            )}
          </motion.div>

          {/* Waveform Bars (Only when speaking) */}
          {isSpeaking && (
            <div className="absolute -bottom-8 flex items-end gap-1 h-12">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 bg-primary rounded-full"
                  animate={{
                    height: [10, Math.random() * 40 + 10, 10],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Text Display Area */}
        <div className="w-full text-center space-y-6">
          <AnimatePresence mode="wait">
            {isListening && transcript && (
              <motion.div
                key="transcript"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-red-100 shadow-sm"
              >
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Listening...</p>
                <p className="text-xl font-medium text-gray-800 italic">"{transcript}"</p>
              </motion.div>
            )}

            {isSpeaking && aiResponse && (
              <motion.div
                key="response"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-primary p-6 rounded-3xl shadow-xl text-white"
              >
                <p className="text-primary-soft text-xs font-bold uppercase tracking-widest mb-2">Raksha Speaking</p>
                <p className="text-lg leading-relaxed font-medium">
                  {aiResponse}
                </p>
              </motion.div>
            )}

            {!isListening && !isSpeaking && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-400"
              >
                <p className="text-sm font-medium">Tap the microphone to start speaking</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isListening ? "bg-red-500 animate-ping" : "bg-green-500"
          )} />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">
            {isListening ? "Voice Input Active" : "System Ready"}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-bold uppercase">Legal Assistant</p>
            <p className="text-xs font-bold text-gray-700">Raksha v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};
