'use client';
import { motion } from 'framer-motion';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const MotionInput = motion.input;

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-dark-green-700">
            {label}
          </label>
        )}
        <MotionInput
          whileFocus={{ scale: 1.02 }}
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-lg border border-cream-300 
            focus:ring-2 focus:ring-dark-green-500 focus:border-transparent 
            transition-colors bg-white
            ${error ? 'border-red-300 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props as any} // Type assertion to avoid conflicts
        />
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;