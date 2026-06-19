<<<<<<< HEAD
import { useEffect, useState } from 'react'
import {
  AlertCircle, AlertTriangle, CheckCircle2, MapPin, Users,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '../api'
import type { ForecastRequest, ForecastResult, Metadata } from '../types'
import EventMap from '../components/EventMap'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
=======
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, MapPin, Users } from "lucide-react";
import clsx from "clsx";
import { api } from "../api";
import type { ForecastRequest, ForecastResult, Metadata } from "../types";
import EventMap from "../components/EventMap";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
>>>>>>> 38c1597e4c8d1087bb2f0d88d20e5a83a4310168

const PLANNED_CAUSES = [
  "public_event",
  "construction",
  "procession",
  "vip_movement",
  "protest",
];
const UNPLANNED_CAUSES = [
  "vehicle_breakdown",
  "accident",
  "water_logging",
  "tree_fall",
  "pot_holes",
  "congestion",
  "road_conditions",
  "others",
];

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
  Critical: "bg-[rgba(248,113,113,0.12)] text-[var(--color-danger)]",
  High: "bg-[rgba(251,146,60,0.12)] text-[var(--color-warning)]",
  Moderate: "bg-[var(--color-accent-muted)] text-[var(--color-accent)]",
  Low: "bg-[rgba(74,222,128,0.12)] text-[var(--color-success)]",
};

