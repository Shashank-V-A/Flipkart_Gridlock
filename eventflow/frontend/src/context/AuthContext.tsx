import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, clearAuthToken, getAuthToken, setAuthToken } from '../api'

export interface User {
  sub: string
  email: string
  name: string
  picture?: string | null
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  loginWithGoogle: (credential: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      setLoading(false)
      return
    }

    api.me()
      .then(setUser)
      .catch(() => {
        clearAuthToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const loginWithGoogle = useCallback(async (credential: string) => {
    const res = await api.googleLogin(credential)
    setAuthToken(res.access_token)
    setUser(res.user)
  }, [])

  const logout = useCallback(() => {
    clearAuthToken()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, loginWithGoogle, logout }),
    [user, loading, loginWithGoogle, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
