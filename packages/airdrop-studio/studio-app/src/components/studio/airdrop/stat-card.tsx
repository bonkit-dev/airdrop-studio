"use client"

export function StatCard({
  label,
  value,
  delta,
  hint,
}: {
  label: string
  value: string
  delta?: string
  hint?: string
}) {
  return (
    <div className="border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 flex items-baseline gap-2 text-2xl font-semibold text-foreground">
        <span>{value}</span>
        {delta ? <span className="text-base font-semibold text-success">+{delta}</span> : null}
      </p>
      {hint ? <p className="mt-2 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
