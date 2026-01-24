"use client"

import { Button } from "@/components/ui/button"
import { useTour } from "@/providers/TourProvider"
import { Radio, Shield, Server, ArrowRight } from "lucide-react"

const stepLabels = ["IDENTIFY", "PRIORITIZE", "RESPOND"]

export function WelcomeModal() {
  const { isOpen, currentStep, nextStep, skipTour, getTourSteps, currentPage } = useTour()

  const steps = getTourSteps(currentPage)
  const step = steps[currentStep]

  if (!isOpen || !step) return null

  const isWelcomeStep = currentStep === 0

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-[#d4d9d4]/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-card p-8 shadow-2xl">
        {isWelcomeStep ? (
          <>
            {/* Network Illustration */}
            <div className="mb-8 flex justify-center">
              <div className="relative rounded-xl bg-[#f0f2f0] px-16 py-10">
                {/* Connection lines (dashed) */}
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 120">
                  {/* Top node connections */}
                  <circle cx="150" cy="20" r="8" fill="#c5ccc5" />

                  {/* Left diagonal line */}
                  <line x1="80" y1="55" x2="130" y2="35" stroke="#a0a8a0" strokeWidth="1.5" strokeDasharray="4,4" />
                  {/* Right diagonal line */}
                  <line x1="170" y1="35" x2="220" y2="55" stroke="#a0a8a0" strokeWidth="1.5" strokeDasharray="4,4" />

                  {/* Bottom left node */}
                  <circle cx="60" cy="85" r="8" fill="#c5ccc5" />
                  {/* Bottom right node */}
                  <circle cx="240" cy="85" r="8" fill="#c5ccc5" />

                  {/* Left vertical connection */}
                  <line x1="80" y1="70" x2="70" y2="80" stroke="#a0a8a0" strokeWidth="1.5" strokeDasharray="4,4" />
                  {/* Right vertical connection */}
                  <line x1="220" y1="70" x2="230" y2="80" stroke="#a0a8a0" strokeWidth="1.5" strokeDasharray="4,4" />

                  {/* Bottom horizontal connections */}
                  <line x1="100" y1="95" x2="130" y2="95" stroke="#a0a8a0" strokeWidth="1.5" strokeDasharray="4,4" />
                  <line x1="170" y1="95" x2="200" y2="95" stroke="#a0a8a0" strokeWidth="1.5" strokeDasharray="4,4" />

                  {/* Bottom center nodes */}
                  <circle cx="120" cy="100" r="6" fill="#c5ccc5" />
                  <circle cx="180" cy="100" r="6" fill="#c5ccc5" />
                </svg>

                {/* Icons */}
                <div className="relative flex items-end justify-center gap-12">
                  {/* Satellite */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1f3d2f]">
                      <Radio className="h-6 w-6 text-white" />
                    </div>
                    <span className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Satellite</span>
                  </div>

                  {/* Neural Link (center, elevated) */}
                  <div className="-mt-6 flex flex-col items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#1f3d2f] bg-card">
                      <Shield className="h-7 w-7 text-[#1f3d2f]" />
                    </div>
                    <span className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-foreground">Neural Link</span>
                  </div>

                  {/* Ground Cell */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1f3d2f]">
                      <Server className="h-6 w-6 text-white" />
                    </div>
                    <span className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ground Cell</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Title and Description */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground">{step.title}</h2>
              <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="mt-8 flex items-center justify-center gap-4">
              {stepLabels.map((label, idx) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${idx === 0 ? "bg-[#1f3d2f]" : "bg-muted"}`} />
                    <span className={`text-xs font-semibold uppercase tracking-wider ${idx === 0 ? "text-foreground" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </div>
                  {idx < stepLabels.length - 1 && (
                    <div className="mb-5 h-px w-16 bg-muted" />
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={skipTour}
                className="text-sm font-medium text-foreground hover:text-muted-foreground"
              >
                Skip Tour
              </button>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="px-6 bg-transparent">
                  Learn More
                </Button>
                <Button onClick={nextStep} className="gap-2 bg-[#1f3d2f] px-6 text-white hover:bg-[#2a4f3d]">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Feature Step */}
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1f3d2f]">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{step.title}</h2>
              <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>

            {/* Progress Dots */}
            <div className="mt-8 flex justify-center gap-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 w-2 rounded-full transition-colors ${idx === currentStep ? "bg-[#1f3d2f]" : "bg-muted"}`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={skipTour}
                className="text-sm font-medium text-foreground hover:text-muted-foreground"
              >
                Skip Tour
              </button>
              <Button onClick={nextStep} className="gap-2 bg-[#1f3d2f] px-8 text-white hover:bg-[#2a4f3d]">
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
