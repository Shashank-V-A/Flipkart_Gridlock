import type {
  CauseStat,
  CorridorStat,
  ForecastRequest,
  ForecastResult,
  HourlyStat,
  MapEvent,
  Metadata,
  Summary,
  ZoneStat,
} from './types'

const BASE = '/api'

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  health: () => fetchJson<{ status: string; models_loaded: boolean }>('/health'),
  metadata: () => fetchJson<Metadata>('/metadata'),
  summary: () => fetchJson<Summary>('/analytics/summary'),
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
  learning: () => fetchJson<Record<string, unknown>>('/learning'),
}
