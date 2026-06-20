import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { api } from '../api'
import type { CorridorRisk, MapEvent } from '../types'
import EventMap from '../components/EventMap'
import PageHeader from '../components/ui/PageHeader'
import SegmentedControl from '../components/ui/SegmentedControl'
import MapSkeleton from '../components/ui/MapSkeleton'
import EmptyState from '../components/ui/EmptyState'

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
  const [error, setError] = useState('')

  const loadMap = () => {
    setLoading(true)
    setError('')
    const type = filter === 'all' ? undefined : filter
    Promise.all([api.mapEvents(type), api.corridorRisk()])
      .then(([ev, risk]) => {
        setEvents(ev)
        setCorridorRisk(risk)
      })
      .catch((err) => {
        setEvents([])
        setCorridorRisk([])
        setError(err instanceof Error ? err.message : 'Failed to load map data')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadMap()
  }, [filter])

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col px-3 py-4 sm:px-8 sm:py-8">
      <PageHeader
        title="Live Event Map"
        description={
          loading
            ? 'Loading historical events…'
            : `${events.length.toLocaleString()} events · corridor risk zones from historical closure data`
        }
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => setShowRisk((v) => !v)}
              className={`btn-ghost w-full text-xs sm:w-auto ${showRisk ? 'border-[var(--color-accent)]/40 text-[var(--color-accent)]' : ''}`}
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
          <MapSkeleton />
        ) : error ? (
          <div className="flex h-full items-center justify-center p-6">
            <EmptyState
              icon={AlertTriangle}
              title="Map data unavailable"
              description={error}
              action={
                <button type="button" onClick={loadMap} className="btn-primary inline-flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              }
            />
          </div>
        ) : events.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6">
            <EmptyState
              icon={AlertTriangle}
              title="No events to display"
              description="Try a different filter or check that the Astram dataset is loaded on the server."
              action={
                <button type="button" onClick={loadMap} className="btn-ghost text-xs">
                  Refresh
                </button>
              }
            />
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

      <div className="mt-3 flex flex-wrap gap-3 sm:mt-4 sm:gap-5">
        {LEGEND.map(({ color, label }) => (
          <span key={label} className="flex items-center gap-2 text-[10px] text-[var(--color-subtle)] sm:text-xs">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
        {showRisk && (
          <span className="flex items-center gap-2 text-[10px] text-[var(--color-subtle)] sm:text-xs">
            <span className="h-3 w-3 rounded-full border-2 border-[var(--color-warning)] bg-[var(--color-warning)]/20" />
            Corridor risk zone
          </span>
        )}
      </div>
    </div>
  )
}
