import { useEffect, useState } from "react";
import {
<<<<<<< HEAD
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { AlertTriangle, Clock, Database, Target, Zap } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../api'
import type { CauseStat, CorridorStat, HourlyStat, ImpactMetrics, Summary } from '../types'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import EmptyState from '../components/ui/EmptyState'
import DashboardSkeleton from '../components/ui/DashboardSkeleton'
=======
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Loader2 } from "lucide-react";
import clsx from "clsx";
import { api } from "../api";
import type { CauseStat, CorridorStat, HourlyStat, Summary } from "../types";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import EmptyState from "../components/ui/EmptyState";
>>>>>>> 38c1597e4c8d1087bb2f0d88d20e5a83a4310168

const CHART_TOOLTIP = {
  background: "#16161a",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  fontSize: 12,
  color: "#fafafa",
};

const CHART_COLORS = [
  "#d4a054",
  "#a1a1aa",
  "#fb923c",
  "#4ade80",
  "#f87171",
  "#71717a",
];

export default function Dashboard() {
<<<<<<< HEAD
  const [summary, setSummary] = useState<Summary | null>(null)
  const [impact, setImpact] = useState<ImpactMetrics | null>(null)
  const [causes, setCauses] = useState<CauseStat[]>([])
  const [corridors, setCorridors] = useState<CorridorStat[]>([])
  const [hourly, setHourly] = useState<HourlyStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.summary(), api.impact(), api.causes(), api.corridors(), api.hourly()])
      .then(([s, imp, c, cor, h]) => {
        setSummary(s)
        setImpact(imp)
        setCauses(c.slice(0, 8))
        setCorridors(cor.slice(0, 8))
        setHourly(h)
=======
  const [summary, setSummary] = useState<Summary | null>(null);
  const [causes, setCauses] = useState<CauseStat[]>([]);
  const [corridors, setCorridors] = useState<CorridorStat[]>([]);
  const [hourly, setHourly] = useState<HourlyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.summary(), api.causes(), api.corridors(), api.hourly()])
      .then(([s, c, cor, h]) => {
        setSummary(s);
        setCauses(c.slice(0, 8));
        setCorridors(cor.slice(0, 8));
        setHourly(h);
>>>>>>> 38c1597e4c8d1087bb2f0d88d20e5a83a4310168
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, []);

<<<<<<< HEAD
  if (loading) return <DashboardSkeleton />
=======
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center gap-3 text-[var(--color-muted)]">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent)]" />
        <span className="text-sm">Loading intelligence data…</span>
      </div>
    );
  }
