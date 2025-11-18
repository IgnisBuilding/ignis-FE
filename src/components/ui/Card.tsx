'use client';
import { motion } from 'framer-motion';
import { memo } from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card = memo(({ children, className = '', hover = false }: CardProps) => {
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : {}}
      className={`bg-white rounded-xl shadow-sm border border-cream-200 p-6 ${className}`}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  );
});

Card.displayName = 'Card';
export default Card;