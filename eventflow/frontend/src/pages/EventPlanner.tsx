import { useEffect, useState } from 'react'
import {
  AlertCircle, AlertTriangle, CheckCircle2, CloudRain, Columns2, Download, History,
  MapPin, Printer, Radar, Timer, Users, Zap,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '../api'
import type { ForecastRequest, ForecastResult, Metadata } from '../types'
import EventMap from '../components/EventMap'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import { PLANNER_DEMO_SCENARIOS, printDeploymentBrief } from '../lib/deploymentBrief'
import { downloadAnalysisPdf } from '../lib/downloadAnalysisPdf'

const PLANNED_CAUSES = ['public_event', 'construction', 'procession', 'vip_movement', 'protest']
const UNPLANNED_CAUSES = [
  'vehicle_breakdown', 'accident', 'water_logging', 'tree_fall',
  'pot_holes', 'congestion', 'road_conditions', 'others',
]

const MAP_CENTER: [number, number] = [12.9716, 77.5946]

const emptyForm = {
  event_type: 'planned',
  event_cause: '',
  corridor: '',
  zone: '',
  priority: '',
  hour: '',
  day_of_week: '',
  month: '',
  latitude: '',
  longitude: '',
  description: '',
}

const severityStyle: Record<string, string> = {
  Critical: 'bg-[rgba(248,113,113,0.12)] text-[var(--color-danger)]',
  High: 'bg-[rgba(251,146,60,0.12)] text-[var(--color-warning)]',
  Moderate: 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]',
  Low: 'bg-[rgba(74,222,128,0.12)] text-[var(--color-success)]',
}

