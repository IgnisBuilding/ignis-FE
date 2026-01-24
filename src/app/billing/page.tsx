'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Eye, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import PageTransition from '@/components/shared/pageTransition';
import Button from '@/components/shared/Button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { fadeInUp, staggerContainer } from '@/lib/animations';

export default function BillingPage() {
  const [filter, setFilter] = useState('all');

  const bills = [
    {
      id: 'INV-001',
      description: 'Monthly Maintenance Fee - January 2024',
      amount: 250,
      dueDate: '2024-01-31',
      status: 'paid',
      paidDate: '2024-01-15',
    },
    {
      id: 'INV-002',
      description: 'Swimming Pool Maintenance',
      amount: 75,
      dueDate: '2024-02-15',
      status: 'pending',
    },
    {
      id: 'INV-003',
      description: 'Parking Fee - February 2024',
      amount: 50,
      dueDate: '2024-02-01',
      status: 'overdue',
    },
    {
      id: 'INV-004',
      description: 'Security Services',
      amount: 120,
      dueDate: '2024-02-28',
      status: 'pending',
    },
    {
      id: 'INV-005',
      description: 'Gym Equipment Maintenance',
      amount: 200,
      dueDate: '2024-01-20',
      status: 'paid',
      paidDate: '2024-01-18',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <DollarSign className="w-4 h-4" />;
      case 'pending':
        return <Calendar className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredBills = filter === 'all' ? bills : bills.filter(bill => bill.status === filter);

  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const paidAmount = bills.filter(bill => bill.status === 'paid').reduce((sum, bill) => sum + bill.amount, 0);
  const pendingAmount = bills.filter(bill => bill.status === 'pending').reduce((sum, bill) => sum + bill.amount, 0);
  const overdueAmount = bills.filter(bill => bill.status === 'overdue').reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-8"
          >
            {/* Header */}
            <motion.div variants={fadeInUp}>
              <h1 className="text-4xl font-bold text-dark-green-800 mb-4">
                Billing & Payments
              </h1>
              <p className="text-dark-green-600 text-lg">
                Manage invoices, payments, and financial records
              </p>
            </motion.div>

            {/* Summary Cards */}
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
              {[
                { label: 'Total Amount', value: `${totalAmount}`, color: 'text-blue-600', bgColor: 'bg-blue-50' },
                { label: 'Paid', value: `${paidAmount}`, color: 'text-green-600', bgColor: 'bg-green-50' },
                { label: 'Pending', value: `${pendingAmount}`, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
                { label: 'Overdue', value: `${overdueAmount}`, color: 'text-red-600', bgColor: 'bg-red-50' },
              ].map((stat) => (
                <motion.div key={stat.label} variants={fadeInUp}>
                  <Card hover>
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                      <DollarSign className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-dark-green-800 mb-1">
                      {stat.value}
                    </h3>
                    <p className="text-dark-green-600">{stat.label}</p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Filters and Search */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-green-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search bills..."
                  className="pl-11"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-dark-green-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </motion.div>

            {/* Bills Table */}
            <motion.div variants={fadeInUp}>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-cream-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-dark-green-700">
                          Invoice ID
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-dark-green-700">
                          Description
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-dark-green-700">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-dark-green-700">
                          Due Date
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-dark-green-700">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-dark-green-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-200">
                      {filteredBills.map((bill, index) => (
                        <motion.tr
                          key={bill.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="hover:bg-cream-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-dark-green-800">
                            {bill.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-dark-green-700">
                            {bill.description}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-dark-green-800">
                            ${bill.amount}
                          </td>
                          <td className="px-6 py-4 text-sm text-dark-green-700">
                            {new Date(bill.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}
                            >
                              {getStatusIcon(bill.status)}
                              <span className="capitalize">{bill.status}</span>
                            </motion.div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="text-dark-green-600 hover:text-dark-green-800"
                              >
                                <Eye className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="text-dark-green-600 hover:text-dark-green-800"
                              >
                                <Download className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={fadeInUp}>
              <Card>
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-dark-green-800 mb-2">
                      Need Help?
                    </h3>
                    <p className="text-dark-green-600">
                      Contact our billing support team for assistance with payments or invoices.
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 space-x-2">
                    <Button variant="outline">Contact Support</Button>
                    <Button>Make Payment</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}