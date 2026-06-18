import { useEffect, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { AlertTriangle, Clock, MapPinned, Users } from 'lucide-react'
import { api } from '../api'
import type { CauseStat, CorridorStat, HourlyStat, Summary } from '../types'

const COLORS = ['#3b82f6', '#8b5cf6', '#f97316', '#22c55e', '#ef4444', '#eab308']

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; accent: string
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [causes, setCauses] = useState<CauseStat[]>([])
  const [corridors, setCorridors] = useState<CorridorStat[]>([])
  const [hourly, setHourly] = useState<HourlyStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.summary(), api.causes(), api.corridors(), api.hourly()])
      .then(([s, c, cor, h]) => {
        setSummary(s)
        setCauses(c.slice(0, 8))
        setCorridors(cor.slice(0, 8))
        setHourly(h)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex h-full items-center justify-center text-slate-400">Loading analytics...</div>
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-white">Traffic Intelligence Dashboard</h2>
        <p className="mt-1 text-sm text-slate-400">
          Historical Astram event data · {summary?.date_range.start?.slice(0, 10)} to {summary?.date_range.end?.slice(0, 10)}
        </p>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Events" value={summary?.total_events.toLocaleString() ?? '—'}
          sub={`${summary?.planned_events} planned · ${summary?.unplanned_events} unplanned`}
          icon={MapPinned} accent="bg-blue-600/20 text-blue-400" />
        <StatCard label="Avg Congestion Score" value={summary?.avg_congestion_score ?? '—'}
          sub="Derived impact index (1–10)"
          icon={AlertTriangle} accent="bg-orange-600/20 text-orange-400" />
        <StatCard label="Road Closures" value={summary?.road_closures ?? '—'}
          sub={`${summary?.high_priority_pct}% high priority events`}
          icon={Users} accent="bg-purple-600/20 text-purple-400" />
        <StatCard label="Median Duration" value={`${summary?.avg_duration_hours}h`}
          sub="Time to resolution"
          icon={Clock} accent="bg-green-600/20 text-green-400" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">Top Event Causes</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={causes} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#64748b" fontSize={11} />
              <YAxis dataKey="cause" type="category" stroke="#64748b" fontSize={10} width={75}
                tickFormatter={(v) => v.replace(/_/g, ' ').slice(0, 14)} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelFormatter={(v) => String(v).replace(/_/g, ' ')} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {causes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">Hourly Event Pattern</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={11}
                tickFormatter={(h) => `${h}:00`} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="Events" />
              <Line type="monotone" dataKey="avg_score" stroke="#f97316" strokeWidth={2} dot={false} name="Avg Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 xl:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">High-Risk Corridors</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase text-slate-500">
                  <th className="pb-3 pr-4">Corridor</th>
                  <th className="pb-3 pr-4">Events</th>
                  <th className="pb-3 pr-4">Avg Score</th>
                  <th className="pb-3">Closure Rate</th>
                </tr>
              </thead>
              <tbody>
                {corridors.map((c) => (
                  <tr key={c.corridor} className="border-b border-slate-800/50">
                    <td className="py-3 pr-4 font-medium text-slate-200">{c.corridor}</td>
                    <td className="py-3 pr-4 text-slate-400">{c.count}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                        c.avg_score >= 6 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-300'
                      }`}>{c.avg_score}</span>
                    </td>
                    <td className="py-3 text-slate-400">{(c.closure_rate * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
