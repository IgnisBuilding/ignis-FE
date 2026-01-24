'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building, Users, MessageSquare, Receipt, Package, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { staggerContainer, fadeInUp } from '@/lib/animations';

const QuickNav = () => {
  const modules = [
    {
      title: 'Society Management',
      description: 'Manage properties and residents',
      href: '/societyManagement',
      icon: Building,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Ignis System',
      description: 'Core platform features',
      href: '/ignis',
      icon: Users,
      color: 'from-dark-green-500 to-dark-green-600',
    },
    {
      title: 'Community',
      description: 'Resident communication hub',
      href: '/community',
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Billing',
      description: 'Invoice and payment management',
      href: '/billing',
      icon: Receipt,
      color: 'from-orange-500 to-orange-600',
    },
    {
      title: 'Renting',
      description: 'Equipment and facility rentals',
      href: '/renting',
      icon: Package,
      color: 'from-pink-500 to-pink-600',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {modules.map((module) => (
        <motion.div key={module.title} variants={fadeInUp}>
          <Link href={module.href}>
            <Card hover className="group cursor-pointer">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${module.color} flex items-center justify-center mb-4`}>
                <module.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-dark-green-800 mb-2 group-hover:text-dark-green-600 transition-colors">
                {module.title}
              </h3>
              <p className="text-dark-green-600 mb-4">{module.description}</p>
              <div className="flex items-center text-dark-green-500 group-hover:text-dark-green-600 transition-colors">
                <span className="text-sm font-medium">Learn more</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default QuickNav;