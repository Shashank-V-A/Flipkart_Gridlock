import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle, ArrowUp, Bot, Clock, Loader2, MapPin, Shield, Users,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import type { ChatMessage, ForecastResult } from '../types'

const STARTER_PROMPTS = [
  'Cricket match at Chinnaswamy Stadium Saturday evening',
  'Political rally on Mysore Road Sunday morning',
  'VIP convoy through MG Road Friday 6 PM',
]

function renderMarkdown(text: string) {
  return text
    .split('\n')
    .map((line, i) => {
      const html = line
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--color-fg)] font-medium">$1</strong>')
        .replace(/^## (.+)/, '<h3 class="text-[15px] font-semibold text-[var(--color-fg)] mt-4 mb-1">$1</h3>')
        .replace(/^### (.+)/, '<h4 class="text-sm font-medium text-[var(--color-muted)] mt-3 mb-1">$1</h4>')
        .replace(/_(.+?)_/g, '<em class="text-[var(--color-subtle)] not-italic">$1</em>')
      return (
        <p
          key={i}
          className="text-[14px] leading-[1.65] text-[var(--color-muted)]"
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
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      <MapPin className="h-3.5 w-3.5 text-[var(--color-accent)]" strokeWidth={2} />
      {chips.map((c) => (
        <span
          key={c}
          className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-0.5 text-[11px] text-[var(--color-muted)]"
        >
          {c}
        </span>
      ))}
    </div>
  )
}

function ForecastStrip({ forecast }: { forecast: ForecastResult }) {
  const stats = [
    {
      icon: AlertTriangle,
      label: 'Congestion',
      value: forecast.congestion_score_ci
        ? `${forecast.congestion_score_ci.low}–${forecast.congestion_score_ci.high}`
        : String(forecast.congestion_score),
    },
    {
      icon: Clock,
      label: 'Duration',
      value: forecast.duration_hours_ci
        ? `${forecast.duration_hours_ci.low}–${forecast.duration_hours_ci.high}h`
        : `${forecast.estimated_duration_hours}h`,
    },
    {
      icon: Users,
      label: 'Officers',
      value: String(forecast.recommendations.manpower.total_officers),
    },
  ]

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="grid grid-cols-3 divide-x divide-[var(--color-border)]">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="px-3 py-3 text-center sm:px-4">
            <div className="mb-1 flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-subtle)]">
              <Icon className="h-3 w-3" />
              {label}
            </div>
            <p className="font-mono text-base font-semibold text-[var(--color-fg)]">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function WelcomeScreen({
  suggestions,
  onPick,
}: {
  suggestions: string[]
  onPick: (text: string) => void
}) {
  const prompts = (suggestions.length > 0 ? suggestions.slice(0, 3) : STARTER_PROMPTS)

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
          Traffic command
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-fg)] sm:text-[1.65rem]">
          Describe an event in Bengaluru
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-muted)]">
          Natural language forecasts for congestion, duration, and officer deployment — powered by 8,000+ Astram records.
        </p>
      </div>

      <div className="mt-10 w-full max-w-lg space-y-2">
        <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-wider text-[var(--color-subtle)]">
          Try an example
        </p>
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPick(prompt)}
            className="group flex w-full items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3.5 text-left transition-all hover:border-[var(--color-accent)]/35 hover:bg-[var(--color-elevated)]"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-muted)] text-[var(--color-accent)] transition-colors group-hover:bg-[var(--color-accent)]/20">
              <Bot className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <span className="text-sm leading-snug text-[var(--color-muted)] group-hover:text-[var(--color-fg)]">
              {prompt}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-2 text-[11px] text-[var(--color-subtle)]">
        <Shield className="h-3.5 w-3.5" />
        Forecasts include confidence ranges and peak-hour warnings
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-muted)]">
        <Bot className="h-3.5 w-3.5 text-[var(--color-accent)]" strokeWidth={2} />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]"
            style={{ animationDelay: `${i * 180}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function ChatAgent() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isWelcome = messages.length === 0 && !loading

  useEffect(() => {
    api.chatSuggestions().then((r) => setSuggestions(r.suggestions)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isWelcome) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading, isWelcome])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
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
      inputRef.current?.focus()
    }
  }

  const followUps = suggestions.length > 0 ? suggestions.slice(0, 2) : []

  return (
    <div className="relative flex h-[calc(100dvh-3rem)] flex-col">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(45,106,79,0.08), transparent 70%)',
        }}
      />

      <div className="relative flex-1 overflow-y-auto">
        {isWelcome ? (
          <WelcomeScreen suggestions={suggestions} onPick={send} />
        ) : (
          <div className="mx-auto max-w-2xl space-y-6 px-5 py-8 sm:px-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={clsx(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium leading-relaxed text-[var(--color-on-accent)]">
                    {msg.content}
                  </div>
                ) : (
                  <div className="w-full max-w-[92%]">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent-muted)]">
                        <Bot className="h-3.5 w-3.5 text-[var(--color-accent)]" strokeWidth={2} />
                      </div>
                      <span className="text-xs font-medium text-[var(--color-subtle)]">Namma Trust AI</span>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3.5 sm:px-5 sm:py-4">
                      {msg.parsed && <ParsedEventChips parsed={msg.parsed} />}
                      {msg.forecast?.peak_hour_warning?.peak_hour_overlap && (
                        <div className="mb-3 flex items-start gap-2 rounded-lg border border-[rgba(251,146,60,0.2)] bg-[rgba(251,146,60,0.08)] px-3 py-2">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-warning)]" />
                          <p className="text-xs leading-relaxed text-[var(--color-warning)]">
                            Peak-hour overlap — expect higher congestion
                          </p>
                        </div>
                      )}
                      {renderMarkdown(msg.content)}
                      {msg.forecast && <ForecastStrip forecast={msg.forecast} />}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="relative shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          {!isWelcome && followUps.length > 0 && !loading && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-subtle)]">
                Follow-up
              </span>
              {followUps.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2.5 py-1 text-[11px] text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)]/30 hover:text-[var(--color-fg)]"
                >
                  {s.length > 48 ? `${s.slice(0, 48)}…` : s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-1.5 transition-colors focus-within:border-[var(--color-accent)]/40 focus-within:ring-1 focus-within:ring-[var(--color-accent)]/15"
          >
            {user?.picture ? (
              <img
                src={user.picture}
                alt=""
                className="ml-1 hidden h-8 w-8 shrink-0 rounded-lg object-cover sm:block"
              />
            ) : (
              <div className="ml-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-elevated)] text-[10px] font-bold text-[var(--color-muted)] sm:flex">
                {user?.name?.charAt(0) ?? 'U'}
              </div>
            )}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe an event — location, time, type…"
              className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2.5 text-sm text-[var(--color-fg)] outline-none placeholder:text-[var(--color-subtle)]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-[var(--color-on-accent)] transition-all hover:bg-[var(--color-accent)] disabled:opacity-30"
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              )}
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-[var(--color-subtle)]">
            Forecasts are estimates — verify with field intelligence before deployment
          </p>
        </div>
      </div>
    </div>
  )
}
