'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const AnimatedCounter = ({ 
  end, 
  duration = 2, 
  prefix = '',
  suffix = '',
  decimals = 0 
}: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animationFrameId = requestAnimationFrame(function animate(currentTime: number) {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      const currentCount = Math.floor(end * progress);
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  const displayValue = decimals > 0 
    ? count.toFixed(decimals)
    : count.toLocaleString();

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}{displayValue}{suffix}
    </motion.span>
  );
};
