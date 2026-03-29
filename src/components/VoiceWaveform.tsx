import React from 'react';
import { motion } from 'motion/react';

export const VoiceWaveform: React.FC = () => {
  return (
    <div className="flex items-center gap-1 h-4 px-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="w-1 bg-primary rounded-full"
          animate={{
            height: [4, 12, 6, 14, 4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
