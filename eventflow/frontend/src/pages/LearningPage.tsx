import { useEffect, useState } from 'react'
import { Brain, Check, TrendingDown } from 'lucide-react'
import { api } from '../api'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'

export default function LearningPage() {
  const [insights, setInsights] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState({
    predicted_score: 7,
    actual_score: 6,
    predicted_duration_hours: 4,
    actual_duration_hours: 5,
    notes: '',
  })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    api.learning().then(setInsights)
  }, [submitted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.feedback(form)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2000)
  }

  const entries = Number(insights?.entries ?? 0)

  return (
    <div className="px-8 py-8">
      <PageHeader
        title="Learning Loop"
        description="Log actual outcomes vs predictions to improve future forecasts"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)]">
            <Brain className="h-4 w-4 text-[var(--color-accent)]" />
            Model stats
          </h3>
          {entries === 0 ? (
            <p className="text-sm leading-relaxed text-[var(--color-subtle)]">
              No feedback logged yet. Submit post-event data to start the learning loop.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Entries" value={entries} />
              <StatCard
                label="Score error"
                value={String(insights?.avg_score_error ?? '—')}
              />
              <div className="col-span-2">
                <StatCard
                  label="Duration error"
                  value={`${String(insights?.avg_duration_error_hours ?? '—')}h`}
                  hint="Average hours off prediction"
                />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="card p-6">
          <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)]">
            <TrendingDown className="h-4 w-4 text-[var(--color-accent)]" />
            Log outcome
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Predicted score</label>
              <input
                type="number"
                step="0.1"
                min={1}
                max={10}
                value={form.predicted_score}
                onChange={(e) => setForm({ ...form, predicted_score: +e.target.value })}
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
                onChange={(e) => setForm({ ...form, actual_score: +e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Predicted duration (h)</label>
              <input
                type="number"
                step="0.1"
                value={form.predicted_duration_hours}
                onChange={(e) => setForm({ ...form, predicted_duration_hours: +e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Actual duration (h)</label>
              <input
                type="number"
                step="0.1"
                value={form.actual_duration_hours}
                onChange={(e) => setForm({ ...form, actual_duration_hours: +e.target.value })}
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
              className="input resize-none"
            />
          </div>
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