>>>>>>> 38c1597e4c8d1087bb2f0d88d20e5a83a4310168

  if (error || !summary || !impact) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Backend not connected"
        description="Start the Python API on port 8000, then refresh this page."
        action={
          <code className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 font-mono text-xs text-[var(--color-accent)]">
            cd eventflow/backend && uvicorn app.main:app --port 8000
          </code>
        }
      />
    );
  }

  return (
    <div className="px-4 py-8 sm:px-8">
      <PageHeader
        title="Traffic Intelligence"
        description={`Astram dataset · ${summary.date_range.start?.slice(0, 10)} to ${summary.date_range.end?.slice(0, 10)} · ${summary.total_events.toLocaleString()} events analyzed`}
      />

      <div className="card mb-8 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)]">
          <Zap className="h-4 w-4 text-[var(--color-accent)]" />
          Operational impact
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-2 flex items-center gap-2 text-[var(--color-subtle)]">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Planning time</span>
            </div>
            <p className="text-2xl font-semibold text-[var(--color-fg)]">
              {impact.manual_planning_minutes} min → {impact.automated_planning_seconds}s
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {impact.time_saved_per_event_minutes} min saved per event
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-2 flex items-center gap-2 text-[var(--color-subtle)]">
              <Database className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Dataset</span>
            </div>
            <p className="text-2xl font-semibold text-[var(--color-fg)]">
              {impact.events_in_dataset.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {impact.corridors_covered} corridors · {impact.zones_covered} zones
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-2 flex items-center gap-2 text-[var(--color-subtle)]">
              <Target className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Model accuracy</span>
            </div>
            <p className="text-2xl font-semibold text-[var(--color-fg)]">
              R² {impact.model_score_r2 ?? '—'}
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Closure prediction {impact.closure_accuracy_pct ?? '—'}%
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-2 flex items-center gap-2 text-[var(--color-subtle)]">
              <Zap className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Annual savings</span>
            </div>
            <p className="text-2xl font-semibold text-[var(--color-accent)]">
              ~{impact.estimated_annual_hours_saved.toLocaleString()}h
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Officer planning hours saved / year (est.)
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total events"
          value={summary.total_events.toLocaleString()}
          hint={`${summary.planned_events} planned · ${summary.unplanned_events} unplanned`}
        />
        <StatCard
          label="Avg congestion"
          value={summary.avg_congestion_score}
          hint="Impact index (1–10)"
          trend="warning"
        />
        <StatCard
          label="Road closures"
          value={summary.road_closures}
          hint={`${summary.high_priority_pct}% high priority`}
        />
        <StatCard
          label="Median duration"
          value={`${summary.avg_duration_hours}h`}
          hint="Time to resolution"
          trend="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-5 text-sm font-semibold text-[var(--color-fg)]">
            Event causes
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={causes}
              layout="vertical"
              margin={{ left: 4, right: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                horizontal={false}
              />
              <XAxis
                type="number"
                stroke="#52525b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="cause"
                type="category"
                stroke="#52525b"
                fontSize={10}
                width={72}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => String(v).replace(/_/g, " ").slice(0, 12)}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP}
                labelFormatter={(v) => String(v).replace(/_/g, " ")}
              />
              <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={14}>
                {causes.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      i === 0
                        ? "#d4a054"
                        : CHART_COLORS[i % CHART_COLORS.length]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="mb-5 text-sm font-semibold text-[var(--color-fg)]">
            Hourly pattern
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={hourly}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="hour"
                interval={0}
                stroke="#52525b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(h) => {
                  const hour = Number(h);
                  const displayHour = hour % 12 || 12;
                  const period = hour >= 12 ? "PM" : "AM";
                  return `${displayHour}${period}`;
                }}
              />
              <YAxis
                stroke="#52525b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={CHART_TOOLTIP} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#d4a054"
                strokeWidth={2}
                dot={false}
                name="Events"
              />
              <Line
                type="monotone"
                dataKey="avg_score"
                stroke="#a1a1aa"
                strokeWidth={1.5}
                dot={false}
                name="Score"
                strokeDasharray="4 4"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card overflow-hidden xl:col-span-2">
          <div className="border-b border-[var(--color-border)] px-6 py-4">
            <h3 className="text-sm font-semibold text-[var(--color-fg)]">
              High-risk corridors
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-subtle)]">
                    Corridor
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-subtle)]">
                    Events
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-subtle)]">
                    Score
                  </th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-subtle)]">
                    Closure
                  </th>
                </tr>
              </thead>
              <tbody>
                {corridors.map((c, i) => (
                  <tr
                    key={c.corridor}
                    className={
                      i < corridors.length - 1
                        ? "border-b border-[var(--color-border)]"
                        : ""
                    }
                  >
                    <td className="px-6 py-3.5 font-medium text-[var(--color-fg)]">
                      {c.corridor}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--color-muted)]">
                      {c.count}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={clsx(
                          "badge",
                          c.avg_score >= 6
                            ? "bg-[rgba(251,146,60,0.12)] text-[var(--color-warning)]"
                            : "bg-white/[0.04] text-[var(--color-muted)]",
                        )}
                      >
                        {c.avg_score}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-[var(--color-muted)]">
                      {(c.closure_rate * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
