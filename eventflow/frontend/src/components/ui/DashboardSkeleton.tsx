export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse px-4 py-8 sm:px-8">
      <div className="mb-8 h-8 w-48 rounded-lg bg-[var(--color-elevated)]" />
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card h-28" />
        ))}
      </div>
      <div className="mb-8 h-36 rounded-2xl bg-[var(--color-card)]" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="card h-72" />
        <div className="card h-72" />
        <div className="card h-64 xl:col-span-2" />
      </div>
    </div>
  )
}
