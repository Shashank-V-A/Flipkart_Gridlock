import { useEffect, useState } from 'react'
import { Brain, Check, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { api } from '../api'
import type { LearningInsights } from '../types'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'

const emptyForm = {
  predicted_score: '',
  actual_score: '',
  predicted_duration_hours: '',
  actual_duration_hours: '',
  notes: '',
}

export default function LearningPage() {
  const [insights, setInsights] = useState<LearningInsights | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [retraining, setRetraining] = useState(false)

  const loadInsights = () => api.learning().then(setInsights)

  useEffect(() => {
    loadInsights()
  }, [submitted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const predicted_score = parseFloat(form.predicted_score)
    const actual_score = parseFloat(form.actual_score)
    const predicted_duration_hours = parseFloat(form.predicted_duration_hours)
    const actual_duration_hours = parseFloat(form.actual_duration_hours)

    if (
      Number.isNaN(predicted_score) || Number.isNaN(actual_score)
      || Number.isNaN(predicted_duration_hours) || Number.isNaN(actual_duration_hours)
    ) {
      setError('Please fill in all score and duration fields.')
      return
    }

    try {
      await api.feedback({
        predicted_score,
        actual_score,
        predicted_duration_hours,
        actual_duration_hours,
        notes: form.notes,
      })
      setForm(emptyForm)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    }
  }

  const handleRetrain = async () => {
    setRetraining(true)
    setError('')
    try {
      await api.retrain()
      await loadInsights()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retrain failed')
    } finally {
      setRetraining(false)
    }
  }

  const entries = insights?.entries ?? 0

  return (
    <div className="px-4 py-8 sm:px-8">
      <PageHeader
        title="Learning Loop"
        description="Log actual outcomes vs predictions, then calibrate models from real feedback"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)]">
              <Brain className="h-4 w-4 text-[var(--color-accent)]" />
              Model stats
            </h3>
            {entries > 0 && (
              <button
                type="button"
                onClick={handleRetrain}
                disabled={retraining}
                className="btn-ghost py-1.5 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${retraining ? 'animate-spin' : ''}`} />
                {retraining ? 'Calibrating…' : 'Calibrate models'}
              </button>
            )}
          </div>

          {entries === 0 ? (
            <p className="text-sm leading-relaxed text-[var(--color-subtle)]">
              No feedback logged yet. Submit post-event data, then calibrate to improve predictions.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Entries" value={entries} />
                <StatCard
                  label="Score error"
                  value={insights?.avg_score_error ?? '—'}
                  hint={insights?.calibrated ? 'After calibration' : 'Before calibration'}
                />
              </div>

              {insights?.calibrated && insights.avg_score_error_before != null && (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-subtle)]">
                    Calibration improvement
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[var(--color-muted)]">Score error</p>
                      <p className="mt-1 font-mono text-[var(--color-fg)]">
                        {insights.avg_score_error_before}
                        <span className="mx-1 text-[var(--color-subtle)]">→</span>
                        <span className="text-[var(--color-success)]">{insights.avg_score_error_after}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--color-muted)]">Duration error</p>
                      <p className="mt-1 font-mono text-[var(--color-fg)]">
                        {insights.avg_duration_error_before}h
                        <span className="mx-1 text-[var(--color-subtle)]">→</span>
                        <span className="text-[var(--color-success)]">{insights.avg_duration_error_after}h</span>
                      </p>
                    </div>
                  </div>
                  {(insights.retrain_count ?? 0) > 0 && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--color-accent)]">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Calibrated {insights.retrain_count} time{insights.retrain_count !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              <StatCard
                label="Duration error"
                value={`${insights?.avg_duration_error_hours ?? '—'}h`}
                hint="Average hours off prediction"
              />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="card p-6">
          <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)]">
            <TrendingDown className="h-4 w-4 text-[var(--color-accent)]" />
            Log outcome
          </h3>
          <p className="mb-4 text-xs leading-relaxed text-[var(--color-subtle)]">
            Enter values from your Planner or Agent forecast, then what actually happened after the event.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Predicted score</label>
              <input
                type="number"
                step="0.1"
                min={1}
                max={10}
                value={form.predicted_score}
                onChange={(e) => setForm({ ...form, predicted_score: e.target.value })}
                placeholder="From forecast"
                className="input"
              />
            </div>
            <div>
              <label className="label">Actual score</label>
              <input
                type="number"
                step="0.1"
                min={1}
                max={10}
                value={form.actual_score}
                onChange={(e) => setForm({ ...form, actual_score: e.target.value })}
                placeholder="After event"
                className="input"
              />
            </div>
            <div>
              <label className="label">Predicted duration (h)</label>
              <input
                type="number"
                step="0.1"
                min={0}
                value={form.predicted_duration_hours}
                onChange={(e) => setForm({ ...form, predicted_duration_hours: e.target.value })}
                placeholder="From forecast"
                className="input"
              />
            </div>
            <div>
              <label className="label">Actual duration (h)</label>
              <input
                type="number"
                step="0.1"
                min={0}
                value={form.actual_duration_hours}
                onChange={(e) => setForm({ ...form, actual_duration_hours: e.target.value })}
                placeholder="After event"
                className="input"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Optional — what differed from prediction"
              className="input resize-none"
            />
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary mt-5 w-full">
            {submitted ? (
              <>
                <Check className="h-4 w-4" />
                Logged
              </>
            ) : (
              'Submit feedback'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
