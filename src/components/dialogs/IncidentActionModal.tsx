"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface IncidentActionModalProps {
  open: boolean
  incidentId: string
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  onClose: () => void
  onRespond: (notes: string) => Promise<void>
}

const severityColors = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
}

export function IncidentActionModal({
  open,
  incidentId,
  title,
  severity,
  onClose,
  onRespond,
}: IncidentActionModalProps) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRespond = async () => {
    setLoading(true)
    try {
      await onRespond(notes)
      setNotes('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Incident Action</DialogTitle>
          <DialogDescription>
            Respond to incident: {title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{title}</p>
              <Badge className={severityColors[severity]} variant="secondary">
                {severity.toUpperCase()}
              </Badge>
            </div>
          </div>

          <Textarea
            placeholder="Add response notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-24"
          />

          <div className="space-y-2 text-sm">
            <div className="flex gap-2 items-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Response will be logged</span>
            </div>
            <div className="flex gap-2 items-center">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span>Units will be notified</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleRespond} disabled={loading}>
            {loading ? 'Processing...' : 'Respond'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
