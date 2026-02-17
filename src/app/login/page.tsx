'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/providers/LanguageProvider';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const previousTheme = useRef(theme);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Force light theme on login page
  useEffect(() => {
    previousTheme.current = theme;
    if (theme !== 'light') {
      setTheme('light');
    }
    return () => {
      if (previousTheme.current && previousTheme.current !== 'light') {
        setTheme(previousTheme.current);
      }
    };
  }, []);
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

          // Route based on role
          switch (role) {
            case 'admin':
              router.push('/admin');
              break;
            case 'commander':
            case 'management':
            case 'building_authority':
              router.push('/manager');
              break;
            case 'firefighter':
            case 'firefighter_hq':
            case 'firefighter_state':
            case 'firefighter_district':
              router.push('/firefighter');
              break;
            case 'resident':
            default:
              router.push('/resident');
              break;
          }
        } else {
          router.push('/');
        }
      } else {
        setError(t.login.invalidCredentials);
      }
    } catch (err: any) {
      setError(err.message || t.login.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'admin' | 'management' | 'firefighter_hq' | 'firefighter_state' | 'firefighter_district' | 'resident') => {
    const credentials = {
      admin: { email: 'admin@ignis.com', password: 'admin123' },
      management: { email: 'management@ignis.com', password: 'admin123' },
      firefighter_hq: { email: 'firefighter_hq@ignis.com', password: 'firefighter123' },
      firefighter_state: { email: 'firefighter_state@ignis.com', password: 'firefighter123' },
      firefighter_district: { email: 'firefighter@ignis.com', password: 'firefighter123' },
      resident: { email: 'resident@ignis.com', password: 'resident123' },
    };
    setEmail(credentials[role].email);
    setPassword(credentials[role].password);
    setError('');
  };

  return (
    <div className="light min-h-screen w-full bg-[#FDFBF7] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 fixed inset-0" style={{ colorScheme: 'light' }}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image src="/sidebaropened.png" alt="Ignis" width={320} height={96} className="h-24 w-auto object-contain" />
          </div>
          <p className="text-primary/60 text-sm font-medium uppercase tracking-widest">{t.login.subtitle}</p>
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
                {t.login.email}
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
                {t.login.password}
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
                  <span>{t.login.authenticating}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>{t.login.signIn}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-primary/10">
            <p className="text-xs text-primary/60 text-center mb-4 font-bold uppercase tracking-widest">
              {t.login.quickDemo}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin')}
                className="px-3 py-2 text-xs font-bold bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-all border border-primary/10 uppercase tracking-wider"
              >
                {t.login.admin}
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('management')}
                className="px-3 py-2 text-xs font-bold bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-all border border-primary/10 uppercase tracking-wider"
              >
                {t.login.manager}
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('resident')}
                className="px-3 py-2 text-xs font-bold bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-all border border-primary/10 uppercase tracking-wider"
              >
                {t.login.resident}
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('firefighter_hq')}
                className="px-3 py-2 text-xs font-bold bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-all border border-primary/10 uppercase tracking-wider"
              >
                {t.login.ffHq}
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('firefighter_state')}
                className="px-3 py-2 text-xs font-bold bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-all border border-primary/10 uppercase tracking-wider"
              >
                {t.login.ffState}
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('firefighter_district')}
                className="px-3 py-2 text-xs font-bold bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-all border border-primary/10 uppercase tracking-wider"
              >
                {t.login.ffDistrict}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
