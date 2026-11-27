import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { Corners } from '@/components/instruments'
import { formatEgyptDate } from '@/lib/time'

export function ReservationsChart({ data }: { data: { date: string; count: number }[] }) {
  const rows = data ?? []

  return (
    <div className="panel relative p-4">
      <Corners />
      <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-3">
        Public reservations · last 14 days
      </p>
      <div className="h-52 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line-soft)" />
            <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} tick={{ fontSize: 10, fill: 'var(--color-ink-3)' }} minTickGap={24} interval="preserveStartEnd" stroke="var(--color-line-soft)" />
            <YAxis width={30} allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--color-ink-3)' }} stroke="var(--color-line-soft)" />
            <Tooltip
              contentStyle={{
                background: 'var(--color-raised)',
                border: '1px solid var(--color-line-soft)',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: 'var(--color-ink-2)' }}
              labelFormatter={(v) => formatEgyptDate(`${String(v)}T12:00:00Z`, { month: 'short', day: 'numeric' })}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--color-signal)"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: 'var(--color-signal)', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}