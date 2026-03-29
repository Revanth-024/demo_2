import React from 'react';
import { motion } from 'motion/react';

interface LegalAvatarProps {
  isSpeaking: boolean;
  isLoading: boolean;
  currentCharIndex?: number;
}

export const LegalAvatar: React.FC<LegalAvatarProps> = ({ isSpeaking, isLoading, currentCharIndex = 0 }) => {
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      {/* Background Glow */}
      {isSpeaking && (
        <motion.div
          className="absolute inset-0 bg-primary-light rounded-full opacity-20"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Main Avatar Body */}
      <motion.div 
        className="relative w-10 h-10 bg-primary rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md"
        animate={isSpeaking ? {
          scale: [1, 1.05, 1],
        } : isLoading ? {
          scale: [1, 1.1, 1],
        } : {}}
        transition={{ 
          duration: 0.5, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-1">
          <path
            d="M 50 10 L 15 25 V 50 C 15 75 50 90 50 90 C 50 90 85 75 85 50 V 25 L 50 10 Z"
            fill="white"
            fillOpacity="0.2"
          />
          <circle cx="35" cy="45" r="4" fill="white" />
          <circle cx="65" cy="45" r="4" fill="white" />
          <motion.path
            d="M 40 65 Q 50 70 60 65"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            animate={isSpeaking ? {
              d: [
                "M 40 65 Q 50 75 60 65",
                "M 40 65 Q 50 85 60 65",
                "M 40 65 Q 50 75 60 65",
              ]
            } : {}}
          />
        </svg>
      </motion.div>

      {/* Loading Indicator */}
      {isLoading && (
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </motion.div>
      )}
    </div>
  );
};
