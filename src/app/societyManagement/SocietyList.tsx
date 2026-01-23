'use client';

import { useState, useTransition, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Building2, Users, MapPin } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/shared/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { deleteSociety, type Society } from '@/app/actions/societies';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface Props {
  initialSocieties: Society[];
}

const SocietyCard = memo(({ society, onDelete, isPending }: { 
  society: Society; 
  onDelete: (id: string) => void;
  isPending: boolean;
}) => (
  <Card hover>
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-dark-green-800 mb-2">
            {society.name}
          </h3>
          <div className="flex items-center text-dark-green-600 text-sm mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            {society.address}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          society.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {society.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-dark-green-500" />
          <div>
            <p className="text-sm text-dark-green-600">Buildings</p>
            <p className="text-lg font-semibold text-dark-green-800">
              {society.totalBuildings}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-dark-green-500" />
          <div>
            <p className="text-sm text-dark-green-600">Residents</p>
            <p className="text-lg font-semibold text-dark-green-800">
              {society.totalResidents}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-cream-200">
        <Button variant="primary" size="sm" className="flex-1">
          View Details
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onDelete(society.id)}
          disabled={isPending}
        >
          Delete
        </Button>
      </div>
    </div>
  </Card>
));

SocietyCard.displayName = 'SocietyCard';

export default function SocietyList({ initialSocieties }: Props) {
  const [societies, setSocieties] = useState(initialSocieties);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();

  const filteredSocieties = societies.filter(society =>
    society.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    society.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = useCallback(async (id: string) => {
    // Optimistic update - remove from UI immediately
    const previousSocieties = societies;
    setSocieties(societies.filter(s => s.id !== id));

    // Call server action in background
    startTransition(async () => {
      try {
        await deleteSociety(id);
      } catch (error) {
        // Rollback on error
        console.error('Failed to delete society:', error);
        setSocieties(previousSocieties);
      }
    });
  }, [societies]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Search and Actions */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex-1 relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-green-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search societies..."
            className="pl-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Society
        </Button>
      </motion.div>

      {/* Societies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSocieties.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-dark-green-600 text-lg">No societies found</p>
          </div>
        ) : (
          filteredSocieties.map((society) => (
            <SocietyCard
              key={society.id}
              society={society}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))
        )}
      </div>

      {/* Loading Indicator */}
      {isPending && (
        <div className="fixed bottom-4 right-4 bg-dark-green-800 text-white px-4 py-2 rounded-lg shadow-lg">
          Updating...
        </div>
      )}
    </motion.div>
  );
}