export default function EventPlanner() {
<<<<<<< HEAD
  const [meta, setMeta] = useState<Metadata>({})
  const [form, setForm] = useState(emptyForm)
  const [result, setResult] = useState<ForecastResult | null>(null)
  const [whatIfHour, setWhatIfHour] = useState<number | null>(null)
  const [whatIfResult, setWhatIfResult] = useState<ForecastResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
=======
  const [meta, setMeta] = useState<Metadata>({});
  const [form, setForm] = useState<ForecastRequest>({
    event_type: "planned",
    event_cause: "public_event",
    corridor: "CBD 2",
    zone: "Central Zone 2",
    priority: "High",
    latitude: 12.9788,
    longitude: 77.5995,
    hour: 18,
    day_of_week: 6,
    month: 3,
    description: "",
  });
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
>>>>>>> 38c1597e4c8d1087bb2f0d88d20e5a83a4310168

  useEffect(() => {
    api.metadata().then(setMeta);
  }, []);

  const causes =
    form.event_type === "planned" ? PLANNED_CAUSES : UNPLANNED_CAUSES;

  const lat = form.latitude ? parseFloat(form.latitude) : null
  const lng = form.longitude ? parseFloat(form.longitude) : null
  const hasLocation = lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng)

  const buildPayload = (hourOverride?: number): ForecastRequest | null => {
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
    return {
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
  }

  useEffect(() => {
    if (!result || whatIfHour === null) return
    const baseHour = parseInt(form.hour, 10)
    if (whatIfHour === baseHour) {
      setWhatIfResult(null)
      return
    }
    const payload = buildPayload(whatIfHour)
    if (!payload) return
    const timer = setTimeout(() => {
      api.forecast(payload).then(setWhatIfResult).catch(() => setWhatIfResult(null))
    }, 400)
    return () => clearTimeout(timer)
  }, [whatIfHour, result])

  const handleSubmit = async (e: React.FormEvent) => {
<<<<<<< HEAD
    e.preventDefault()
    setError('')

    const payload = buildPayload()
    if (!payload) {
      setError('Please fill in all event details and pin a location on the map.')
      return
    }

    setLoading(true)
    try {
      const res = await api.forecast(payload)
      setResult(res)
      setWhatIfHour(payload.hour)
      setWhatIfResult(null)
=======
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.forecast(form);
      setResult(res);
>>>>>>> 38c1597e4c8d1087bb2f0d88d20e5a83a4310168
    } catch (err) {
      setError(err instanceof Error ? err.message : "Forecast failed");
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const update = (key: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }
=======
  const update = (key: keyof ForecastRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `≈ ${Math.round(hours)} hrs`;
    }

    const days = Math.round(hours / 24);

    if (days === 1) {
      return "≈ 1 day";
    }

    return `≈ ${days} days`;
  };
>>>>>>> 38c1597e4c8d1087bb2f0d88d20e5a83a4310168

  return (
    <div className="px-4 py-8 sm:px-8">
      <PageHeader
        title="Event Planner"
        description="Forecast congestion impact and get manpower, barricading, and diversion recommendations"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <form
          onSubmit={handleSubmit}
          className="card space-y-4 p-6 xl:col-span-2"
        >
          <h3 className="text-sm font-semibold text-[var(--color-fg)]">
            Event details
          </h3>

          <div>
            <label className="label">Event type</label>
            <select
              value={form.event_type}
<<<<<<< HEAD
              onChange={(e) => setForm({ ...form, event_type: e.target.value, event_cause: '' })}
=======
              onChange={(e) => update("event_type", e.target.value)}
>>>>>>> 38c1597e4c8d1087bb2f0d88d20e5a83a4310168
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
              onChange={(e) => update("event_cause", e.target.value)}
              className="input"
            >
              <option value="">Select cause</option>
              {causes.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Corridor</label>
              <select
                value={form.corridor}
                onChange={(e) => update("corridor", e.target.value)}
                className="input"
              >
<<<<<<< HEAD
                <option value="">Select corridor</option>
                {(meta.corridors ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
=======
                {(meta.corridors ?? []).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
>>>>>>> 38c1597e4c8d1087bb2f0d88d20e5a83a4310168
              </select>
            </div>
            <div>
              <label className="label">Zone</label>
              <select
                value={form.zone}
                onChange={(e) => update("zone", e.target.value)}
                className="input"
              >
<<<<<<< HEAD
                <option value="">Select zone</option>
                {(meta.zones ?? []).map((z) => <option key={z} value={z}>{z}</option>)}
=======
                {(meta.zones ?? []).map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
>>>>>>> 38c1597e4c8d1087bb2f0d88d20e5a83a4310168
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
<<<<<<< HEAD
                onChange={(e) => update('hour', e.target.value)}
                placeholder="e.g. 18"
=======
                onChange={(e) => update("hour", +e.target.value)}
>>>>>>> 38c1597e4c8d1087bb2f0d88d20e5a83a4310168
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
<<<<<<< HEAD
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
=======
                onChange={(e) => update("day_of_week", +e.target.value)}
>>>>>>> 38c1597e4c8d1087bb2f0d88d20e5a83a4310168
                className="input"
              />
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => update("priority", e.target.value)}
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
<<<<<<< HEAD
                onChange={(e) => update('latitude', e.target.value)}
                placeholder="Click map to set"
=======
                onChange={(e) => update("latitude", +e.target.value)}
>>>>>>> 38c1597e4c8d1087bb2f0d88d20e5a83a4310168
                className="input font-mono text-xs"
              />
            </div>
            <div>
              <label className="label">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={form.longitude}
<<<<<<< HEAD
                onChange={(e) => update('longitude', e.target.value)}
                placeholder="Click map to set"
=======
                onChange={(e) => update("longitude", +e.target.value)}
>>>>>>> 38c1597e4c8d1087bb2f0d88d20e5a83a4310168
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

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Forecasting…" : "Generate forecast"}
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
<<<<<<< HEAD
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
=======
                    latitude: Math.round(lat * 1e6) / 1e6,
                    longitude: Math.round(lng * 1e6) / 1e6,
                  }));
                }}
                eventPin={{
                  lat: form.latitude,
                  lng: form.longitude,
                  label: "Event location",
                }}
                highlightCenter={
                  result ? [form.latitude, form.longitude] : undefined
                }
                impactRadiusKm={
                  result?.recommendations.estimated_impact_radius_km
                }
                barricadePoints={result?.recommendations.barricading.points.map(
                  (p) => ({
                    lat: p.lat,
                    lng: p.lng,
                    label: p.label,
                  }),
                )}
>>>>>>> 38c1597e4c8d1087bb2f0d88d20e5a83a4310168
              />
            </div>
          </div>

          {!result ? (
            <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] text-sm text-[var(--color-subtle)]">
              Fill event details and generate a forecast
            </div>
          ) : (
            <>
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
                    <span
                      className={clsx(
                        "badge",
                        severityStyle[result.severity_label],
                      )}
                    >
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
<<<<<<< HEAD
                  value={
                    result.duration_hours_ci
                      ? `${result.duration_hours_ci.low}–${result.duration_hours_ci.high}h`
                      : `${result.estimated_duration_hours}h`
                  }
                  hint={`Median est. ${result.estimated_duration_hours}h`}
=======
                  value={formatDuration(result.estimated_duration_hours)}
                  hint="Estimated resolution"
>>>>>>> 38c1597e4c8d1087bb2f0d88d20e5a83a4310168
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

              {whatIfHour !== null && (
                <div className="card p-5">
                  <h4 className="mb-1 text-sm font-semibold text-[var(--color-fg)]">What-if: change event hour</h4>
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
                  <div className="mt-2 flex items-center justify-between text-xs text-[var(--color-muted)]">
                    <span>Hour: <strong className="text-[var(--color-fg)]">{whatIfHour}:00</strong></span>
                    {whatIfResult && whatIfHour !== parseInt(form.hour, 10) && (
                      <span>
                        Score {result.congestion_score} →{' '}
                        <strong className={clsx(
                          whatIfResult.congestion_score < result.congestion_score
                            ? 'text-[var(--color-success)]'
                            : whatIfResult.congestion_score > result.congestion_score
                              ? 'text-[var(--color-danger)]'
                              : 'text-[var(--color-fg)]',
                        )}>
                          {whatIfResult.congestion_score}
                        </strong>
                        {' · '}
                        Officers {result.recommendations.manpower.total_officers} → {whatIfResult.recommendations.manpower.total_officers}
                      </span>
                    )}
                  </div>
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
                          "font-medium",
                          result.recommendations.barricading
                            .road_closure_recommended
                            ? "text-[var(--color-danger)]"
                            : "text-[var(--color-success)]",
                        )}
                      >
                        {result.recommendations.barricading
                          .road_closure_recommended
                          ? "Yes"
                          : "No"}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="card p-5">
                  <h4 className="mb-4 text-sm font-semibold text-[var(--color-fg)]">
                    Diversion routes
                  </h4>
                  <ul className="space-y-3">
                    {result.recommendations.diversions.map((d) => (
                      <li key={d.route_id} className="text-sm">
                        <span className="font-medium text-[var(--color-accent)]">
                          {d.corridor}
                        </span>
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
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-[var(--color-muted)]"
                    >
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
  );
}
