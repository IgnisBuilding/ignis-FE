"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HelpCircle, X, ChevronRight, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureGuide {
  id: string
  title: string
  description: string
  icon?: React.ReactNode
}

interface FeatureGuideModalProps {
  features: FeatureGuide[]
  isOpen: boolean
  onClose: () => void
  title: string
}

export function FeatureGuideModal({ features, isOpen, onClose, title }: FeatureGuideModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!isOpen) return null

  const currentFeature = features[currentIndex]

  const handleNext = () => {
    if (currentIndex < features.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      onClose()
      setCurrentIndex(0)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-md border-0 shadow-2xl">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-[#1f3d2f] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <HelpCircle className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-white">{title}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Feature {currentIndex + 1} of {features.length}
            </div>
            <h3 className="mb-3 text-xl font-bold text-foreground">{currentFeature.title}</h3>
            <p className="leading-relaxed text-muted-foreground">{currentFeature.description}</p>

            {/* Progress dots */}
            <div className="mt-6 flex justify-center gap-1.5">
              {features.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    idx === currentIndex ? "w-6 bg-[#1f3d2f]" : "bg-muted hover:bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border bg-muted/30 p-4">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="gap-1 text-muted-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              className="gap-1 bg-[#1f3d2f] text-white hover:bg-[#2a4f3d]"
            >
              {currentIndex === features.length - 1 ? "Got it!" : "Next"}
              {currentIndex < features.length - 1 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function HelpButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn("h-9 w-9 text-muted-foreground hover:bg-[#1f3d2f]/10 hover:text-[#1f3d2f]", className)}
      title="Feature Guide"
    >
      <HelpCircle className="h-5 w-5" />
    </Button>
  )
}
