import { useEffect, useState } from 'react'
import { api } from '../api'
import type { MapEvent } from '../types'
import EventMap from '../components/EventMap'

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
    <div className="flex h-screen flex-col p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Live Event Map</h2>
          <p className="text-sm text-slate-400">{events.length} events · Bengaluru</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'planned', 'unplanned'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>
      <div className="flex-1 overflow-hidden rounded-xl border border-slate-800">
        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-400">Loading map...</div>
        ) : (
          <EventMap events={events} />
        )}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Low (1-4)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500" /> Moderate (4-6)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> High (6-8)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Critical (8+)</span>
      </div>
    </div>
  )
}
