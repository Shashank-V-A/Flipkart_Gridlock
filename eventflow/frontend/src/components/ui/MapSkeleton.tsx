export default function MapSkeleton() {
  return (
    <div className="flex h-full flex-col animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 sm:px-5">
        <div className="h-3 w-40 rounded bg-[var(--color-border)]" />
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded-lg bg-[var(--color-border)]" />
          <div className="h-8 w-28 rounded-lg bg-[var(--color-border)]" />
        </div>
      </div>
      <div className="relative flex-1 bg-[rgba(42,40,24,0.04)]">
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
            <p className="text-sm text-[var(--color-muted)]">Loading map data…</p>
          </div>
        </div>
      </div>
    </div>
  )
}
