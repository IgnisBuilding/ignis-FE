'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import PageTransition from '@/components/shared/pageTransition';
import { useAuth } from '../../../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const success = await login(email, password);
      
      if (success) {
        // Redirect based on role will be handled by the page after login
        router.push('/admin');
      } else {
        setError('Invalid email or password');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'admin' | 'firefighter' | 'manager') => {
    const credentials = {
      admin: { email: 'admin@ignis.com', password: 'admin123' },
      firefighter: { email: 'firefighter@ignis.com', password: 'admin123' },
      manager: { email: 'manager@ignis.com', password: 'admin123' },
    };
    setEmail(credentials[role].email);
    setPassword(credentials[role].password);
    setError('');
  };

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient flex items-center justify-center py-12 px-4 relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-dark-green-200/20 to-dark-green-300/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-dark-green-300/20 to-dark-green-400/10 rounded-full blur-3xl" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-md w-full relative z-10"
        >
          <div className="glass-effect rounded-3xl p-10 shadow-2xl border border-white/50">
            <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0.9 }} 
                animate={{ scale: 1 }} 
                transition={{ duration: 0.2 }} 
                className="w-20 h-20 green-gradient rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
              >
                <span className="text-white font-bold text-3xl">I</span>
              </motion.div>
              <h2 className="text-4xl font-bold gradient-text mb-3">
                Welcome to Ignis
              </h2>
              <p className="text-dark-green-600 text-lg">
                Sign in to your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-dark-green-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-green-400 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@ignis.com"
                    className="w-full pl-12 pr-4 py-3 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:ring-2 focus:ring-dark-green-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-dark-green-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-green-400 w-5 h-5" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:ring-2 focus:ring-dark-green-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3.5 green-gradient text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 pt-6 border-t border-dark-green-200">
              <p className="text-sm text-dark-green-600 text-center mb-4 font-semibold">
                Quick Demo Login:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('admin')}
                  className="px-3 py-2 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('firefighter')}
                  className="px-3 py-2 text-xs font-semibold bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
                >
                  Firefighter
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('manager')}
                  className="px-3 py-2 text-xs font-semibold bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                >
                  Manager
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}