export default function EventPlanner() {
  const [meta, setMeta] = useState<Metadata>({})
  const [form, setForm] = useState(emptyForm)
  const [result, setResult] = useState<ForecastResult | null>(null)
  const [whatIfHour, setWhatIfHour] = useState<number | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.metadata().then(setMeta)
  }, [])

  const causes = form.event_type === 'planned' ? PLANNED_CAUSES : UNPLANNED_CAUSES

  const lat = form.latitude ? parseFloat(form.latitude) : null
  const lng = form.longitude ? parseFloat(form.longitude) : null
  const hasLocation = lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng)

  const buildPayload = (hourOverride?: number, compareHour?: number | null): ForecastRequest | null => {
    const hour = hourOverride ?? parseInt(form.hour, 10)
    const day_of_week = parseInt(form.day_of_week, 10)
    const month = parseInt(form.month, 10)
    if (
      !form.event_cause || !form.corridor || !form.zone || !form.priority
      || Number.isNaN(hour) || Number.isNaN(day_of_week) || Number.isNaN(month)
      || lat === null || lng === null
    ) {
      return null
    }
    const payload: ForecastRequest = {
      event_type: form.event_type,
      event_cause: form.event_cause,
      corridor: form.corridor,
      zone: form.zone,
      priority: form.priority,
      latitude: lat,
      longitude: lng,
      hour,
      day_of_week,
      month,
      description: form.description || undefined,
    }
    if (compareHour != null && compareHour !== hour) {
      payload.compare_hour = compareHour
    }
    return payload
  }

  const fetchForecast = async (compareHour?: number | null) => {
    const payload = buildPayload(undefined, compareHour)
    if (!payload) return null
    return api.forecast(payload)
  }

  useEffect(() => {
    if (!result || whatIfHour === null) return
    const baseHour = parseInt(form.hour, 10)
    if (whatIfHour === baseHour) {
      if (result.plan_comparison) {
        fetchForecast(null).then((res) => res && setResult(res)).catch(() => {})
      }
      return
    }
    const payload = buildPayload(undefined, whatIfHour)
    if (!payload) return
    const timer = setTimeout(() => {
      setCompareLoading(true)
      api.forecast(payload)
        .then(setResult)
        .catch(() => {})
        .finally(() => setCompareLoading(false))
    }, 400)
    return () => clearTimeout(timer)
  }, [whatIfHour])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const payload = buildPayload()
    if (!payload) {
      setError('Please fill in all event details and pin a location on the map.')
      return
    }

    setLoading(true)
    try {
      const res = await fetchForecast(null)
      if (res) {
        setResult(res)
        setWhatIfHour(parseInt(form.hour, 10))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Forecast failed')
    } finally {
      setLoading(false)
    }
  }

  const update = (key: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="px-4 py-8 sm:px-8">
      <PageHeader
        title="Event Planner"
        description="Forecast congestion impact and get manpower, barricading, and diversion recommendations"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {PLANNER_DEMO_SCENARIOS.map((demo) => (
          <button
            key={demo.label}
            type="button"
            className="btn-ghost text-xs"
            onClick={() => {
              setForm({ ...demo.form })
              setResult(null)
              setError('')
            }}
          >
            Demo: {demo.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <form onSubmit={handleSubmit} className="card space-y-4 p-6 xl:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--color-fg)]">Event details</h3>

          <div>
            <label className="label">Event type</label>
            <select
              value={form.event_type}
              onChange={(e) => setForm({ ...form, event_type: e.target.value, event_cause: '' })}
              className="input"
            >
              <option value="planned">Planned</option>
              <option value="unplanned">Unplanned</option>
            </select>
          </div>

          <div>
            <label className="label">Cause</label>
            <select
              value={form.event_cause}
              onChange={(e) => update('event_cause', e.target.value)}
              className="input"
            >
              <option value="">Select cause</option>
              {causes.map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Corridor</label>
              <select
                value={form.corridor}
                onChange={(e) => update('corridor', e.target.value)}
                className="input"
              >
                <option value="">Select corridor</option>
                {(meta.corridors ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Zone</label>
              <select
                value={form.zone}
                onChange={(e) => update('zone', e.target.value)}
                className="input"
              >
                <option value="">Select zone</option>
                {(meta.zones ?? []).map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Hour (0–23)</label>
              <input
                type="number"
                min={0}
                max={23}
                value={form.hour}
                onChange={(e) => update('hour', e.target.value)}
                placeholder="e.g. 18"
                className="input"
              />
            </div>
            <div>
              <label className="label">Day (0=Mon, 6=Sun)</label>
              <input
                type="number"
                min={0}
                max={6}
                value={form.day_of_week}
                onChange={(e) => update('day_of_week', e.target.value)}
                placeholder="e.g. 5"
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Month (1–12)</label>
              <input
                type="number"
                min={1}
                max={12}
                value={form.month}
                onChange={(e) => update('month', e.target.value)}
                placeholder="e.g. 3"
                className="input"
              />
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => update('priority', e.target.value)}
                className="input"
              >
                <option value="">Select priority</option>
                <option value="High">High</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={form.latitude}
                onChange={(e) => update('latitude', e.target.value)}
                placeholder="Click map to set"
                className="input font-mono text-xs"
              />
            </div>
            <div>
              <label className="label">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={form.longitude}
                onChange={(e) => update('longitude', e.target.value)}
                placeholder="Click map to set"
                className="input font-mono text-xs"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] p-3 text-sm text-[var(--color-danger)]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Forecasting…' : 'Generate forecast'}
          </button>
        </form>

        <div className="space-y-5 xl:col-span-3">
          <div className="card overflow-hidden">
            <div className="border-b border-[var(--color-border)] px-5 py-3">
              <p className="text-xs text-[var(--color-muted)]">
                Click map to pin location · scroll to zoom
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-[var(--color-subtle)]">
                {hasLocation
                  ? `${lat!.toFixed(6)}, ${lng!.toFixed(6)}`
                  : 'No location selected'}
              </p>
            </div>
            <div className="h-96">
              <EventMap
                events={[]}
                center={hasLocation ? [lat!, lng!] : MAP_CENTER}
                zoom={hasLocation ? 19 : 12}
                maxZoom={20}
                showLayerControl
                pickable
                onLocationPick={(pickLat, pickLng) => {
                  setForm((prev) => ({
                    ...prev,
                    latitude: String(Math.round(pickLat * 1e6) / 1e6),
                    longitude: String(Math.round(pickLng * 1e6) / 1e6),
                  }))
                }}
                eventPin={hasLocation ? {
                  lat: lat!,
                  lng: lng!,
                  label: 'Event location',
                } : undefined}
                highlightCenter={result && hasLocation ? [lat!, lng!] : undefined}
                impactRadiusKm={result?.recommendations.estimated_impact_radius_km}
                barricadePoints={result?.recommendations.barricading.points.map((p) => ({
                  lat: p.lat, lng: p.lng, label: p.label,
                }))}
              />
            </div>
          </div>

          {!result ? (
            <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] text-sm text-[var(--color-subtle)]">
              Fill event details and generate a forecast
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--color-fg)]">Deployment plan</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-ghost inline-flex items-center gap-2 text-xs"
                    onClick={() => downloadAnalysisPdf(form, result)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PDF
                  </button>
                  <button
                    type="button"
                    className="btn-ghost inline-flex items-center gap-2 text-xs"
                    onClick={() => printDeploymentBrief(form, result)}
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print brief
                  </button>
                </div>
              </div>

              {result.weather?.message && (
                <div className={clsx(
                  'flex gap-3 rounded-xl border p-4',
                  result.weather.is_raining
                    ? 'border-[rgba(96,165,250,0.25)] bg-[rgba(96,165,250,0.08)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]',
                )}>
                  <CloudRain className={clsx(
                    'h-5 w-5 shrink-0',
                    result.weather.is_raining ? 'text-blue-400' : 'text-[var(--color-muted)]',
                  )} />
                  <div className="text-sm leading-relaxed text-[var(--color-muted)]">
                    <p className="font-medium text-[var(--color-fg)]">Weather-aware risk</p>
                    <p className="mt-0.5">{result.weather.message}</p>
                    {result.weather.score_adjustment > 0 && (
                      <p className="mt-1 text-xs text-[var(--color-subtle)]">
                        Congestion score adjusted +{result.weather.score_adjustment} for current conditions
                      </p>
                    )}
                  </div>
                </div>
              )}

              {result.peak_hour_warning?.peak_hour_overlap && (
                <div className="flex gap-3 rounded-xl border border-[rgba(251,146,60,0.25)] bg-[rgba(251,146,60,0.08)] p-4">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--color-warning)]" />
                  <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                    {result.peak_hour_warning.message}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard
                  label="Congestion"
                  value={
                    result.congestion_score_ci
                      ? `${result.congestion_score_ci.low}–${result.congestion_score_ci.high}`
                      : result.congestion_score
                  }
                  hint={
                    <span className={clsx('badge', severityStyle[result.severity_label])}>
                      {result.severity_label}
                      {result.congestion_score_ci && (
                        <span className="ml-1 font-normal normal-case opacity-80">
                          (est. {result.congestion_score})
                        </span>
                      )}
                    </span>
                  }
                  trend="warning"
                />
                <StatCard
                  label="Duration"
                  value={
                    result.duration_hours_ci
                      ? `${result.duration_hours_ci.low}–${result.duration_hours_ci.high}h`
                      : `${result.estimated_duration_hours}h`
                  }
                  hint={`Median est. ${result.estimated_duration_hours}h`}
                />
                <StatCard
                  label="Closure prob."
                  value={`${(result.closure_probability * 100).toFixed(0)}%`}
                  hint="Road closure likelihood"
                />
                <StatCard
                  label="Officers"
                  value={result.recommendations.manpower.total_officers}
                  hint={
                    result.recommendations.manpower.data_driven
                      ? 'Data-driven blend'
                      : 'Total deployment'
                  }
                  trend="success"
                />
              </div>

              {result.citizen_impact && (
                <div className="card p-5">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)]">
                    <Users className="h-4 w-4 text-[var(--color-accent)]" />
                    Citizen impact estimate
                  </h4>
                  <p className="text-sm text-[var(--color-muted)]">{result.citizen_impact.summary}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[var(--color-subtle)]">Vehicles affected</p>
                      <p className="font-mono text-lg font-semibold text-[var(--color-fg)]">
                        {result.citizen_impact.estimated_vehicles_affected.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[var(--color-subtle)]">Avg delay</p>
                      <p className="font-mono text-lg font-semibold text-[var(--color-fg)]">
                        {result.citizen_impact.avg_delay_minutes} min
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[var(--color-subtle)]">Delay vehicle-hrs</p>
                      <p className="font-mono text-lg font-semibold text-[var(--color-fg)]">
                        {result.citizen_impact.total_delay_vehicle_hours.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[var(--color-subtle)]">Impact radius</p>
                      <p className="font-mono text-lg font-semibold text-[var(--color-fg)]">
                        {result.citizen_impact.impact_radius_km} km
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {result.conflict_radar && (
                <div className={clsx(
                  'card p-5',
                  result.conflict_radar.has_conflict && 'border-[rgba(251,146,60,0.3)]',
                )}>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)]">
                    <Radar className="h-4 w-4 text-[var(--color-accent)]" />
                    Multi-event conflict radar
                    {result.conflict_radar.has_conflict && (
                      <span className="badge bg-[rgba(251,146,60,0.12)] text-[var(--color-warning)]">
                        {result.conflict_radar.compound_risk_pct}% compound risk
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-[var(--color-muted)]">{result.conflict_radar.message}</p>
                  {result.conflict_radar.corridor_overlaps.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
                        Corridor overlaps
                      </p>
                      <ul className="space-y-2">
                        {result.conflict_radar.corridor_overlaps.slice(0, 5).map((e) => (
                          <li key={e.id || `${e.cause}-${e.hour}`} className="flex justify-between text-sm">
                            <span className="text-[var(--color-muted)]">
                              {e.cause.replace(/_/g, ' ')} @ {e.hour}:00
                            </span>
                            <span className="font-mono text-[var(--color-fg)]">
                              score {e.congestion_score} · {e.duration_hours}h
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.conflict_radar.adjacent_corridor_alerts.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
                        Adjacent corridor stress
                      </p>
                      <ul className="space-y-2">
                        {result.conflict_radar.adjacent_corridor_alerts.map((a) => (
                          <li key={a.corridor} className="flex justify-between text-sm text-[var(--color-muted)]">
                            <span>{a.corridor}</span>
                            <span className="font-mono">{a.event_count} events · avg {a.avg_score}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {result.similar_events && result.similar_events.length > 0 && (
                <div className="card p-5">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)]">
                    <History className="h-4 w-4 text-[var(--color-accent)]" />
                    Similar past events
                  </h4>
                  <ul className="space-y-3">
                    {result.similar_events.map((e) => (
                      <li
                        key={e.id || `${e.corridor}-${e.hour}-${e.cause}`}
                        className="rounded-xl border border-[var(--color-border)] p-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-[var(--color-fg)]">
                            {e.cause.replace(/_/g, ' ')} · {e.corridor}
                          </span>
                          <span className="font-mono text-xs text-[var(--color-muted)]">
                            {e.hour}:00 · score {e.congestion_score} · {e.duration_hours}h
                          </span>
                        </div>
                        {(e.address || e.junction) && (
                          <p className="mt-1 text-xs text-[var(--color-subtle)]">
                            {e.junction || e.address}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.deployment_timeline && result.deployment_timeline.length > 0 && (
                <div className="card p-5">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)]">
                    <Timer className="h-4 w-4 text-[var(--color-accent)]" />
                    Deployment timeline (T-minus checklist)
                  </h4>
                  <ol className="relative space-y-0 border-l border-[var(--color-border)] pl-6">
                    {result.deployment_timeline.map((step, i) => (
                      <li key={`${step.label}-${i}`} className="relative pb-5 last:pb-0">
                        <span className="absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-bg)]" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                          {step.label} · {step.phase}
                        </p>
                        <p className="mt-0.5 text-sm text-[var(--color-muted)]">{step.action}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {result.score_drivers && result.score_drivers.length > 0 && (
                <div className="card p-5">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)]">
                    <Zap className="h-4 w-4 text-[var(--color-accent)]" />
                    Key forecast drivers
                  </h4>
                  <ul className="space-y-3">
                    {result.score_drivers.map((driver) => (
                      <li key={`${driver.feature}-${driver.value}`} className="text-sm">
                        <span className="font-medium text-[var(--color-fg)]">{driver.feature}</span>
                        <span className="text-[var(--color-muted)]"> · {driver.value}</span>
                        <p className="mt-0.5 text-xs text-[var(--color-subtle)]">{driver.contribution}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {whatIfHour !== null && (
                <div className="card p-5">
                  <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)]">
                    <Columns2 className="h-4 w-4 text-[var(--color-accent)]" />
                    Side-by-side plan comparison
                    {compareLoading && (
                      <span className="text-xs font-normal text-[var(--color-subtle)]">Updating…</span>
                    )}
                  </h4>
                  <p className="mb-4 text-xs text-[var(--color-subtle)]">
                    Slide to compare impact at a different time — same location and event type.
                  </p>
                  <input
                    type="range"
                    min={0}
                    max={23}
                    value={whatIfHour}
                    onChange={(e) => setWhatIfHour(parseInt(e.target.value, 10))}
                    className="w-full accent-[var(--color-accent)]"
                  />
                  <div className="mt-2 text-xs text-[var(--color-muted)]">
                    Alternative hour: <strong className="text-[var(--color-fg)]">{whatIfHour}:00</strong>
                    {' · '}
                    Base hour: <strong className="text-[var(--color-fg)]">{form.hour}:00</strong>
                  </div>

                  {result.plan_comparison && whatIfHour !== parseInt(form.hour, 10) ? (
                    <div className="mt-5 overflow-x-auto">
                      <table className="w-full min-w-[480px] text-sm">
                        <thead>
                          <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-subtle)]">
                            <th className="pb-2 pr-4">Metric</th>
                            <th className="pb-2 pr-4">{result.plan_comparison.base_hour}:00 (base)</th>
                            <th className="pb-2 pr-4">{result.plan_comparison.alternative_hour}:00 (alt)</th>
                            <th className="pb-2">Delta</th>
                          </tr>
                        </thead>
                        <tbody className="text-[var(--color-muted)]">
                          <tr className="border-b border-[var(--color-border)]">
                            <td className="py-2.5 pr-4">Congestion score</td>
                            <td className="py-2.5 pr-4 font-mono">{result.plan_comparison.base.congestion_score}</td>
                            <td className="py-2.5 pr-4 font-mono">{result.plan_comparison.alternative.congestion_score}</td>
                            <td className={clsx(
                              'py-2.5 font-mono',
                              result.plan_comparison.delta.congestion_score < 0
                                ? 'text-[var(--color-success)]'
                                : result.plan_comparison.delta.congestion_score > 0
                                  ? 'text-[var(--color-danger)]'
                                  : '',
                            )}>
                              {result.plan_comparison.delta.congestion_score > 0 ? '+' : ''}
                              {result.plan_comparison.delta.congestion_score}
                            </td>
                          </tr>
                          <tr className="border-b border-[var(--color-border)]">
                            <td className="py-2.5 pr-4">Duration (h)</td>
                            <td className="py-2.5 pr-4 font-mono">{result.plan_comparison.base.estimated_duration_hours}</td>
                            <td className="py-2.5 pr-4 font-mono">{result.plan_comparison.alternative.estimated_duration_hours}</td>
                            <td className="py-2.5 font-mono">{result.plan_comparison.delta.duration_hours > 0 ? '+' : ''}{result.plan_comparison.delta.duration_hours}</td>
                          </tr>
                          <tr className="border-b border-[var(--color-border)]">
                            <td className="py-2.5 pr-4">Closure prob.</td>
                            <td className="py-2.5 pr-4 font-mono">{(result.plan_comparison.base.closure_probability * 100).toFixed(0)}%</td>
                            <td className="py-2.5 pr-4 font-mono">{(result.plan_comparison.alternative.closure_probability * 100).toFixed(0)}%</td>
                            <td className="py-2.5 font-mono">{(result.plan_comparison.delta.closure_probability * 100).toFixed(0)}%</td>
                          </tr>
                          <tr className="border-b border-[var(--color-border)]">
                            <td className="py-2.5 pr-4">Officers</td>
                            <td className="py-2.5 pr-4 font-mono">{result.plan_comparison.base.officers}</td>
                            <td className="py-2.5 pr-4 font-mono">{result.plan_comparison.alternative.officers}</td>
                            <td className="py-2.5 font-mono">{result.plan_comparison.delta.officers > 0 ? '+' : ''}{result.plan_comparison.delta.officers}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 pr-4">Peak overlap</td>
                            <td className="py-2.5 pr-4">{result.plan_comparison.base.peak_overlap ? 'Yes' : 'No'}</td>
                            <td className="py-2.5 pr-4">{result.plan_comparison.alternative.peak_overlap ? 'Yes' : 'No'}</td>
                            <td className="py-2.5">—</td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="mt-4 rounded-xl bg-[var(--color-accent-muted)] p-3 text-sm text-[var(--color-muted)]">
                        {result.plan_comparison.recommendation}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-[var(--color-subtle)]">
                      Move the slider away from the base hour to see a side-by-side comparison.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="card p-5">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)]">
                    <Users className="h-4 w-4 text-[var(--color-accent)]" />
                    Manpower
                  </h4>
                  <ul className="space-y-2 text-sm text-[var(--color-muted)]">
                    <li className="flex justify-between">
                      <span>Traffic controllers</span>
                      <span className="font-mono font-medium text-[var(--color-fg)]">
                        {result.recommendations.manpower.traffic_controllers}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Supervisors</span>
                      <span className="font-mono font-medium text-[var(--color-fg)]">
                        {result.recommendations.manpower.supervisors}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Reserve pool</span>
                      <span className="font-mono font-medium text-[var(--color-fg)]">
                        {result.recommendations.manpower.reserve_pool}
                      </span>
                    </li>
                  </ul>
                  <p className="mt-3 text-xs leading-relaxed text-[var(--color-subtle)]">
                    {result.recommendations.manpower.rationale}
                  </p>
                </div>

                <div className="card p-5">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)]">
                    <MapPin className="h-4 w-4 text-[var(--color-accent)]" />
                    Barricading
                  </h4>
                  <ul className="space-y-2 text-sm text-[var(--color-muted)]">
                    <li className="flex justify-between">
                      <span>Barricade points</span>
                      <span className="font-mono font-medium text-[var(--color-fg)]">
                        {result.recommendations.barricading.count}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Impact radius</span>
                      <span className="font-mono font-medium text-[var(--color-fg)]">
                        {result.recommendations.barricading.radius_km} km
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Road closure</span>
                      <span
                        className={clsx(
                          'font-medium',
                          result.recommendations.barricading.road_closure_recommended
                            ? 'text-[var(--color-danger)]'
                            : 'text-[var(--color-success)]',
                        )}
                      >
                        {result.recommendations.barricading.road_closure_recommended ? 'Yes' : 'No'}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="card p-5">
                  <h4 className="mb-4 text-sm font-semibold text-[var(--color-fg)]">Diversion routes</h4>
                  <ul className="space-y-3">
                    {result.recommendations.diversions.map((d) => (
                      <li key={d.route_id} className="text-sm">
                        <span className="font-medium text-[var(--color-accent)]">{d.corridor}</span>
                        <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-subtle)]">
                          +{d.estimated_delay_minutes} min · {d.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="card p-5">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)]">
                  <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                  Action checklist
                </h4>
                <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                  {result.recommendations.action_checklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--color-muted)]">
                      <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded border border-[var(--color-border-strong)]" />
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
