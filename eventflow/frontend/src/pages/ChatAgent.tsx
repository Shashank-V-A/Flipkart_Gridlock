import { useEffect, useRef, useState } from 'react'
import { Bot, Loader2, MapPin, Send, User } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../api'
import type { ChatMessage } from '../types'

function renderMarkdown(text: string) {
  return text
    .split('\n')
    .map((line, i) => {
      const html = line
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--color-fg)] font-semibold">$1</strong>')
        .replace(/^## (.+)/, '<h3 class="text-base font-semibold text-[var(--color-fg)] mt-4 mb-1.5">$1</h3>')
        .replace(/^### (.+)/, '<h4 class="text-sm font-medium text-[var(--color-muted)] mt-3 mb-1">$1</h4>')
        .replace(/_(.+?)_/g, '<em class="text-[var(--color-subtle)]">$1</em>')
      return (
        <p
          key={i}
          className="text-sm leading-relaxed text-[var(--color-muted)]"
          dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }}
        />
      )
    })
}

function ParsedEventChips({ parsed }: { parsed: Record<string, unknown> }) {
  const chips: string[] = []
  if (parsed._location_label) chips.push(String(parsed._location_label))
  if (parsed.landmark) chips.push(String(parsed.landmark))
  if (parsed.corridor) chips.push(String(parsed.corridor))
  if (parsed.zone) chips.push(String(parsed.zone))
  if (parsed.event_cause) chips.push(String(parsed.event_cause).replace(/_/g, ' '))
  if (parsed.hour != null) chips.push(`${parsed.hour}:00`)
  if (chips.length === 0) return null

  return (
    <div className="mb-3 flex flex-wrap gap-1.5 border-b border-[var(--color-border)] pb-3">
      <MapPin className="mr-0.5 h-3.5 w-3.5 text-[var(--color-accent)]" />
      {chips.map((c) => (
        <span
          key={c}
          className="rounded-md bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted)]"
        >
          {c}
        </span>
      ))}
    </div>
  )
}

export default function ChatAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi — I'm **Namma Trust AI**. Describe any Bengaluru traffic event and I'll forecast impact and recommend a deployment plan.\n\nTry: *Cricket match at Chinnaswamy Stadium Saturday evening*",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.chatSuggestions().then((r) => setSuggestions(r.suggestions)).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const res = await api.chat(text.trim(), history)
      setSuggestions(res.suggestions)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          parsed: res.parsed,
          forecast: res.forecast,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I couldn't process that. ${err instanceof Error ? err.message : 'Backend may be offline.'}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <div className="border-b border-[var(--color-border)] px-4 py-4 sm:px-8 sm:py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-muted)] ring-1 ring-[var(--color-accent)]/20">
            <Bot className="h-5 w-5 text-[var(--color-accent)]" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--color-fg)]">AI Agent</h2>
            <p className="text-xs text-[var(--color-subtle)]">Bengaluru traffic forecasting & deployment plans</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-2xl space-y-5">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={clsx('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}
            >
              <div
                className={clsx(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  msg.role === 'user'
                    ? 'bg-[var(--color-elevated)]'
                    : 'bg-[var(--color-accent-muted)]',
                )}
              >
                {msg.role === 'user' ? (
                  <User className="h-4 w-4 text-[var(--color-muted)]" />
                ) : (
                  <Bot className="h-4 w-4 text-[var(--color-accent)]" />
                )}
              </div>
              <div
                className={clsx(
                  'max-w-[85%] rounded-2xl px-4 py-3',
                  msg.role === 'user'
                    ? 'bg-[var(--color-accent)] text-[#0a0a0b]'
                    : 'card',
                )}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm font-medium">{msg.content}</p>
                ) : (
                  <div className="space-y-0.5">
                    {msg.parsed && <ParsedEventChips parsed={msg.parsed} />}
                    {msg.forecast?.peak_hour_warning?.peak_hour_overlap && (
                      <p className="mb-2 rounded-lg bg-[rgba(251,146,60,0.1)] px-2.5 py-1.5 text-xs text-[var(--color-warning)]">
                        Peak-hour overlap detected
                      </p>
                    )}
                    {renderMarkdown(msg.content)}
                  </div>
                )}
                {msg.forecast && (
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--color-border)] pt-4">
                    {[
                      {
                        label: 'Score',
                        value: msg.forecast.congestion_score_ci
                          ? `${msg.forecast.congestion_score_ci.low}–${msg.forecast.congestion_score_ci.high}`
                          : msg.forecast.congestion_score,
                      },
                      {
                        label: 'Duration',
                        value: msg.forecast.duration_hours_ci
                          ? `${msg.forecast.duration_hours_ci.low}–${msg.forecast.duration_hours_ci.high}h`
                          : `${msg.forecast.estimated_duration_hours}h`,
                      },
                      { label: 'Officers', value: msg.forecast.recommendations.manpower.total_officers },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl bg-[var(--color-surface)] px-2 py-2.5 text-center"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-subtle)]">
                          {stat.label}
                        </p>
                        <p className="mt-0.5 font-mono text-sm font-semibold text-[var(--color-fg)]">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-muted)]">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--color-accent)]" />
              </div>
              <div className="card px-4 py-3">
                <p className="text-sm text-[var(--color-subtle)]">Analyzing event…</p>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {suggestions.length > 0 && !loading && (
        <div className="border-t border-[var(--color-border)] px-4 py-3 sm:px-8">
          <div className="mx-auto flex max-w-2xl flex-wrap gap-2">
            {suggestions.slice(0, 3).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)]/30 hover:text-[var(--color-accent)]"
              >
                {s.length > 55 ? `${s.slice(0, 55)}…` : s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-[var(--color-border)] px-4 py-4 sm:px-8 sm:py-5">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="mx-auto flex max-w-2xl gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe an event — rally on Mysore Road Sunday morning"
            className="input flex-1"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-4">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
