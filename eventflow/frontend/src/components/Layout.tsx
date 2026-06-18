import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Bot, Brain, LayoutDashboard, MapPin, Route, Radio,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '../api'

const nav = [
  { to: '/agent', label: 'Agent', icon: Bot, desc: 'Natural language' },
  { to: '/', label: 'Overview', icon: LayoutDashboard, desc: 'Analytics' },
  { to: '/map', label: 'Map', icon: MapPin, desc: 'Event heatmap' },
  { to: '/planner', label: 'Planner', icon: Route, desc: 'Forecast & deploy' },
  { to: '/learning', label: 'Learning', icon: Brain, desc: 'Feedback loop' },
]

const pageTitles: Record<string, string> = {
  '/agent': 'AI Agent',
  '/': 'Overview',
  '/map': 'Live Map',
  '/planner': 'Event Planner',
  '/learning': 'Learning',
}

export default function Layout() {
  const [backendOk, setBackendOk] = useState<boolean | null>(null)
  const [llmOk, setLlmOk] = useState(false)
  const location = useLocation()

  useEffect(() => {
    api.health()
      .then((h) => {
        setBackendOk(true)
        setLlmOk(h.llm_available ?? false)
      })
      .catch(() => setBackendOk(false))
  }, [])

  return (
    <div className="app-bg flex min-h-screen">
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent-muted)] ring-1 ring-[var(--color-accent)]/20">
              <Radio className="h-4 w-4 text-[var(--color-accent)]" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-[var(--color-fg)]">EventFlow</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-subtle)]">
                Bengaluru
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {nav.map(({ to, label, icon: Icon, desc }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all',
                  isActive
                    ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                    : 'text-[var(--color-muted)] hover:bg-white/[0.03] hover:text-[var(--color-fg)]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-none">{label}</p>
                    <p className={clsx(
                      'mt-0.5 truncate text-[10px]',
                      isActive ? 'text-[var(--color-accent)]/70' : 'text-[var(--color-subtle)]',
                    )}>
                      {desc}
                    </p>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2.5 rounded-xl bg-[var(--color-card)] px-3 py-2.5">
            <span className={clsx(
              'h-1.5 w-1.5 shrink-0 rounded-full',
              backendOk === null ? 'bg-[var(--color-warning)]' : backendOk ? 'bg-[var(--color-success)]' : 'bg-[var(--color-danger)]',
            )} />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-[var(--color-fg)]">
                {backendOk === null ? 'Connecting…' : backendOk ? 'System online' : 'Offline'}
              </p>
              {llmOk && backendOk && (
                <p className="text-[10px] text-[var(--color-accent)]">LLM active</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center border-b border-[var(--color-border)] px-8">
          <p className="text-xs font-medium text-[var(--color-subtle)]">
            {pageTitles[location.pathname] ?? 'EventFlow'}
          </p>
        </div>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
