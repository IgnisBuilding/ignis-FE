'use client';
import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, Search } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Alert } from '@/types';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Notification } from '@/providers/NotificationProvider';

interface DisplayAlert {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  priority: string;
  read: boolean;
  source: 'alert' | 'notification';
  notificationId?: number;
}

export default function AlertsPage() {
  const { user, role, dashboardRole, roleTitle } = useAuth();
  const [alerts, setAlerts] = useState<DisplayAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high' | 'critical'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user && role === 'resident') {
      const fetchData = async () => {
        try {
          // Fetch alerts and notifications in parallel
          const [alertsData, notificationsResponse] = await Promise.all([
            api.getMyAlerts().catch(() => [] as Alert[]),
            api.get<Notification[]>('/notifications/my').catch(() => ({ data: [] as Notification[] })),
          ]);

          // Map alerts to display shape
          const displayAlerts: DisplayAlert[] = (alertsData || []).map((a: Alert) => ({
            id: `alert-${a.id}`,
            type: a.type,
            message: a.message,
            timestamp: new Date(a.timestamp),
            priority: a.priority,
            read: a.read,
            source: 'alert' as const,
          }));

          // Map notifications to display shape
          const notifs = notificationsResponse.data || [];
          const displayNotifications: DisplayAlert[] = notifs.map((n: Notification) => ({
            id: `notif-${n.id}`,
            type: n.type === 'error' ? 'fire' : n.type === 'warning' ? 'smoke' : n.type === 'info' ? 'info' : 'info',
            message: `${n.title}: ${n.message}`,
            timestamp: new Date(n.createdAt),
            priority: n.priority || 'medium',
            read: n.status === 'read',
            source: 'notification' as const,
            notificationId: n.id,
          }));

          // Combine and sort by timestamp (newest first)
          const combined = [...displayAlerts, ...displayNotifications].sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
          );

          setAlerts(combined);
        } catch (error) {
          console.error('Failed to fetch alerts:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, role]);

  const unreadCount = alerts.filter(a => !a.read).length;
  const criticalCount = alerts.filter(a => a.priority === 'critical').length;

  const handleMarkAsRead = async (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (alert?.source === 'notification' && alert.notificationId) {
      try {
        await api.patch(`/notifications/${alert.notificationId}/read`);
      } catch {
        // continue with optimistic update
      }
    }
    setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const handleMarkAllRead = async () => {
    // Mark notification-source items on backend
    try {
      await api.patch('/notifications/read-all');
    } catch {
      // continue with optimistic update
    }
    setAlerts(alerts.map(a => ({ ...a, read: true })));
  };

  if (!user || role !== 'resident') return null;

  if (loading) {
    return (
      <DashboardLayout role={dashboardRole} userName={user?.name || 'Resident'} userTitle={roleTitle}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1f3d2f]"></div>
        </div>
      </DashboardLayout>
    );
  }

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
    <DashboardLayout role={dashboardRole} userName={user?.name || 'Resident'} userTitle={roleTitle}>
      <div className="flex-1 space-y-4 sm:space-y-6 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-none">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center w-full">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Alerts & Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'Stay updated with important notifications'}
            </p>
          </div>
          <Button
            onClick={handleMarkAllRead}
            className="bg-[#1f3d2f] text-white hover:bg-[#2a4f3d]"
            disabled={unreadCount === 0}
          >
            Mark All Read
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Alerts</p>
                  <h3 className="text-2xl font-bold text-foreground">{alerts.length}</h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Unread</p>
                  <h3 className="text-2xl font-bold text-orange-600">{unreadCount}</h3>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Bell className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Critical</p>
                  <h3 className="text-2xl font-bold text-red-600">{criticalCount}</h3>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
              className={filter === 'all' ? 'bg-[#1f3d2f] text-white hover:bg-[#2a4f3d]' : ''}
            >
              All
            </Button>
            <Button
              onClick={() => setFilter('unread')}
              variant={filter === 'unread' ? 'default' : 'outline'}
              className={filter === 'unread' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'text-orange-600 border-orange-200 hover:bg-orange-50'}
            >
              Unread
            </Button>
            <Button
              onClick={() => setFilter('high')}
              variant={filter === 'high' ? 'default' : 'outline'}
              className={filter === 'high' ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'text-yellow-600 border-yellow-200 hover:bg-yellow-50'}
            >
              High
            </Button>
            <Button
              onClick={() => setFilter('critical')}
              variant={filter === 'critical' ? 'default' : 'outline'}
              className={filter === 'critical' ? 'bg-red-500 text-white hover:bg-red-600' : 'text-red-600 border-red-200 hover:bg-red-50'}
            >
              Critical
            </Button>
          </div>
        </div>

        {/* Alerts List */}
        <Card className="w-full max-w-none">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              {filter === 'all' ? 'All Alerts' : filter === 'unread' ? 'Unread Alerts' : filter === 'high' ? 'High Priority Alerts' : 'Critical Alerts'}
            </CardTitle>
          </CardHeader>
          <CardContent className="w-full">
            {filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No alerts found</h3>
                <p className="text-sm text-muted-foreground">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3 w-full">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex flex-col items-start gap-4 sm:items-center sm:flex-row sm:justify-between p-3 sm:p-4 rounded-lg hover:bg-muted/20 transition-colors border border-border w-full ${!alert.read ? 'bg-muted/10 border-l-4 border-l-[#1f3d2f]' : ''}`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${alert.priority === 'critical' ? 'bg-red-100 text-red-700' : alert.priority === 'high' ? 'bg-orange-100 text-orange-700' : alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-foreground capitalize">{alert.type} Alert</span>
                          {!alert.read && (
                            <Badge className="bg-[#1f3d2f] text-white text-xs">NEW</Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-xs ${alert.priority === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : alert.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' : alert.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                          >
                            {alert.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!alert.read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="flex-shrink-0"
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
