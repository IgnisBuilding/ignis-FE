'use client';

import { useState, memo } from 'react';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';

interface OccupantFilterPanelProps {
  onFilterChange?: (filters: OccupantFilters) => void;
  compact?: boolean; // Compact/mobile mode
}

export interface OccupantFilters {
  showEvacuees: boolean;
  showFirefighters: boolean;
  showAdmins: boolean;
  showOther: boolean;
}

/**
 * Filter panel for occupant display on evacuation map
 * Allows user to toggle visibility of different occupant types by role
 * 
 * Features:
 * - Toggle buttons for each role type
 * - Compact mode for mobile devices
 * - Persistent filter state (can be stored in localStorage)
 * - Visual indicators for active filters
 */
export const OccupantFilterPanel = memo(({
  onFilterChange,
  compact = false,
}: OccupantFilterPanelProps) => {
  const [filters, setFilters] = useState<OccupantFilters>({
    showEvacuees: true,
    showFirefighters: true,
    showAdmins: true,
    showOther: true,
  });

  const [isExpanded, setIsExpanded] = useState(!compact);

  const handleFilterToggle = (key: keyof OccupantFilters) => {
    const newFilters = { ...filters, [key]: !filters[key] };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;
  const totalFilters = Object.keys(filters).length;

  const filterOptions = [
    {
      key: 'showEvacuees' as const,
      label: '👥 Evacuees',
      color: 'bg-blue-500',
      description: 'People evacuating the building',
    },
    {
      key: 'showFirefighters' as const,
      label: '🚒 Firefighters',
      color: 'bg-red-500',
      description: 'Emergency responders',
    },
    {
      key: 'showAdmins' as const,
      label: '👨‍💼 Admins',
      color: 'bg-purple-500',
      description: 'Building administrators',
    },
    {
      key: 'showOther' as const,
      label: '👤 Others',
      color: 'bg-gray-500',
      description: 'Other personnel',
    },
  ];

  return (
    <div className="occupant-filter-panel">
      {/* Header with toggle */}
      {compact ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="fixed bottom-20 right-4 z-40 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
          title="Toggle occupant filters"
        >
          <Eye className="w-5 h-5 text-gray-700" />
          {activeFiltersCount < totalFilters && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {totalFilters - activeFiltersCount}
            </span>
          )}
        </button>
      ) : null}

      {/* Filter panel */}
      {isExpanded && (
        <div className={`
          ${compact
            ? 'fixed bottom-24 right-4 z-40 bg-white rounded-lg shadow-xl border border-gray-200 w-64'
            : 'bg-white rounded-lg shadow-md border border-gray-200 p-4'
          }
        `}>
          <div className={compact ? 'p-4' : ''}>
            {/* Panel title */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Occupants
              </h3>
              {compact && (
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ChevronDown className="w-4 h-4 rotate-180" />
                </button>
              )}
            </div>

            {/* Filter options */}
            <div className="space-y-2">
              {filterOptions.map(({ key, label, description }) => (
                <label
                  key={key}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters[key]}
                    onChange={() => handleFilterToggle(key)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-700">{label}</div>
                    <div className="text-xs text-gray-500">{description}</div>
                  </div>
                  {filters[key] ? (
                    <Eye className="w-4 h-4 text-green-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </label>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-600">
              Showing {activeFiltersCount} of {totalFilters} occupant types
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

OccupantFilterPanel.displayName = 'OccupantFilterPanel';
