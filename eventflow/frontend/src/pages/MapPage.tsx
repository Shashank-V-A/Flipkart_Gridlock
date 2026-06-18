import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '../api'
import type { MapEvent } from '../types'
import EventMap from '../components/EventMap'
import PageHeader from '../components/ui/PageHeader'
import SegmentedControl from '../components/ui/SegmentedControl'

const LEGEND = [
  { color: '#4ade80', label: 'Low (1–4)' },
  { color: '#d4a054', label: 'Moderate (4–6)' },
  { color: '#fb923c', label: 'High (6–8)' },
  { color: '#f87171', label: 'Critical (8+)' },
]

export default function MapPage() {
  const [events, setEvents] = useState<MapEvent[]>([])
  const [filter, setFilter] = useState<'all' | 'planned' | 'unplanned'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const type = filter === 'all' ? undefined : filter
    api.mapEvents(type)
      .then(setEvents)
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col px-8 py-8">
      <PageHeader
        title="Live Event Map"
        description={`${events.length.toLocaleString()} events across Bengaluru`}
        action={
          <SegmentedControl
            options={[
              { value: 'all', label: 'All' },
              { value: 'planned', label: 'Planned' },
              { value: 'unplanned', label: 'Unplanned' },
            ]}
            value={filter}
            onChange={setFilter}
          />
        }
      />

      <div className="card min-h-0 flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-3 text-[var(--color-muted)]">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent)]" />
            <span className="text-sm">Loading map data…</span>
          </div>
        ) : (
          <EventMap events={events} showLayerControl />
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-5">
        {LEGEND.map(({ color, label }) => (
          <span key={label} className="flex items-center gap-2 text-xs text-[var(--color-subtle)]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
