export interface Summary {
  total_events: number
  planned_events: number
  unplanned_events: number
  road_closures: number
  avg_congestion_score: number
  avg_duration_hours: number
  high_priority_pct: number
  date_range: { start: string; end: string }
}

export interface ImpactMetrics {
  manual_planning_minutes: number
  automated_planning_seconds: number
  time_saved_per_event_minutes: number
  estimated_annual_hours_saved: number
  events_in_dataset: number
  corridors_covered: number
  zones_covered: number
  model_score_r2?: number
  model_score_mae?: number
  closure_accuracy_pct?: number
}

export interface CorridorRisk {
  corridor: string
  lat: number
  lng: number
  event_count: number
  avg_score: number
  closure_rate: number
  risk_score: number
  risk_level: 'low' | 'moderate' | 'high' | 'critical'
}

export interface LearningInsights {
  entries: number
  avg_score_error: number | null
  avg_duration_error_hours: number | null
  calibrated?: boolean
  avg_score_error_before?: number | null
  avg_score_error_after?: number | null
  avg_duration_error_before?: number | null
  avg_duration_error_after?: number | null
  retrain_count?: number
  message?: string
}

export interface CauseStat {
  cause: string
  count: number
  avg_score: number
  avg_duration_hours: number
  closure_rate: number
}

export interface CorridorStat {
  corridor: string
  count: number
  avg_score: number
  closure_rate: number
}

export interface ZoneStat {
  zone: string
  count: number
  avg_score: number
}

export interface HourlyStat {
  hour: number
  count: number
  avg_score: number
}

export interface MapEvent {
  id: string
  event_type: string
  event_cause: string
  lat: number
  lng: number
  corridor: string
  zone: string
  priority: string
  status: string
  congestion_score: number
  requires_road_closure: boolean
  address: string
  junction: string | null
  start_datetime: string
  duration_hours: number
}

export interface ForecastRequest {
  event_type: string
  event_cause: string
  corridor: string
  zone: string
  priority: string
  latitude: number
  longitude: number
  hour: number
  day_of_week: number
  month: number
  description?: string
  compare_hour?: number
}

export interface ConflictRadar {
  has_conflict: boolean
  conflict_count: number
  compound_risk_pct: number
  corridor_overlaps: Array<{
    id: string
    cause: string
    hour: number
    congestion_score: number
    duration_hours: number
    requires_closure: boolean
  }>
  zone_stress_events: Array<{
    corridor: string
    cause: string
    hour: number
    congestion_score: number
  }>
  adjacent_corridor_alerts: Array<{
    corridor: string
    event_count: number
    avg_score: number
  }>
  message: string
}

export interface SimilarEvent {
  id: string
  event_type: string
  cause: string
  corridor: string
  hour: number
  congestion_score: number
  duration_hours: number
  requires_closure: boolean
  address: string
  junction: string | null
}

export interface DeploymentTimelineItem {
  offset_minutes: number
  label: string
  phase: string
  action: string
}

export interface CitizenImpact {
  estimated_vehicles_affected: number
  avg_delay_minutes: number
  total_delay_vehicle_hours: number
  impact_radius_km: number
  peak_hour_multiplier: number
  summary: string
}

export interface WeatherRisk {
  applied: boolean
  is_raining: boolean
  precipitation_mm: number
  score_adjustment: number
  message: string | null
  condition: string
}

export interface PlanComparison {
  base_hour: number
  alternative_hour: number
  base: {
    hour: number
    congestion_score: number
    estimated_duration_hours: number
    closure_probability: number
    officers: number
    peak_overlap: boolean
  }
  alternative: {
    hour: number
    congestion_score: number
    estimated_duration_hours: number
    closure_probability: number
    officers: number
    peak_overlap: boolean
  }
  delta: {
    congestion_score: number
    duration_hours: number
    closure_probability: number
    officers: number
  }
  recommendation: string
}

export interface ForecastResult {
  congestion_score: number
  congestion_score_ci?: { low: number; high: number }
  severity_label: string
  estimated_duration_hours: number
  duration_hours_ci?: { low: number; high: number }
  closure_probability: number
  peak_hour_warning?: { peak_hour_overlap: boolean; message: string | null }
  calibration_applied?: boolean
  score_drivers?: Array<{ feature: string; value: string; contribution: string }>
  conflict_radar?: ConflictRadar
  similar_events?: SimilarEvent[]
  deployment_timeline?: DeploymentTimelineItem[]
  citizen_impact?: CitizenImpact
  weather?: WeatherRisk
  plan_comparison?: PlanComparison
  alternative_plan?: ForecastResult
  recommendations: {
    manpower: {
      total_officers: number
      traffic_controllers: number
      supervisors: number
      reserve_pool: number
      rationale: string
      data_driven?: boolean
    }
    barricading: {
      count: number
      radius_km: number
      points: Array<{
        id: string
        lat: number
        lng: number
        type: string
        label: string
      }>
      road_closure_recommended: boolean
    }
    diversions: Array<{
      route_id: string
      corridor: string
      priority: number
      estimated_delay_minutes: number
      description: string
    }>
    historical_reference: Record<string, unknown>
    nearby_hotspots: Array<Record<string, unknown>>
    estimated_impact_radius_km: number
    estimated_duration_hours: number
    action_checklist: string[]
  }
  model_metadata: {
    score_mae?: number
    duration_mae_hours?: number
  }
}

export interface Metadata {
  corridors?: string[]
  causes?: string[]
  zones?: string[]
  score_mae?: number
  duration_mae_hours?: number
  closure_accuracy?: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  steps?: AgentStep[]
  parsed?: Record<string, unknown> | null
  forecast?: ForecastResult | null
}

export interface AgentStep {
  agent: string
  action: string
  detail?: Record<string, unknown>
}

export interface ChatResponse {
  reply: string
  intent: string
  steps: AgentStep[]
  parsed: Record<string, unknown> | null
  forecast: ForecastResult | null
  suggestions: string[]
  llm_enhanced?: boolean
  llm_available?: boolean
}
