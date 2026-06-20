import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { user, loginWithGoogle } = useAuth()
  const location = useLocation()
  const [error, setError] = useState('')
  const [googleBtnWidth, setGoogleBtnWidth] = useState(300)

  const from = (location.state as { from?: string } | null)?.from ?? '/agent'

  useEffect(() => {
    const updateWidth = () => {
      const rightPanel = Math.max(window.innerWidth * 0.56 - 48, 180)
      setGoogleBtnWidth(Math.min(300, rightPanel))
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  if (user) {
    return <Navigate to={from} replace />
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative flex w-[44%] shrink-0 flex-col justify-between overflow-hidden bg-[var(--color-primary)] p-5 sm:p-8 xl:p-14">
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
            className="h-10 w-10 rounded-full object-cover ring-2 ring-[rgba(253,251,212,0.25)] sm:h-14 sm:w-14"
          />
        </div>

        <div className="relative max-w-sm">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[rgba(253,251,212,0.65)] sm:text-[11px] sm:tracking-[0.18em]">
            Bangalore City Traffic Police
          </p>
          <h1 className="mt-3 text-lg font-semibold leading-tight tracking-tight text-[var(--color-on-accent)] sm:mt-4 sm:text-3xl xl:text-4xl">
            Traffic intelligence for Bengaluru
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-[rgba(253,251,212,0.75)] sm:mt-4 sm:text-sm">
            Forecast congestion, plan deployments, and coordinate barricades — powered by 8,000+ real Astram event records.
          </p>

          <ul className="mt-5 space-y-2 text-xs text-[rgba(253,251,212,0.8)] sm:mt-8 sm:space-y-3 sm:text-sm">
            {['AI event forecasting', 'Live corridor maps', 'Officer deployment plans'].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--color-on-accent)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[9px] text-[rgba(253,251,212,0.45)] sm:text-[11px]">
          Authorized personnel only
        </p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-center justify-center bg-[var(--color-bg)] px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-[380px]">
          <div className="login-card p-5 sm:p-8">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg font-semibold tracking-tight text-[var(--color-fg)] sm:text-xl">
                Sign in
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)] sm:text-sm">
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
                width={googleBtnWidth}
              />
            </div>

            {error && (
              <p className="mt-5 rounded-xl border border-[rgba(220,38,38,0.2)] bg-[rgba(220,38,38,0.06)] px-4 py-3 text-center text-sm text-[var(--color-danger)]">
                {error}
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-[10px] leading-relaxed text-[var(--color-subtle)] sm:text-[11px]">
            Restricted system · Traffic Police personnel only
          </p>
        </div>
      </div>
    </div>
  )
}
