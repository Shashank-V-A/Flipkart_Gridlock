import type { ForecastResult } from '../types'

const emptyForm = {
  event_type: 'planned',
  event_cause: '',
  corridor: '',
  zone: '',
  priority: '',
  hour: '',
  day_of_week: '',
  month: '',
  latitude: '',
  longitude: '',
  description: '',
}

export const PLANNER_DEMO_SCENARIOS = [
  {
    label: 'Cricket match',
    form: {
      ...emptyForm,
      event_type: 'planned',
      event_cause: 'public_event',
      corridor: 'CBD 2',
      zone: 'Central Zone 2',
      priority: 'High',
      hour: '18',
      day_of_week: '6',
      month: '3',
      latitude: '12.9788',
      longitude: '77.5995',
      description: 'Cricket match at Chinnaswamy Stadium',
    },
  },
  {
    label: 'Political rally',
    form: {
      ...emptyForm,
      event_type: 'planned',
      event_cause: 'protest',
      corridor: 'Mysore Road',
      zone: 'South Zone 1',
      priority: 'High',
      hour: '10',
      day_of_week: '0',
      month: '6',
      latitude: '12.9141',
      longitude: '77.5731',
      description: 'Political rally on Mysore Road',
    },
  },
  {
    label: 'Tree fall',
    form: {
      ...emptyForm,
      event_type: 'unplanned',
      event_cause: 'tree_fall',
      corridor: 'Hosur Road',
      zone: 'South Zone 2',
      priority: 'High',
      hour: '17',
      day_of_week: '2',
      month: '7',
      latitude: '12.9165',
      longitude: '77.6101',
      description: 'Tree fall blocking Hosur Road',
    },
  },
] as const

export function buildDeploymentBrief(
  form: Record<string, string>,
  result: ForecastResult,
): string {
  const rec = result.recommendations
  const mp = rec.manpower
  const bar = rec.barricading
  const lines = [
    'NAMMA TRUST — DEPLOYMENT BRIEF',
    'Bangalore City Traffic Police',
    '================================',
    '',
    `Generated: ${new Date().toLocaleString('en-IN')}`,
    '',
    'EVENT',
    `  Type: ${form.event_type}`,
    `  Cause: ${form.event_cause.replace(/_/g, ' ')}`,
    `  Corridor: ${form.corridor}`,
    `  Zone: ${form.zone}`,
    `  Priority: ${form.priority}`,
    `  Time: ${form.hour}:00 · Day ${form.day_of_week} · Month ${form.month}`,
    `  Location: ${form.latitude}, ${form.longitude}`,
    form.description ? `  Notes: ${form.description}` : '',
    '',
    'FORECAST',
    `  Severity: ${result.severity_label} (${result.congestion_score}/10)`,
    `  Duration: ${result.estimated_duration_hours} hours`,
    `  Road closure risk: ${(result.closure_probability * 100).toFixed(0)}%`,
  ]

  if (result.peak_hour_warning?.peak_hour_overlap && result.peak_hour_warning.message) {
    lines.push(`  Peak hour: ${result.peak_hour_warning.message}`)
  }

  if (result.score_drivers?.length) {
    lines.push('', 'KEY DRIVERS')
    result.score_drivers.forEach((d) => {
      lines.push(`  • ${d.feature} (${d.value}) — ${d.contribution}`)
    })
  }

  lines.push(
    '',
    'MANPOWER',
    `  Total officers: ${mp.total_officers}`,
    `  Traffic controllers: ${mp.traffic_controllers}`,
    `  Supervisors: ${mp.supervisors}`,
    `  Reserve pool: ${mp.reserve_pool}`,
    `  Rationale: ${mp.rationale}`,
    '',
    'BARRICADING',
    `  Points: ${bar.count}`,
    `  Radius: ${bar.radius_km} km`,
    `  Road closure recommended: ${bar.road_closure_recommended ? 'Yes' : 'No'}`,
    '',
    'DIVERSION ROUTES',
  )

  rec.diversions.forEach((d) => {
    lines.push(`  ${d.priority}. ${d.corridor} (+${d.estimated_delay_minutes} min) — ${d.description}`)
  })

  lines.push('', 'ACTION CHECKLIST')
  rec.action_checklist.forEach((item, i) => lines.push(`  ${i + 1}. ${item}`))
  lines.push('', '— End of brief —')

  return lines.filter(Boolean).join('\n')
}

export function printDeploymentBrief(form: Record<string, string>, result: ForecastResult) {
  const text = buildDeploymentBrief(form, result)
  const win = window.open('', '_blank', 'width=800,height=900')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><title>Deployment Brief</title>
<style>
body{font-family:Georgia,serif;max-width:720px;margin:2rem auto;padding:0 1rem;color:#1B4332;line-height:1.5}
pre{white-space:pre-wrap;font-family:Consolas,monospace;font-size:12px;background:#FDFBD4;padding:1.5rem;border:1px solid #ccc}
h1{font-size:1.25rem;margin-bottom:0.5rem}
@media print{body{margin:0} pre{border:none}}
</style></head><body>
<h1>Namma Trust — Deployment Brief</h1>
<pre>${text.replace(/</g, '&lt;')}</pre>
<script>window.onload=function(){window.print()}</script>
</body></html>`)
  win.document.close()
}
