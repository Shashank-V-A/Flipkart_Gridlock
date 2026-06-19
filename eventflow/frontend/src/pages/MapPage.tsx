import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '../api'
import type { CorridorRisk, MapEvent } from '../types'
import EventMap from '../components/EventMap'
import PageHeader from '../components/ui/PageHeader'
import SegmentedControl from '../components/ui/SegmentedControl'

const LEGEND = [
  { color: '#4ade80', label: 'Low (1–4)' },
  { color: '#2D6A4F', label: 'Moderate (4–6)' },
  { color: '#fb923c', label: 'High (6–8)' },
  { color: '#f87171', label: 'Critical (8+)' },
]

export default function MapPage() {
  const [events, setEvents] = useState<MapEvent[]>([])
  const [corridorRisk, setCorridorRisk] = useState<CorridorRisk[]>([])
  const [filter, setFilter] = useState<'all' | 'planned' | 'unplanned'>('all')
  const [showRisk, setShowRisk] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const type = filter === 'all' ? undefined : filter
    Promise.all([api.mapEvents(type), api.corridorRisk()])
      .then(([ev, risk]) => {
        setEvents(ev)
        setCorridorRisk(risk)
      })
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        title="Live Event Map"
        description={`${events.length.toLocaleString()} events · corridor risk zones from historical closure data`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRisk((v) => !v)}
              className={`btn-ghost text-xs ${showRisk ? 'border-[var(--color-accent)]/40 text-[var(--color-accent)]' : ''}`}
            >
              {showRisk ? 'Hide' : 'Show'} corridor risk
            </button>
            <SegmentedControl
              options={[
                { value: 'all', label: 'All' },
                { value: 'planned', label: 'Planned' },
                { value: 'unplanned', label: 'Unplanned' },
              ]}
              value={filter}
              onChange={setFilter}
            />
          </div>
        }
      />

      <div className="card min-h-0 flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-3 text-[var(--color-muted)]">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent)]" />
            <span className="text-sm">Loading map data…</span>
          </div>
        ) : (
          <EventMap
            events={events}
            showLayerControl
            corridorRisk={corridorRisk}
            showCorridorRisk={showRisk}
          />
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 sm:gap-5">
        {LEGEND.map(({ color, label }) => (
          <span key={label} className="flex items-center gap-2 text-xs text-[var(--color-subtle)]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
        {showRisk && (
          <span className="flex items-center gap-2 text-xs text-[var(--color-subtle)]">
            <span className="h-3 w-3 rounded-full border-2 border-[var(--color-warning)] bg-[var(--color-warning)]/20" />
            Corridor risk zone
          </span>
        )}
      </div>
    </div>
  )
}
