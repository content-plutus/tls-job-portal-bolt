import type { ComponentPropsWithoutRef } from 'react';
import { motion } from 'framer-motion';

type MotionDivProps = ComponentPropsWithoutRef<typeof motion.div>;

interface CardProps extends MotionDivProps {
  hover?: boolean;
  glass?: boolean;
}

export default function Card({ className = '', hover = false, glass = false, children, ...props }: CardProps) {
  const baseStyles = 'rounded-xl shadow-lg transition-all duration-300';
  const glassStyles = glass
    ? 'bg-white/10 dark:bg-gray-900/10 backdrop-blur-lg border border-white/20'
    : 'bg-white dark:bg-gray-800';
  const hoverStyles = hover ? 'hover:-translate-y-1 hover:shadow-2xl cursor-pointer' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${baseStyles} ${glassStyles} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
