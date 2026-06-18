import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { Shield } from 'lucide-react'
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
    <div className="app-bg flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <img
              src="/namma-trust-logo.png"
              alt="Namma Trust"
              className="mb-5 h-20 w-20 rounded-full object-cover ring-2 ring-[var(--color-border)]"
            />
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-fg)]">
              Namma Trust
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
              Bengaluru City Traffic Police — authorized access only
            </p>
          </div>

          <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
            <Shield className="h-5 w-5 shrink-0 text-[var(--color-accent)]" />
            <p className="text-xs leading-relaxed text-[var(--color-subtle)]">
              Sign in with your Google account to access traffic intelligence, forecasting, and deployment tools.
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
              theme="filled_black"
              size="large"
              text="signin_with"
              shape="pill"
              width="320"
            />
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-center text-sm text-[var(--color-danger)]">
              {error}
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-subtle)]">
          Restricted system · Bangalore City Traffic Police personnel only
        </p>
      </div>
    </div>
  )
}
