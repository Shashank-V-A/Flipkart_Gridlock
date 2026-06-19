import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { user, loginWithGoogle } = useAuth()
  const location = useLocation()
  const [error, setError] = useState('')

  const from = (location.state as { from?: string } | null)?.from ?? '/agent'

  if (user) {
    return <Navigate to={from} replace />
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-[var(--color-primary)] p-10 lg:flex xl:p-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(253,251,212,0.15), transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(45,106,79,0.4), transparent)',
          }}
        />

        <div className="relative">
          <img
            src="/namma-trust-logo.png"
            alt=""
            className="h-14 w-14 rounded-full object-cover ring-2 ring-[rgba(253,251,212,0.25)]"
          />
        </div>

        <div className="relative max-w-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(253,251,212,0.65)]">
            Bangalore City Traffic Police
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-[var(--color-on-accent)] xl:text-4xl">
            Traffic intelligence for Bengaluru
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[rgba(253,251,212,0.75)]">
            Forecast congestion, plan deployments, and coordinate barricades — powered by 8,000+ real Astram event records.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-[rgba(253,251,212,0.8)]">
            {['AI event forecasting', 'Live corridor maps', 'Officer deployment plans'].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span className="h-1 w-1 rounded-full bg-[var(--color-on-accent)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-[rgba(253,251,212,0.45)]">
          Authorized personnel only
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-[var(--color-bg)] px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <img
              src="/namma-trust-logo.png"
              alt="Namma Trust"
              className="mb-4 h-16 w-16 rounded-full object-cover ring-2 ring-[var(--color-accent)]/30"
            />
            <h2 className="text-xl font-semibold tracking-tight text-[var(--color-fg)]">Namma Trust</h2>
            <p className="mt-1 text-xs text-[var(--color-subtle)]">Bengaluru City Traffic Police</p>
          </div>

          <div className="login-card">
            <div className="mb-8">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--color-fg)]">
                Sign in
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                Use your Google account to access the command centre.
              </p>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={async (res) => {
                  if (!res.credential) {
                    setError('Google did not return a credential. Try again.')
                    return
                  }
                  setError('')
                  try {
                    await loginWithGoogle(res.credential)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Sign-in failed')
                  }
                }}
                onError={() => setError('Google sign-in was cancelled or failed.')}
                theme="outline"
                size="large"
                text="signin_with"
                shape="pill"
                width="300"
              />
            </div>

            {error && (
              <p className="mt-5 rounded-xl border border-[rgba(220,38,38,0.2)] bg-[rgba(220,38,38,0.06)] px-4 py-3 text-center text-sm text-[var(--color-danger)]">
                {error}
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-[var(--color-subtle)]">
            Restricted system · Traffic Police personnel only
          </p>
        </div>
      </div>
    </div>
  )
}
