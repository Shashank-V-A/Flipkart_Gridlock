import { useEffect, useState } from 'react'
import { Brain, TrendingDown } from 'lucide-react'
import { api } from '../api'

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

  return (
    <div className="p-8">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-white">Post-Event Learning</h2>
        <p className="text-sm text-slate-400">
          Log actual outcomes vs predictions to improve future forecasts
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-300">
            <Brain className="h-4 w-4 text-purple-400" /> Model Learning Stats
          </h3>
          {insights?.entries === 0 ? (
            <p className="text-sm text-slate-500">No feedback logged yet. Submit post-event data to start the learning loop.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-800/50 p-4">
                  <p className="text-xs text-slate-500">Feedback Entries</p>
                  <p className="text-2xl font-bold text-white">{String(insights?.entries ?? 0)}</p>
                </div>
                <div className="rounded-lg bg-slate-800/50 p-4">
                  <p className="text-xs text-slate-500">Avg Score Error</p>
                  <p className="text-2xl font-bold text-white">{String(insights?.avg_score_error ?? '—')}</p>
                </div>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-4">
                <p className="text-xs text-slate-500">Avg Duration Error (hours)</p>
                <p className="text-2xl font-bold text-white">{String(insights?.avg_duration_error_hours ?? '—')}</p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-300">
            <TrendingDown className="h-4 w-4 text-blue-400" /> Log Post-Event Outcome
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Predicted Score</label>
              <input type="number" step="0.1" min={1} max={10} value={form.predicted_score}
                onChange={(e) => setForm({ ...form, predicted_score: +e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Actual Score</label>
              <input type="number" step="0.1" min={1} max={10} value={form.actual_score}
                onChange={(e) => setForm({ ...form, actual_score: +e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Predicted Duration (h)</label>
              <input type="number" step="0.1" value={form.predicted_duration_hours}
                onChange={(e) => setForm({ ...form, predicted_duration_hours: +e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Actual Duration (h)</label>
              <input type="number" step="0.1" value={form.actual_duration_hours}
                onChange={(e) => setForm({ ...form, actual_duration_hours: +e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-xs text-slate-500">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
          </div>
          <button type="submit"
            className="mt-4 w-full rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-500">
            {submitted ? 'Logged!' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  )
}
