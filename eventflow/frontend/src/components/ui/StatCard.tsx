interface StatCardProps {
  label: string
  value: string | number
  hint?: React.ReactNode
  trend?: 'neutral' | 'warning' | 'success'
}

const trendBorder = {
  neutral: 'border-l-[var(--color-border-strong)]',
  warning: 'border-l-[var(--color-warning)]',
  success: 'border-l-[var(--color-success)]',
}

export default function StatCard({ label, value, hint, trend = 'neutral' }: StatCardProps) {
  return (
    <div className={`card border-l-2 ${trendBorder[trend]} p-5`}>
      <p className="label mb-3">{label}</p>
      <p className="text-3xl font-semibold tracking-tight text-[var(--color-fg)]">{value}</p>
      {hint && <div className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">{hint}</div>}
    </div>
  )
}
