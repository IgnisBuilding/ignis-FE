'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen cream-gradient flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          animate={{
            rotate: [0, -10, 10, -10, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: 3,
          }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl shadow-xl mb-6"
        >
          <AlertTriangle className="w-10 h-10 text-white" />
        </motion.div>

        <h1 className="text-3xl font-bold gradient-text mb-3">Something went wrong</h1>
        <p className="text-dark-green-600 mb-8">
          We encountered an unexpected error. Please try again or return to the home page.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-dark-green-500 to-dark-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            <RefreshCcw size={18} />
            <span>Try Again</span>
          </motion.button>

          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-dark-green-500 text-dark-green-700 rounded-xl font-semibold hover:bg-dark-green-50 transition-colors"
            >
              <Home size={18} />
              <span>Go Home</span>
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
