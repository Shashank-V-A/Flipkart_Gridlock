import clsx from 'clsx'

interface Option<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={clsx(
            'rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all',
            value === opt.value
              ? 'bg-[var(--color-elevated)] text-[var(--color-fg)] shadow-sm'
              : 'text-[var(--color-muted)] hover:text-[var(--color-fg)]',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
