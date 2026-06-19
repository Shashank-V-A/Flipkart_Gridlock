import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, MapPin, Users } from "lucide-react";
import clsx from "clsx";
import { api } from "../api";
import type { ForecastRequest, ForecastResult, Metadata } from "../types";
import EventMap from "../components/EventMap";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";

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

const severityStyle: Record<string, string> = {
  Critical: "bg-[rgba(248,113,113,0.12)] text-[var(--color-danger)]",
  High: "bg-[rgba(251,146,60,0.12)] text-[var(--color-warning)]",
  Moderate: "bg-[var(--color-accent-muted)] text-[var(--color-accent)]",
  Low: "bg-[rgba(74,222,128,0.12)] text-[var(--color-success)]",
};

export default function EventPlanner() {
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

  useEffect(() => {
    api.metadata().then(setMeta);
  }, []);

  const causes =
    form.event_type === "planned" ? PLANNED_CAUSES : UNPLANNED_CAUSES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.forecast(form);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Forecast failed");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="px-8 py-8">
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
              onChange={(e) => update("event_type", e.target.value)}
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
                {(meta.corridors ?? []).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Zone</label>
              <select
                value={form.zone}
                onChange={(e) => update("zone", e.target.value)}
                className="input"
              >
                {(meta.zones ?? []).map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Hour</label>
              <input
                type="number"
                min={0}
                max={23}
                value={form.hour}
                onChange={(e) => update("hour", +e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Day</label>
              <input
                type="number"
                min={0}
                max={6}
                value={form.day_of_week}
                onChange={(e) => update("day_of_week", +e.target.value)}
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
                onChange={(e) => update("latitude", +e.target.value)}
                className="input font-mono text-xs"
              />
            </div>
            <div>
              <label className="label">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={form.longitude}
                onChange={(e) => update("longitude", +e.target.value)}
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
                {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
              </p>
            </div>
            <div className="h-96">
              <EventMap
                events={[]}
                center={[form.latitude, form.longitude]}
                zoom={19}
                maxZoom={20}
                showLayerControl
                pickable
                onLocationPick={(lat, lng) => {
                  setForm((prev) => ({
                    ...prev,
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
              />
            </div>
          </div>

          {!result ? (
            <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] text-sm text-[var(--color-subtle)]">
              Fill event details and generate a forecast
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard
                  label="Congestion"
                  value={result.congestion_score}
                  hint={
                    <span
                      className={clsx(
                        "badge",
                        severityStyle[result.severity_label],
                      )}
                    >
                      {result.severity_label}
                    </span>
                  }
                  trend="warning"
                />

                <StatCard
                  label="Duration"
                  value={formatDuration(result.estimated_duration_hours)}
                  hint="Estimated resolution"
                />
                <StatCard
                  label="Closure prob."
                  value={`${(result.closure_probability * 100).toFixed(0)}%`}
                  hint="Road closure likelihood"
                />
                <StatCard
                  label="Officers"
                  value={result.recommendations.manpower.total_officers}
                  hint="Total deployment"
                  trend="success"
                />
              </div>

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
