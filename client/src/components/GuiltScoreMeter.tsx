import React from 'react';
import { motion } from 'framer-motion';

interface GuiltScoreMeterProps {
  score: number;
  message: string;
}

const GuiltScoreMeter: React.FC<GuiltScoreMeterProps> = ({ score, message }) => {
  // Stitch styling: Conic gradient gauge
  // Score is out of 100.
  const percentage = Math.min(100, Math.max(0, score));
  
  const getColor = (s: number) => {
    if (s <= 20) return '#10B981'; // Emerald
    if (s <= 40) return '#34D399'; // Green
    if (s <= 60) return '#F59E0B'; // Amber
    if (s <= 80) return '#ff716a'; // Tertiary-ish Red
    return '#DC2626'; // Disaster Red
  };

  const currentColor = getColor(percentage);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-32 h-32 flex items-center justify-center group">
        {/* Background Arc/Circle */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{ 
            background: `conic-gradient(${currentColor} 0% ${percentage}%, #1d253b ${percentage}% 100%)`,
            boxShadow: `0 0 20px ${currentColor}20`
          }}
        />
        {/* Inner Hole for Donut Effect */}
        <div className="absolute inset-[10%] bg-[#1d253b] rounded-full flex items-center justify-center z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <span className="text-3xl font-black italic tracking-tighter" style={{ color: currentColor }}>
              {percentage}
            </span>
            <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-[0.2em] -mt-1 opacity-60">Pts</span>
          </motion.div>
        </div>
      </div>
      
      <div className="mt-6 text-center space-y-1">
        <p className="text-sm font-bold leading-tight" style={{ color: currentColor }}>
          {message}
        </p>
        <p className="text-on-surface-variant text-[10px] opacity-60 uppercase tracking-widest font-black">
          You're doing better than 60% of students!
        </p>
      </div>
    </div>
  );
};

export default GuiltScoreMeter;
