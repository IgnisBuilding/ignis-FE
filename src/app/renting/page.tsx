'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Calendar, MapPin, Star, Clock } from 'lucide-react';
import PageTransition from '@/components/shared/pageTransition';
import Button from '@/components/shared/Button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { fadeInUp, staggerContainer } from '@/lib/animations';

export default function RentingPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const rentalItems = [
    {
      id: 1,
      name: 'Community Hall',
      description: 'Spacious hall perfect for events, parties, and gatherings',
      price: 150,
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&w=400&q=80',
      rating: 4.8,
      capacity: 100,
      available: true,
      nextAvailable: null,
    },
    {
      id: 2,
      name: 'Swimming Pool Area',
      description: 'Private pool area rental for exclusive events',
      price: 200,
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&w=400&q=80',
      rating: 4.9,
      capacity: 50,
      available: false,
      nextAvailable: '2024-02-15',
    },
    {
      id: 3,
      name: 'BBQ Grill Station',
      description: 'Outdoor grilling station with all equipment included',
      price: 75,
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&w=400&q=80',
      rating: 4.6,
      capacity: 20,
      available: true,
      nextAvailable: null,
    },
    {
      id: 4,
      name: 'Gym Equipment Set',
      description: 'Portable gym equipment for personal training sessions',
      price: 50,
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&w=400&q=80',
      rating: 4.4,
      capacity: 10,
      available: true,
      nextAvailable: null,
    },
    {
      id: 5,
      name: 'Garden Gazebo',
      description: 'Beautiful garden gazebo for intimate gatherings',
      price: 100,
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&w=400&q=80',
      rating: 4.7,
      capacity: 25,
      available: true,
      nextAvailable: null,
    },
    {
      id: 6,
      name: 'Party Equipment Package',
      description: 'Complete party setup with tables, chairs, and decorations',
      price: 125,
      image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-4.0.3&w=400&q=80',
      rating: 4.5,
      capacity: 75,
      available: false,
      nextAvailable: '2024-02-20',
    },
  ];

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
            <motion.div variants={fadeInUp} className="text-center">
              <h1 className="text-4xl font-bold text-dark-green-800 mb-4">
                Equipment & Facility Rental
              </h1>
              <p className="text-dark-green-600 text-lg max-w-2xl mx-auto">
                Book community facilities and equipment for your events and activities
              </p>
            </motion.div>

            {/* Search and Filters */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-green-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search facilities and equipment..."
                  className="pl-11"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Availability
                </Button>
                <div className="flex border border-cream-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 text-sm transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-dark-green-500 text-white' 
                        : 'text-dark-green-600 hover:bg-cream-100'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 text-sm transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-dark-green-500 text-white' 
                        : 'text-dark-green-600 hover:bg-cream-100'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Rental Items Grid/List */}
            <motion.div
              variants={staggerContainer}
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {rentalItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  variants={fadeInUp}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  {viewMode === 'grid' ? (
                    <Card hover className="overflow-hidden group">
                      <div className="relative">
                        <motion.img
                          whileHover={{ scale: 1.05 }}
                          src={item.image}
                          alt={item.name}
                          className="w-full h-48 object-cover transition-transform duration-300"
                        />
                        <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium ${
                          item.available 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.available ? 'Available' : 'Booked'}
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-semibold text-dark-green-800 group-hover:text-dark-green-600 transition-colors">
                            {item.name}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-dark-green-600">{item.rating}</span>
                          </div>
                        </div>
                        
                        <p className="text-dark-green-600 text-sm mb-4 line-clamp-2">
                          {item.description}
                        </p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-2xl font-bold text-dark-green-800">
                            ${item.price}
                            <span className="text-sm font-normal text-dark-green-600">/day</span>
                          </div>
                          <div className="flex items-center text-dark-green-600">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span className="text-sm">Capacity: {item.capacity}</span>
                          </div>
                        </div>
                        
                        {!item.available && item.nextAvailable && (
                          <div className="flex items-center text-orange-600 text-sm mb-4">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>Next available: {new Date(item.nextAvailable).toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        <Button 
                          className="w-full" 
                          variant={item.available ? 'primary' : 'outline'}
                          disabled={!item.available}
                        >
                          {item.available ? 'Book Now' : 'Join Waitlist'}
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Card hover className="group">
                      <div className="flex items-center space-x-6">
                        <motion.img
                          whileHover={{ scale: 1.05 }}
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-dark-green-800 group-hover:text-dark-green-600 transition-colors">
                              {item.name}
                            </h3>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.available 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.available ? 'Available' : 'Booked'}
                            </div>
                          </div>
                          
                          <p className="text-dark-green-600 text-sm mb-2">
                            {item.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-dark-green-600">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                              <span>{item.rating}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span>Capacity: {item.capacity}</span>
                            </div>
                            <div className="font-semibold text-dark-green-800">
                              ${item.price}/day
                            </div>
                          </div>
                          
                          {!item.available && item.nextAvailable && (
                            <div className="flex items-center text-orange-600 text-sm mt-2">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>Next available: {new Date(item.nextAvailable).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-shrink-0">
                          <Button 
                            variant={item.available ? 'primary' : 'outline'}
                            disabled={!item.available}
                          >
                            {item.available ? 'Book Now' : 'Join Waitlist'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                </motion.div>
              ))}
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-dark-green-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <h3 className="text-3xl font-bold text-dark-green-800 mb-2">
                      {rentalItems.filter(item => item.available).length}
                    </h3>
                    <p className="text-dark-green-600">Available Now</p>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-dark-green-800 mb-2">
                      ${Math.min(...rentalItems.map(item => item.price))}
                    </h3>
                    <p className="text-dark-green-600">Starting From</p>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-dark-green-800 mb-2">
                      {Math.max(...rentalItems.map(item => item.capacity))}
                    </h3>
                    <p className="text-dark-green-600">Max Capacity</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* CTA Section */}
            <motion.div variants={fadeInUp}>
              <Card className="text-center">
                <h3 className="text-2xl font-semibold text-dark-green-800 mb-4">
                  Need Something Custom?
                </h3>
                <p className="text-dark-green-600 mb-6 max-w-2xl mx-auto">
                  Can't find what you're looking for? Contact our team to discuss custom rental 
                  options and special arrangements for your event.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg">Contact Support</Button>
                  <Button variant="outline" size="lg">View Calendar</Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}