"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface TourStep {
  id: string
  title: string
  description: string
  target?: string
}

interface TourContextType {
  isOpen: boolean
  currentPage: string
  currentStep: number
  tourCompleted: Record<string, boolean>
  openTour: (page: string) => void
  closeTour: () => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  completeTour: () => void
  setCurrentPage: (page: string) => void
  getTourSteps: (page: string) => TourStep[]
}

const tourStepsData: Record<string, TourStep[]> = {
  dashboard: [
    { id: "welcome", title: "Welcome to Ignis Command", description: "Experience the next generation of incident management. Our integrated sensor network provides real-time situational awareness for elite response teams." },
    { id: "stats", title: "Real-Time Statistics", description: "Monitor active alarms, personnel on-site, resource readiness, and average response times at a glance." },
    { id: "critical", title: "Critical Incidents", description: "Priority incidents are highlighted here with full details, severity levels, and quick response actions." },
    { id: "feed", title: "Active Incident Feed", description: "Track all ongoing incidents with status updates, resource assignments, and duration monitoring." },
  ],
  "live-map": [
    { id: "welcome", title: "Live Map Overview", description: "Get a bird's eye view of all active incidents, units, and resources across your coverage area." },
    { id: "incidents", title: "Active Incidents Panel", description: "View and prioritize incidents from the sidebar. Click any incident to see detailed tactical information." },
    { id: "markers", title: "Map Markers", description: "Fire incidents, unit positions, and station locations are displayed in real-time on the map." },
    { id: "layers", title: "Map Layers", description: "Toggle thermal heatmaps, hydrant networks, and floor plans to enhance situational awareness." },
  ],
  incident: [
    { id: "welcome", title: "3D Tactical View", description: "Advanced isometric visualization for multi-floor incident management and unit coordination." },
    { id: "floors", title: "Floor Navigation", description: "Switch between floors to track fire spread and unit positions. Use STACK mode to view multiple floors." },
    { id: "alerts", title: "Critical Alerts", description: "Real-time alerts appear here with recommended actions and safety trail updates." },
    { id: "intelligence", title: "Command Intelligence", description: "Monitor airstream integrity, stairwell pressurization, and unit tracking from the right panel." },
  ],
  personnel: [
    { id: "welcome", title: "Personnel Overview", description: "Access your entire team roster with real-time status updates and deployment information." },
    { id: "roster", title: "Personnel Roster", description: "View all available personnel with their current status, assigned unit, and certifications. Filter by role or certification to find the right team members." },
    { id: "deployment", title: "Deployment Status", description: "Track which personnel are currently deployed, on standby, or off duty. See deployment duration and respond to availability changes instantly." },
    { id: "communication", title: "Direct Communication", description: "Use the phone and message buttons to communicate directly with personnel in the field. Quick communication ensures coordinated response." },
  ],
  logistics: [
    { id: "welcome", title: "Logistics Overview", description: "Manage all equipment, vehicles, and supplies with real-time inventory tracking and maintenance scheduling." },
    { id: "equipment", title: "Equipment Inventory", description: "Track all equipment and vehicles with real-time status. See current location, maintenance schedule, and availability. Request equipment for incidents directly from this view." },
    { id: "supplies", title: "Supply Management", description: "Monitor critical supplies like oxygen tanks, hazmat containment kits, and rescue gear. Get alerts when supplies run low or require replenishment." },
    { id: "maintenance", title: "Maintenance Schedule", description: "Track maintenance history and upcoming maintenance windows. Schedule preventive maintenance to ensure equipment reliability during critical operations." },
  ],
  buildings: [
    { id: "welcome", title: "Building Safety Overview", description: "Access comprehensive safety data for all monitored buildings and facilities in your jurisdiction." },
    { id: "directory", title: "Safety Directory", description: "Browse the complete building safety directory with occupancy data, inspection history, and safety scores. Filter by district or building type." },
    { id: "filters", title: "Filter & Search", description: "Use the filter sidebar to narrow down buildings by district, status, or safety rating. Search by building name or address for quick access." },
    { id: "registration", title: "Facility Registration", description: "Register new buildings and facilities for safety monitoring. The system will track inspection schedules and compliance status automatically." },
  ],
  reports: [
    { id: "welcome", title: "Reports & Analytics", description: "Review comprehensive incident reports and performance analytics for data-driven decision making." },
    { id: "incidents", title: "Incident Reports", description: "View detailed reports for all completed incidents including response times, units deployed, and outcomes. Download full incident records for documentation." },
    { id: "analytics", title: "Performance Analytics", description: "Track key performance indicators like average response time, resource efficiency, and incident trends. Identify patterns and optimize response strategies." },
    { id: "export", title: "Report Export", description: "Generate and download incident reports, statistics, and analytics in multiple formats. Share reports with stakeholders and government agencies." },
  ],
  settings: [
    { id: "welcome", title: "Application Settings", description: "Customize your preferences to personalize your Ignis Command experience." },
    { id: "language", title: "Language Selection", description: "Switch between English and Urdu. Your preference will be saved and applied across the entire application." },
    { id: "notifications", title: "Notification Preferences", description: "Control how you receive incident alerts and system notifications for optimal workflow." },
    { id: "privacy", title: "Privacy Settings", description: "Manage your data and privacy preferences for the Ignis Command system." },
  ],
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [currentStep, setCurrentStep] = useState(0)
  const [tourCompleted, setTourCompleted] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("ignis-tour-completed")
    if (saved) {
      setTourCompleted(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    if (mounted && !tourCompleted[currentPage]) {
      const timer = setTimeout(() => {
        setIsOpen(true)
        setCurrentStep(0)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentPage, tourCompleted, mounted])

  const openTour = (page: string) => {
    setCurrentPage(page)
    setCurrentStep(0)
    setIsOpen(true)
  }

  const closeTour = () => {
    setIsOpen(false)
  }

  const nextStep = () => {
    const steps = tourStepsData[currentPage] || []
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTour()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipTour = () => {
    completeTour()
  }

  const completeTour = () => {
    const updated = { ...tourCompleted, [currentPage]: true }
    setTourCompleted(updated)
    localStorage.setItem("ignis-tour-completed", JSON.stringify(updated))
    setIsOpen(false)
  }

  const getTourSteps = (page: string) => {
    return tourStepsData[page] || []
  }

  return (
    <TourContext.Provider value={{
      isOpen,
      currentPage,
      currentStep,
      tourCompleted,
      openTour,
      closeTour,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
      setCurrentPage,
      getTourSteps,
    }}>
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    return {
      isOpen: false,
      currentPage: "",
      currentStep: 0,
      tourCompleted: {},
      openTour: () => {},
      closeTour: () => {},
      nextStep: () => {},
      prevStep: () => {},
      skipTour: () => {},
      completeTour: () => {},
      setCurrentPage: () => {},
      getTourSteps: () => [],
    }
  }
  return context
}
