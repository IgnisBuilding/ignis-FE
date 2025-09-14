'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import PageTransition from '@/components/shared/pageTransition';
import Button from '@/components/shared/Button';
import Input from '@/components/ui/Input';
import { fadeIn, scaleIn } from '@/lib/animations';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Login attempt:', formData);
  };

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          className="max-w-md w-full space-y-8"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <motion.div
                variants={fadeIn}
                className="w-16 h-16 green-gradient rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <span className="text-white font-bold text-2xl">I</span>
              </motion.div>
              <h2 className="text-3xl font-bold text-dark-green-800">
                Welcome back
              </h2>
              <p className="text-dark-green-600 mt-2">
                Sign in to your Ignis account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-green-400 w-5 h-5" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-11 pr-11"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-green-400 hover:text-dark-green-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex items-center justify-between"
              >
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-cream-300 text-dark-green-600 focus:ring-dark-green-500" />
                  <span className="ml-2 text-sm text-dark-green-600">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-dark-green-600 hover:text-dark-green-800">
                  Forgot password?
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <Button type="submit" className="w-full" size="lg">
                  Sign In
                </Button>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="mt-6 text-center"
            >
              <p className="text-dark-green-600">
                Don't have an account?{' '}
                <Link href="/signup" className="font-medium text-dark-green-700 hover:text-dark-green-900">
                  Sign up
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}