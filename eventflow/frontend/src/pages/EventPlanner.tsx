import { useEffect, useState } from 'react'
import {
  AlertCircle, CheckCircle2, Clock, MapPin, Shield, Users,
} from 'lucide-react'
import { api } from '../api'
import type { ForecastRequest, ForecastResult, Metadata } from '../types'
import EventMap from '../components/EventMap'

const PLANNED_CAUSES = ['public_event', 'construction', 'procession', 'vip_movement', 'protest']
const UNPLANNED_CAUSES = [
  'vehicle_breakdown', 'accident', 'water_logging', 'tree_fall',
  'pot_holes', 'congestion', 'road_conditions', 'others',
]

const severityColor: Record<string, string> = {
  Critical: 'text-red-400 bg-red-500/20',
  High: 'text-orange-400 bg-orange-500/20',
  Moderate: 'text-yellow-400 bg-yellow-500/20',
  Low: 'text-green-400 bg-green-500/20',
}

export default function EventPlanner() {
  const [meta, setMeta] = useState<Metadata>({})
  const [form, setForm] = useState<ForecastRequest>({
    event_type: 'planned',
    event_cause: 'public_event',
    corridor: 'CBD 2',
    zone: 'Central Zone 2',
    priority: 'High',
    latitude: 12.9788,
    longitude: 77.5995,
    hour: 18,
    day_of_week: 6,
    month: 3,
    description: '',
  })
  const [result, setResult] = useState<ForecastResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.metadata().then(setMeta)
  }, [])

  const causes = form.event_type === 'planned' ? PLANNED_CAUSES : UNPLANNED_CAUSES

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.forecast(form)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Forecast failed')
    } finally {
      setLoading(false)
    }
  }

  const update = (key: keyof ForecastRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="p-8">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-white">Event Impact Planner</h2>
        <p className="text-sm text-slate-400">
          Forecast congestion impact and get manpower, barricading & diversion recommendations
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 xl:col-span-2">
          <h3 className="text-sm font-semibold text-slate-300">Event Details</h3>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Event Type</label>
            <select value={form.event_type} onChange={(e) => update('event_type', e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
              <option value="planned">Planned</option>
              <option value="unplanned">Unplanned</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Event Cause</label>
            <select value={form.event_cause} onChange={(e) => update('event_cause', e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
              {causes.map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Corridor</label>
              <select value={form.corridor} onChange={(e) => update('corridor', e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
                {(meta.corridors ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Zone</label>
              <select value={form.zone} onChange={(e) => update('zone', e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
                {(meta.zones ?? []).map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Hour</label>
              <input type="number" min={0} max={23} value={form.hour}
                onChange={(e) => update('hour', +e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Day</label>
              <input type="number" min={0} max={6} value={form.day_of_week}
                onChange={(e) => update('day_of_week', +e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Priority</label>
              <select value={form.priority} onChange={(e) => update('priority', e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
                <option value="High">High</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Latitude</label>
              <input type="number" step="0.0001" value={form.latitude}
                onChange={(e) => update('latitude', +e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Longitude</label>
              <input type="number" step="0.0001" value={form.longitude}
                onChange={(e) => update('longitude', +e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50">
            {loading ? 'Forecasting...' : 'Generate Forecast & Recommendations'}
          </button>
        </form>

        <div className="space-y-4 xl:col-span-3">
          {!result ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-700 text-slate-500">
              Configure an event and run forecast to see AI recommendations
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
                  <p className="text-xs text-slate-500">Congestion Score</p>
                  <p className="mt-1 text-3xl font-bold text-white">{result.congestion_score}</p>
                  <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${severityColor[result.severity_label]}`}>
                    {result.severity_label}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
                  <Clock className="mx-auto h-5 w-5 text-blue-400" />
                  <p className="mt-1 text-xs text-slate-500">Est. Duration</p>
                  <p className="text-2xl font-bold text-white">{result.estimated_duration_hours}h</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
                  <Shield className="mx-auto h-5 w-5 text-purple-400" />
                  <p className="mt-1 text-xs text-slate-500">Closure Prob.</p>
                  <p className="text-2xl font-bold text-white">{(result.closure_probability * 100).toFixed(0)}%</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
                  <Users className="mx-auto h-5 w-5 text-green-400" />
                  <p className="mt-1 text-xs text-slate-500">Officers Needed</p>
                  <p className="text-2xl font-bold text-white">{result.recommendations.manpower.total_officers}</p>
                </div>
              </div>

              <div className="h-72 overflow-hidden rounded-xl border border-slate-800">
                <EventMap
                  events={[]}
                  center={[form.latitude, form.longitude]}
                  zoom={14}
                  highlightCenter={[form.latitude, form.longitude]}
                  impactRadiusKm={result.recommendations.estimated_impact_radius_km}
                  barricadePoints={result.recommendations.barricading.points.map((p) => ({
                    lat: p.lat, lng: p.lng, label: p.label,
                  }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <Users className="h-4 w-4 text-blue-400" /> Manpower
                  </h4>
                  <ul className="space-y-1.5 text-sm text-slate-400">
                    <li>Traffic controllers: <strong className="text-white">{result.recommendations.manpower.traffic_controllers}</strong></li>
                    <li>Supervisors: <strong className="text-white">{result.recommendations.manpower.supervisors}</strong></li>
                    <li>Reserve pool: <strong className="text-white">{result.recommendations.manpower.reserve_pool}</strong></li>
                  </ul>
                  <p className="mt-2 text-xs text-slate-500">{result.recommendations.manpower.rationale}</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <MapPin className="h-4 w-4 text-purple-400" /> Barricading
                  </h4>
                  <ul className="space-y-1.5 text-sm text-slate-400">
                    <li>Barricade points: <strong className="text-white">{result.recommendations.barricading.count}</strong></li>
                    <li>Impact radius: <strong className="text-white">{result.recommendations.barricading.radius_km} km</strong></li>
                    <li>Road closure: <strong className={result.recommendations.barricading.road_closure_recommended ? 'text-red-400' : 'text-green-400'}>
                      {result.recommendations.barricading.road_closure_recommended ? 'Recommended' : 'Not required'}
                    </strong></li>
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-300">Diversion Routes</h4>
                  <ul className="space-y-2">
                    {result.recommendations.diversions.map((d) => (
                      <li key={d.route_id} className="text-sm">
                        <span className="font-medium text-blue-400">{d.corridor}</span>
                        <p className="text-xs text-slate-500">+{d.estimated_delay_minutes} min delay · {d.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-green-400" /> Action Checklist
                </h4>
                <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {result.recommendations.action_checklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-slate-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
