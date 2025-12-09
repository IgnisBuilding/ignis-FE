'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bell, AlertTriangle, Info, CheckCircle, Filter, Search } from 'lucide-react';
import PageTransition from '@/components/shared/pageTransition';
import { fadeIn } from '@/lib/animations';
import { useAuth } from '../../../../context/AuthContext';
import { api } from '@/lib/api';
import { Alert } from '../../../../types';

export default function AlertsPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high' | 'critical'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || (role !== 'resident' && role !== 'manager')) {
      router.push('/login');
      return;
    }

    const fetchAlerts = async () => {
      try {
        const data = await api.getMyAlerts();
        setAlerts(data);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user, role, router]);

  const unreadCount = alerts.filter(a => !a.read).length;
  const criticalCount = alerts.filter(a => a.priority === 'critical').length;

  const handleMarkAsRead = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const handleMarkAllRead = () => {
    setAlerts(alerts.map(a => ({ ...a, read: true })));
  };

  if (!user || (role !== 'resident' && role !== 'manager')) return null;

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen cream-gradient flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-dark-green-600">Loading alerts...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'fire': return <AlertTriangle className="w-5 h-5" />;
      case 'smoke': return <AlertTriangle className="w-5 h-5" />;
      case 'maintenance': return <Info className="w-5 h-5" />;
      case 'info': return <Bell className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase()) || alert.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'unread' && !alert.read) || (filter === 'high' && alert.priority === 'high') || (filter === 'critical' && alert.priority === 'critical');
    return matchesSearch && matchesFilter;
  });

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeIn} initial="initial" animate="animate">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold gradient-text mb-2">Alerts & Notifications</h1>
                <p className="text-dark-green-600">Stay updated with important notifications</p>
              </div>
              <button onClick={handleMarkAllRead} className="px-6 py-3 green-gradient text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all">
                Mark All Read
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <motion.div variants={fadeIn} className="premium-card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-green-600 mb-1">Total Alerts</p>
                    <h3 className="text-3xl font-bold text-dark-green-800">{alerts.length}</h3>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Bell className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} className="premium-card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-green-600 mb-1">Unread</p>
                    <h3 className="text-3xl font-bold text-orange-600">{unreadCount}</h3>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Bell className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} className="premium-card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-green-600 mb-1">Critical</p>
                    <h3 className="text-3xl font-bold text-red-600">{criticalCount}</h3>
                  </div>
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="premium-card rounded-2xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-green-400 w-5 h-5" />
                  <input type="text" placeholder="Search alerts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border-2 border-dark-green-200 rounded-xl focus:border-dark-green-500 focus:outline-none" />
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setFilter('all')} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${filter === 'all' ? 'green-gradient text-white' : 'border-2 border-dark-green-200 text-dark-green-700 hover:bg-dark-green-50'}`}>
                    All
                  </button>
                  <button onClick={() => setFilter('unread')} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${filter === 'unread' ? 'bg-orange-500 text-white' : 'border-2 border-orange-200 text-orange-700 hover:bg-orange-50'}`}>
                    Unread
                  </button>
                  <button onClick={() => setFilter('high')} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${filter === 'high' ? 'bg-yellow-500 text-white' : 'border-2 border-yellow-200 text-yellow-700 hover:bg-yellow-50'}`}>
                    High
                  </button>
                  <button onClick={() => setFilter('critical')} className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${filter === 'critical' ? 'bg-red-500 text-white' : 'border-2 border-red-200 text-red-700 hover:bg-red-50'}`}>
                    Critical
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {filteredAlerts.length === 0 ? (
                <div className="premium-card rounded-2xl p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-dark-green-800 mb-2">No alerts found</h3>
                  <p className="text-dark-green-600">You're all caught up!</p>
                </div>
              ) : (
                filteredAlerts.map((alert, index) => (
                  <motion.div key={alert.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={`premium-card rounded-2xl p-6 border-l-4 ${getAlertColor(alert.priority)} ${!alert.read ? 'ring-2 ring-offset-2 ring-dark-green-300' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`p-3 rounded-xl ${alert.priority === 'critical' ? 'bg-red-200 text-red-700' : alert.priority === 'high' ? 'bg-orange-200 text-orange-700' : alert.priority === 'medium' ? 'bg-yellow-200 text-yellow-700' : 'bg-blue-200 text-blue-700'}`}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-bold text-dark-green-800 capitalize">{alert.type} Alert</h3>
                            {!alert.read && (
                              <span className="px-2 py-1 bg-dark-green-500 text-white text-xs font-semibold rounded-full">NEW</span>
                            )}
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${alert.priority === 'critical' ? 'bg-red-100 text-red-700' : alert.priority === 'high' ? 'bg-orange-100 text-orange-700' : alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                              {alert.priority.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-dark-green-700 mb-2">{alert.message}</p>
                          <p className="text-sm text-dark-green-500">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!alert.read && (
                        <button onClick={() => handleMarkAsRead(alert.id)} className="ml-4 px-4 py-2 bg-dark-green-100 text-dark-green-700 rounded-lg hover:bg-dark-green-200 transition-colors text-sm font-semibold">
                          Mark Read
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}

