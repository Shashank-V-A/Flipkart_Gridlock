import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../api'

interface ApiWarmupContextValue {
  warming: boolean
  warmed: boolean
  slowStart: boolean
  error: string | null
  retryWarmup: () => void
}

const ApiWarmupContext = createContext<ApiWarmupContextValue | null>(null)

export function ApiWarmupProvider({ children }: { children: ReactNode }) {
  const [warming, setWarming] = useState(true)
  const [warmed, setWarmed] = useState(false)
  const [slowStart, setSlowStart] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runWarmup = () => {
    setWarming(true)
    setError(null)
    const started = performance.now()
    api.health()
      .then(() => {
        setWarmed(true)
        setSlowStart(performance.now() - started > 4000)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'API unreachable')
      })
      .finally(() => setWarming(false))
  }

  useEffect(() => {
    runWarmup()
  }, [])

  const value = useMemo(
    () => ({ warming, warmed, slowStart, error, retryWarmup: runWarmup }),
    [warming, warmed, slowStart, error],
  )

  return <ApiWarmupContext.Provider value={value}>{children}</ApiWarmupContext.Provider>
}

export function useApiWarmup() {
  const ctx = useContext(ApiWarmupContext)
  if (!ctx) throw new Error('useApiWarmup must be used within ApiWarmupProvider')
  return ctx
}
