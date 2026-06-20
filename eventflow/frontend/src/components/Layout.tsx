import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bot, Brain, LayoutDashboard, LogOut, MapPin, Menu, Route, X,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext'
import { useApiWarmup } from '../context/ApiWarmupContext'

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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          <img
            src="/namma-trust-logo.png"
            alt="Namma Trust — Bangalore City Traffic Police"
            className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-[var(--color-border)]"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-[var(--color-fg)]">Namma Trust</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--color-subtle)]">
              Traffic Police
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 pb-2">
        {nav.map(({ to, label, icon: Icon, desc }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                'group flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 transition-all',
                isActive
                  ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                  : 'text-[var(--color-muted)] hover:bg-[rgba(42,40,24,0.04)] hover:text-[var(--color-fg)]',
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

      <div className="border-t border-[var(--color-border)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {user && (
          <div className="flex items-center gap-2.5 rounded-xl bg-[var(--color-card)] px-3 py-2.5">
            {user.picture ? (
              <img src={user.picture} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-muted)] text-xs font-bold text-[var(--color-accent)]">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-[var(--color-fg)]">{user.name}</p>
              <p className="truncate text-[10px] text-[var(--color-subtle)]">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-lg p-2 text-[var(--color-subtle)] transition-colors hover:bg-[rgba(42,40,24,0.05)] hover:text-[var(--color-fg)]"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default function Layout() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { warming, slowStart, error, retryWarmup } = useApiWarmup()

  return (
    <div className="app-bg flex min-h-screen">
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] md:flex">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(42,40,24,0.45)]"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <aside className="relative flex h-full w-[min(280px,85vw)] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-2 text-[var(--color-muted)]"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {(warming || error || slowStart) && (
          <div
            className={clsx(
              'shrink-0 border-b px-4 py-2 text-center text-xs sm:px-8',
              error
                ? 'border-[rgba(220,38,38,0.2)] bg-[rgba(220,38,38,0.06)] text-[var(--color-danger)]'
                : 'border-[var(--color-border)] bg-[var(--color-accent-muted)] text-[var(--color-accent)]',
            )}
          >
            {warming && 'Warming up models… first request may take 15–30 seconds on cold start.'}
            {!warming && error && (
              <span>
                API unreachable.{' '}
                <button type="button" className="underline" onClick={retryWarmup}>Retry</button>
              </span>
            )}
            {!warming && !error && slowStart && 'Models loaded — subsequent requests will be faster.'}
          </div>
        )}

        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--color-border)] px-4 sm:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-[var(--color-muted)] md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="truncate text-xs font-medium text-[var(--color-subtle)]">
            {pageTitles[location.pathname] ?? 'Namma Trust'}
          </p>
        </div>
        <main className="flex-1 overflow-auto pb-[env(safe-area-inset-bottom)]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
