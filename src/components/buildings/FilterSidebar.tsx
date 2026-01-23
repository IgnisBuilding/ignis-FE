"use client"

import { Button } from "@/components/ui/Button"

interface FilterSidebarProps {
  selectedFilters: string[]
  onFilterChange: (filters: string[]) => void
}

export function FilterSidebar({ selectedFilters, onFilterChange }: FilterSidebarProps) {
  const filterCategories = [
    {
      title: "Area Districts",
      icon: "📍",
      options: ["North District", "South District", "East District", "West District"],
    },
    {
      title: "Risk Priority",
      icon: "⚠️",
      options: ["High Risk", "Medium Risk", "Low Risk"],
    },
    {
      title: "Occupancy Range",
      icon: "👥",
      options: ["0-100", "100-500", "500-1000", "1000+"],
    },
    {
      title: "Structure Type",
      icon: "🏢",
      options: ["Residential", "Commercial", "Industrial", "Mixed Use"],
    },
    {
      title: "Status",
      icon: "📋",
      options: ["Certified", "Pending", "At Risk", "Review Required"],
    },
  ]

  const savedViews = [
    { name: "Residential Buildings", count: 12 },
    { name: "Recent Additions", count: 4 },
  ]

  const handleClearFilters = () => {
    onFilterChange([])
  }

  return (
    <div className="w-48 md:w-64 space-y-4 md:space-y-6 border-r border-border bg-card p-3 md:p-6 overflow-y-auto hidden md:block">
      <div>
        <h2 className="text-xs md:text-sm font-bold text-foreground">DIRECTORY FILTERS</h2>
        <p className="text-xs text-muted-foreground">Refine buildings list</p>
      </div>

      <div className="space-y-3">
        {filterCategories.map(category => (
          <Button
            key={category.title}
            variant="outline"
            className="w-full justify-start gap-2 rounded-lg border-0 bg-secondary px-4 py-2 text-foreground hover:bg-[#1f3d2f] hover:text-white"
          >
            <span>{category.icon}</span>
            {category.title}
          </Button>
        ))}
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <h3 className="text-xs font-bold tracking-wide text-muted-foreground">SAVED VIEWS</h3>
        {savedViews.map(view => (
          <div key={view.name} className="flex items-center justify-between text-sm">
            <button className="text-foreground hover:text-[#1f3d2f]">{view.name}</button>
            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
              {String(view.count).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full justify-start gap-2 border border-border bg-transparent"
        onClick={handleClearFilters}
      >
        ✕ CLEAR FILTERS
      </Button>
    </div>
  )
}
