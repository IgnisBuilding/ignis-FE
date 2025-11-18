'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, User as UserIcon, Flame } from 'lucide-react';
import PageTransition from '@/components/shared/pageTransition';
import { useAuth } from '../../../context/AuthContext';
import { UserRole } from '../../../types';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = async (role: UserRole) => {
    setLoading(true);
    const credentials = { 
      building_authority: { email: 'admin@ignis.com', password: 'admin123' }, 
      resident: { email: 'resident@ignis.com', password: 'resident123' }, 
      firefighter: { email: 'firefighter@ignis.com', password: 'firefighter123' } 
    };
    const { email, password } = credentials[role];
    const success = await login(email, password);
    
    if (success) {
      if (role === 'building_authority') router.push('/admin');
      else if (role === 'resident') router.push('/resident');
      else if (role === 'firefighter') router.push('/firefighter');
    }
    setLoading(false);
  };

  const roleCards = [
    {
      role: 'building_authority' as UserRole,
      title: 'Building Authority',
      description: 'Manage residents, sensors & buildings',
      icon: Shield,
      gradient: 'from-blue-500 to-blue-600',
      delay: 0.1
    },
    {
      role: 'resident' as UserRole,
      title: 'Resident',
      description: 'View apartment info & alerts',
      icon: UserIcon,
      gradient: 'from-green-500 to-green-600',
      delay: 0.15
    },
    {
      role: 'firefighter' as UserRole,
      title: 'Firefighter',
      description: 'Monitor active fire locations',
      icon: Flame,
      gradient: 'from-orange-500 to-red-500',
      delay: 0.2
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient flex items-center justify-center py-12 px-4 relative overflow-hidden">
        {/* Floating background elements - Reduced motion */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-dark-green-200/20 to-dark-green-300/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-dark-green-300/20 to-dark-green-400/10 rounded-full blur-3xl" />
        </div>

        <motion.div 
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="max-w-md w-full relative z-10"
        >
          <div className="glass-effect rounded-3xl p-10 shadow-2xl border border-white/50">
            <div className="text-center mb-10">
              <motion.div 
                initial={{ scale: 0.9 }} 
                animate={{ scale: 1 }} 
                transition={{ duration: 0.15, ease: 'easeOut' }} 
                className="w-20 h-20 green-gradient rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
              >
                <span className="text-white font-bold text-3xl">I</span>
              </motion.div>
              <h2 className="text-4xl font-bold gradient-text mb-3">
                Welcome to Ignis
              </h2>
              <p className="text-dark-green-600 text-lg">
                Select your role to continue
              </p>
            </div>
            
            <div className="space-y-4">
              {roleCards.map((card) => (
                <motion.button 
                  key={card.role}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }} 
                  onClick={() => handleRoleSelect(card.role)} 
                  disabled={loading} 
                  className="w-full p-6 premium-card rounded-2xl hover:shadow-2xl transition-all group disabled:opacity-50 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-dark-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center space-x-4 relative z-10">
                    <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                      <card.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-xl font-bold text-dark-green-800 group-hover:text-dark-green-900 transition-colors">{card.title}</h3>
                      <p className="text-sm text-dark-green-600 mt-1">{card.description}</p>
                    </div>
                    <span className="text-dark-green-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </motion.button>
              ))}
            </div>
            
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 text-center"
              >
                <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-full bg-gradient-to-r from-dark-green-50 to-dark-green-100">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-3 border-dark-green-500 border-t-transparent rounded-full"
                  />
                  <p className="text-sm font-semibold text-dark-green-700">Logging in...</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}

