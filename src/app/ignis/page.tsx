'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Users, MapPin } from 'lucide-react';
import PageTransition from '@/components/shared/pageTransition';
import Button from '@/components/shared/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { fadeInUp, slideInFromLeft, staggerContainer } from '@/lib/animations';

export default function SocietyManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const societies = [
    {
      id: 1,
      name: 'Green Valley Apartments',
      address: '123 Main Street, City Center',
      totalUnits: 120,
      occupiedUnits: 95,
      status: 'active',
    },
    {
      id: 2,
      name: 'Sunset Residency',
      address: '456 Oak Avenue, Downtown',
      totalUnits: 80,
      occupiedUnits: 72,
      status: 'active',
    },
    {
      id: 3,
      name: 'Royal Heights',
      address: '789 Pine Road, Suburbs',
      totalUnits: 200,
      occupiedUnits: 180,
      status: 'inactive',
    },
  ];

  const sidebarItems = [
    { label: 'All Societies', active: true },
    { label: 'Active', count: 2 },
    { label: 'Inactive', count: 1 },
    { label: 'Under Construction', count: 0 },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient">
        <div className="flex">
          {/* Sidebar */}
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: sidebarOpen ? 0 : -250 }}
            transition={{ duration: 0.3 }}
            className="w-64 bg-white shadow-lg h-screen sticky top-16"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-dark-green-800 mb-6">
                Society Management
              </h2>
              <nav className="space-y-2">
                {sidebarItems.map((item) => (
                  <motion.div
                    key={item.label}
                    whileHover={{ x: 5 }}
                    className={`px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                      item.active
                        ? 'bg-dark-green-100 text-dark-green-800'
                        : 'text-dark-green-600 hover:bg-cream-100'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{item.label}</span>
                      {item.count !== undefined && (
                        <span className="text-sm bg-cream-200 text-dark-green-600 px-2 py-1 rounded-full">
                          {item.count}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </nav>
            </div>
          </motion.aside>

          {/* Main Content */}
          <div className="flex-1 p-8">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {/* Header */}
              <motion.div variants={fadeInUp} className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-dark-green-800">
                    Society Management
                  </h1>
                  <p className="text-dark-green-600 mt-2">
                    Manage all your residential societies
                  </p>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Society
                </Button>
              </motion.div>

              {/* Search and Filters */}
              <motion.div variants={fadeInUp} className="flex space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-green-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search societies..."
                    className="pl-11"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline">Filter</Button>
              </motion.div>

              {/* Societies Grid */}
              <motion.div
                variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {societies.map((society) => (
                  <motion.div key={society.id} variants={fadeInUp}>
                    <Card hover className="relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          society.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {society.status}
                        </div>
                        <div className="flex space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-dark-green-600 hover:text-dark-green-800"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold text-dark-green-800 mb-2">
                        {society.name}
                      </h3>

                      <div className="flex items-center text-dark-green-600 mb-4">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="text-sm">{society.address}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-dark-green-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span className="text-sm">
                            {society.occupiedUnits}/{society.totalUnits} units
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-dark-green-600">Occupancy</div>
                          <div className="text-lg font-semibold text-dark-green-800">
                            {Math.round((society.occupiedUnits / society.totalUnits) * 100)}%
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="w-full bg-cream-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(society.occupiedUnits / society.totalUnits) * 100}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="bg-dark-green-500 h-2 rounded-full"
                          />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}