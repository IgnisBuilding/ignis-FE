'use client';
import { motion } from 'framer-motion';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variants = {
      primary: 'green-gradient text-white hover:from-dark-green-600 hover:to-dark-green-700 focus:ring-dark-green-500',
      secondary: 'bg-cream-200 text-dark-green-700 hover:bg-cream-300 focus:ring-cream-400',
      outline: 'border-2 border-dark-green-500 text-dark-green-500 hover:bg-dark-green-50 focus:ring-dark-green-500'
    };
    
    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props as any} // Type assertion to avoid conflicts
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;