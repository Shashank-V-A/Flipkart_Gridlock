import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Activity, Brain, LayoutDashboard, MapPin, Route } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../api'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/map', label: 'Live Map', icon: MapPin },
  { to: '/planner', label: 'Event Planner', icon: Route },
  { to: '/learning', label: 'Post-Event Learning', icon: Brain },
]

export default function Layout() {
  const [backendOk, setBackendOk] = useState<boolean | null>(null)

  useEffect(() => {
    api.health()
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false))
  }, [])

  return (
    <div className="flex min-h-screen">
      <aside className="relative flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="border-b border-slate-800 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide text-white">EventFlow AI</h1>
              <p className="text-xs text-slate-400">Bengaluru Traffic Intel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${backendOk === null ? 'bg-yellow-500' : backendOk ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-slate-500">
              {backendOk === null ? 'Checking API...' : backendOk ? 'API connected' : 'API offline — start backend'}
            </span>
          </div>
          <p className="text-xs text-slate-500">Flipkart Grid Hackathon</p>
          <p className="text-xs text-slate-600">Event-Driven Congestion PS</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
