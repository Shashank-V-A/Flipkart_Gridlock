import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <Icon className="h-5 w-5 text-[var(--color-accent)]" strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-fg)]">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
