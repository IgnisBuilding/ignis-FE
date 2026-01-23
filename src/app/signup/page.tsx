'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Phone, Shield, Flame, Building } from 'lucide-react';
import PageTransition from '@/components/shared/pageTransition';
import Button from '@/components/shared/Button';
import { Input } from '@/components/ui/Input';
import { scaleIn } from '@/lib/animations';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'resident' as UserRole,
    apartmentNumber: '',
    buildingId: 'b1'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await signup(formData);
    if (success) {
      router.push('/');
    } else {
      setError('User with this email already exists');
    }
    setLoading(false);
  };

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient flex items-center justify-center py-12 px-4">
        <motion.div variants={scaleIn} initial="initial" animate="animate" className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 green-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">I</span>
              </div>
              <h2 className="text-3xl font-bold text-dark-green-800">Create Account</h2>
              <p className="text-dark-green-600 mt-2">Join Ignis today</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-green-700 mb-2">Select Your Role</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setFormData({...formData, role: 'building_authority'})} className={'p-3 rounded-lg border-2 transition-all border-dark-green-500 bg-dark-green-50'}>
                    <Shield className="w-6 h-6 mx-auto mb-1 text-dark-green-600" />
                    <span className="text-xs font-medium">Management</span>
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, role: 'resident'})} className={'p-3 rounded-lg border-2 transition-all border-gray-200 hover:border-dark-green-300'}>
                    <Building className="w-6 h-6 mx-auto mb-1 text-dark-green-600" />
                    <span className="text-xs font-medium">Resident</span>
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, role: 'firefighter'})} className={'p-3 rounded-lg border-2 transition-all border-gray-200 hover:border-dark-green-300'}>
                    <Flame className="w-6 h-6 mx-auto mb-1 text-dark-green-600" />
                    <span className="text-xs font-medium">Firefighter</span>
                  </button>
                </div>
              </div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-green-400 w-5 h-5" />
                <Input type="text" placeholder="Full name" className="pl-11" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-green-400 w-5 h-5" />
                <Input type="email" placeholder="Email" className="pl-11" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-green-400 w-5 h-5" />
                <Input type={showPassword ? "text" : "password"} placeholder="Password" className="pl-11 pr-11" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-green-400">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-dark-green-600">Already have an account? <Link href="/login" className="font-medium text-dark-green-700 hover:text-dark-green-900">Sign in</Link></p>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
