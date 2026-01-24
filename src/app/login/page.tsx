'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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
        const storedUser = localStorage.getItem('ignis_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          const role = userData.role;
          
          if (role === 'management' || role === 'building_authority') {
            router.push('/admin');
          } else if (role === 'firefighter') {
            router.push('/firefighter');
          } else if (role === 'resident') {
            router.push('/resident');
          } else {
            router.push('/');
          }
        } else {
          router.push('/');
        }
      } else {
        setError('Invalid email or password');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'management' | 'firefighter' | 'resident') => {
    const credentials = {
      management: { email: 'management@ignis.com', password: 'admin123' },
      firefighter: { email: 'firefighter@ignis.com', password: 'admin123' },
      resident: { email: 'resident@ignis.com', password: 'admin123' },
    };
    setEmail(credentials[role].email);
    setPassword(credentials[role].password);
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-accent flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 fixed inset-0">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Ignis Command</h1>
          <p className="text-primary/60 text-sm font-medium uppercase tracking-widest">Elite Response System</p>
        </div>

        <div className="glass-card rounded-2xl p-8 shadow-xl shadow-primary/5 border border-primary/5">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-primary/80 mb-2 uppercase tracking-wider text-xs">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="management@ignis.com"
                className="w-full px-4 py-3 bg-primary/5 border border-primary/10 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all text-primary placeholder:text-primary/30 font-medium"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-primary/80 mb-2 uppercase tracking-wider text-xs">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-primary/5 border border-primary/10 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all text-primary placeholder:text-primary/30 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-bold shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-primary/10">
            <p className="text-xs text-primary/60 text-center mb-4 font-bold uppercase tracking-widest">
              Quick Demo Login:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('management')}
                className="px-3 py-2 text-xs font-bold bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-all border border-primary/10 uppercase tracking-wider"
              >
                Management
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('firefighter')}
                className="px-3 py-2 text-xs font-bold bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-all border border-primary/10 uppercase tracking-wider"
              >
                Firefighter
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('resident')}
                className="px-3 py-2 text-xs font-bold bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-all border border-primary/10 uppercase tracking-wider"
              >
                Resident
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

