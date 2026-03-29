import React, { useEffect } from 'react';
import { motion, useAnimation, Variants } from 'motion/react';

interface AnimatedAvatarProps {
  isSpeaking: boolean;
  currentCharIndex?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({ isSpeaking, currentCharIndex = 0, size = 'md' }) => {
  const controls = useAnimation();

  useEffect(() => {
    if (isSpeaking && currentCharIndex > 0) {
      controls.start("wordHit").then(() => {
        if (isSpeaking) controls.start("speaking");
      });
    }
  }, [currentCharIndex, isSpeaking, controls]);

  useEffect(() => {
    if (!isSpeaking) {
      controls.start("idle");
    } else {
      controls.start("speaking");
    }
  }, [isSpeaking, controls]);

  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24'
  };

  // Use currentCharIndex to trigger a "pulse" on word boundaries
  const mouthVariants: Variants = {
    speaking: {
      d: [
        "M 35 65 Q 50 70 65 65",
        "M 35 65 Q 50 85 65 65",
        "M 35 65 Q 50 75 65 65",
      ],
      transition: {
        duration: 0.15,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
    wordHit: {
      d: "M 30 65 Q 50 90 70 65",
      transition: { duration: 0.1 }
    },
    idle: {
      d: "M 40 65 Q 50 68 60 65",
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div 
      className={`${dimensions[size]} relative flex items-center justify-center`}
      animate={isSpeaking ? {
        scale: [1, 1.05, 1],
      } : { scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Background Glow */}
      {isSpeaking && (
        <motion.div
          className="absolute inset-0 bg-primary-light/20 rounded-full blur-xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield Base */}
        <motion.path
          d="M 50 10 L 15 25 V 50 C 15 75 50 90 50 90 C 50 90 85 75 85 50 V 25 L 50 10 Z"
          fill="#4C5C2D"
          animate={isSpeaking ? {
            scale: [1, 1.02, 1],
          } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        
        {/* Inner Shield Detail */}
        <motion.path
          d="M 50 18 L 22 30 V 50 C 22 70 50 82 50 82 C 50 82 78 70 78 50 V 30 L 50 18 Z"
          fill="#6A7E3F"
        />

        {/* Eyes */}
        <motion.g
          animate={isSpeaking ? {
            y: [0, -2, 0],
          } : {}}
          transition={{ duration: 0.4, repeat: Infinity }}
        >
          {/* Left Eye */}
          <rect x="35" y="40" width="8" height="2" rx="1" fill="white" />
          <motion.rect 
            x="37" y="40" width="4" height="2" rx="1" fill="#4C5C2D"
            animate={isSpeaking ? {
              opacity: [1, 0.5, 1],
            } : {}}
            transition={{ duration: 0.2, repeat: Infinity }}
          />
          
          {/* Right Eye */}
          <rect x="57" y="40" width="8" height="2" rx="1" fill="white" />
          <motion.rect 
            x="59" y="40" width="4" height="2" rx="1" fill="#4C5C2D"
            animate={isSpeaking ? {
              opacity: [1, 0.5, 1],
            } : {}}
            transition={{ duration: 0.2, repeat: Infinity }}
          />
        </motion.g>

        {/* Mouth */}
        <motion.path
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          initial="idle"
          animate={controls}
          variants={mouthVariants}
        />

        {/* Legal Icon Accessory (Scales) */}
        <motion.path
          d="M 50 25 L 50 35 M 40 35 L 60 35 M 40 35 L 35 45 M 60 35 L 65 45"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
          strokeLinecap="round"
          animate={isSpeaking ? {
            rotate: [0, 5, -5, 0],
          } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </svg>

      {/* Speaking Indicator Rings */}
      {isSpeaking && (
        <div className="absolute -inset-1">
          {[1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 border-2 border-primary-light/30 rounded-full"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{
                scale: 1.5,
                opacity: 0,
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.7,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
