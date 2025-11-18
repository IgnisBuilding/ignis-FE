'use client';
import { motion } from 'framer-motion';

export const DashboardCardSkeleton = () => (
  <div className="premium-card rounded-3xl p-7 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
        <div className="h-10 bg-gray-300 rounded w-16 mb-3"></div>
        <div className="h-1 bg-gray-200 rounded w-full"></div>
      </div>
      <div className="w-16 h-16 bg-gray-300 rounded-2xl"></div>
    </div>
  </div>
);

export const CardSkeleton = () => (
  <div className="premium-card rounded-3xl p-8 animate-pulse">
    <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
    <div className="space-y-4">
      <div className="h-14 bg-gray-200 rounded-xl"></div>
      <div className="h-14 bg-gray-200 rounded-xl"></div>
      <div className="h-14 bg-gray-200 rounded-xl"></div>
      <div className="h-14 bg-gray-200 rounded-xl"></div>
    </div>
  </div>
);

export const PageLoadingSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="min-h-screen cream-gradient py-8 px-4"
  >
    <div className="max-w-7xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-10 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="h-12 bg-gray-300 rounded w-64 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-48"></div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[1, 2, 3, 4].map((i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  </motion.div>
);
