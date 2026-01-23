'use client';
import { motion } from 'framer-motion';
import { Users, Building, DollarSign, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { staggerContainer, fadeInUp } from '@/lib/animations';

const StatsCards = () => {
  const stats = [
    {
      title: 'Total Residents',
      value: '1,247',
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Active Societies',
      value: '8',
      change: '+2',
      icon: Building,
      color: 'text-dark-green-600',
    },
    {
      title: 'Monthly Revenue',
      value: '$45,230',
      change: '+8.5%',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Pending Issues',
      value: '23',
      change: '-5',
      icon: AlertTriangle,
      color: 'text-orange-600',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {stats.map((stat, index) => (
        <motion.div key={stat.title} variants={fadeInUp}>
          <Card hover className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${stat.color} bg-opacity-10`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <h3 className="text-2xl font-bold text-dark-green-800 mb-1">
              {stat.value}
            </h3>
            <p className="text-dark-green-600 mb-2">{stat.title}</p>
            <span className={`text-sm font-medium ${
              stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
            }`}>
              {stat.change} from last month
            </span>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default StatsCards;