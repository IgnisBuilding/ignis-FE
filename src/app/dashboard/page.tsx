'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Home,
  Thermometer,
  Zap,
  Shield
} from 'lucide-react';
import PageTransition from '@/components/shared/pageTransition';
import { Card } from '@/components/ui/Card';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down';
}

const StatCard = ({ title, value, change, icon, trend }: StatCardProps) => (
  <Card>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-dark-green-600 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-dark-green-800">{value}</h3>
        <p className={`text-sm mt-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </p>
      </div>
      <div className="p-3 bg-cream-100 rounded-lg">
        {icon}
      </div>
    </div>
  </Card>
);

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-6"
          >
            {/* Header */}
            <motion.div variants={fadeInUp} className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-dark-green-800 mb-2">
                  Dashboard
                </h1>
                <p className="text-dark-green-600">
                  Welcome back! Heres whats happening with your building.
                </p>
              </div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-dark-green-500"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </motion.div>

            {/* Stats Grid */}
            <motion.div 
              variants={fadeInUp}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <StatCard
                title="Total Residents"
                value="248"
                change="+12% this month"
                icon={<Users className="w-6 h-6 text-dark-green-600" />}
                trend="up"
              />
              <StatCard
                title="Active Sensors"
                value="142"
                change="98% operational"
                icon={<Activity className="w-6 h-6 text-dark-green-600" />}
                trend="up"
              />
              <StatCard
                title="Active Alerts"
                value="3"
                change="-2 from yesterday"
                icon={<AlertTriangle className="w-6 h-6 text-yellow-600" />}
                trend="down"
              />
              <StatCard
                title="System Health"
                value="99.2%"
                change="+0.3% uptime"
                icon={<TrendingUp className="w-6 h-6 text-green-600" />}
                trend="up"
              />
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={fadeInUp}>
              <h2 className="text-2xl font-bold text-dark-green-800 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card hover className="cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-cream-100 rounded-lg">
                      <Home className="w-5 h-5 text-dark-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-dark-green-800">Buildings</p>
                      <p className="text-sm text-dark-green-600">Manage properties</p>
                    </div>
                  </div>
                </Card>

                <Card hover className="cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-cream-100 rounded-lg">
                      <Thermometer className="w-5 h-5 text-dark-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-dark-green-800">Sensors</p>
                      <p className="text-sm text-dark-green-600">Monitor devices</p>
                    </div>
                  </div>
                </Card>

                <Card hover className="cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-cream-100 rounded-lg">
                      <Zap className="w-5 h-5 text-dark-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-dark-green-800">Alerts</p>
                      <p className="text-sm text-dark-green-600">View notifications</p>
                    </div>
                  </div>
                </Card>

                <Card hover className="cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-cream-100 rounded-lg">
                      <Shield className="w-5 h-5 text-dark-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-dark-green-800">Emergency</p>
                      <p className="text-sm text-dark-green-600">Safety protocols</p>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={fadeInUp}>
              <h2 className="text-2xl font-bold text-dark-green-800 mb-4">
                Recent Activity
              </h2>
              <Card>
                <div className="space-y-4">
                  {[
                    {
                      action: 'New sensor installed in Building A',
                      time: '2 hours ago',
                      type: 'success'
                    },
                    {
                      action: 'System maintenance completed',
                      time: '5 hours ago',
                      type: 'info'
                    },
                    {
                      action: 'Alert resolved: Smoke detector battery low',
                      time: '1 day ago',
                      type: 'success'
                    },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-cream-200 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <p className="text-dark-green-700">{activity.action}</p>
                      </div>
                      <p className="text-sm text-dark-green-600">{activity.time}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
