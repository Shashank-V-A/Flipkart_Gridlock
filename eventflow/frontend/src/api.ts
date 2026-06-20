import type {
  CauseStat,
  ChatResponse,
  CorridorRisk,
  CorridorStat,
  ForecastRequest,
  ForecastResult,
  HourlyStat,
  ImpactMetrics,
  LearningInsights,
  MapEvent,
  Metadata,
  Summary,
  ZoneStat,
} from './types'

const BASE = '/api'
const TOKEN_KEY = 'namma_trust_token'

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401 && path !== '/auth/google') {
    clearAuthToken()
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
    throw new Error('Session expired. Please sign in again.')
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    const text = await res.text()
    try {
      const body = JSON.parse(text) as { detail?: string }
      if (body.detail) message = typeof body.detail === 'string' ? body.detail : message
    } catch {
      if (text) message = text.slice(0, 300)
    }
    throw new Error(message)
  }
  return res.json()
}

export interface AuthUser {
  sub: string
  email: string
  name: string
  picture?: string | null
}

export const api = {
  googleLogin: (credential: string) =>
    fetchJson<{ access_token: string; user: AuthUser }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),
  me: () => fetchJson<AuthUser>('/auth/me'),
  health: () => fetchJson<{ status: string; models_loaded: boolean; llm_available?: boolean }>('/health'),
  metadata: () => fetchJson<Metadata>('/metadata'),
  summary: () => fetchJson<Summary>('/analytics/summary'),
  impact: () => fetchJson<ImpactMetrics>('/analytics/impact'),
  corridorRisk: () => fetchJson<CorridorRisk[]>('/analytics/corridor-risk'),
  causes: () => fetchJson<CauseStat[]>('/analytics/causes'),
  corridors: () => fetchJson<CorridorStat[]>('/analytics/corridors'),
  zones: () => fetchJson<ZoneStat[]>('/analytics/zones'),
  hourly: () => fetchJson<HourlyStat[]>('/analytics/hourly'),
  mapEvents: (eventType?: string) =>
    fetchJson<MapEvent[]>(`/events/map?limit=800${eventType ? `&event_type=${eventType}` : ''}`),
  forecast: (body: ForecastRequest) =>
    fetchJson<ForecastResult>('/forecast', { method: 'POST', body: JSON.stringify(body) }),
  feedback: (body: Record<string, unknown>) =>
    fetchJson<Record<string, unknown>>('/feedback', { method: 'POST', body: JSON.stringify(body) }),
  learning: () => fetchJson<LearningInsights>('/learning'),
  retrain: () =>
    fetchJson<Record<string, unknown>>('/learning/retrain', { method: 'POST' }),
  chat: (message: string, history: { role: string; content: string }[] = []) =>
    fetchJson<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
  chatSuggestions: () => fetchJson<{ suggestions: string[] }>('/chat/suggestions'),
}
