import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { useSse } from '@/lib/sse'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { StatCard, Panel } from '@/components/motion/primitives'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { motion } from 'motion/react'
import { BarChart3, Download } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

type Report = {
  attendance: {
    totalAttendees: number
    checkedIn: number
    rate: number
    byStatus: { status: string; _count: number }[]
  }
  access: { total: number; granted: number; denied: number; successRate: number; byReason: { reason: string; count: number }[] }
  incidents: { total: number; open: number; resolved: number; bySeverity: { severity: string; _count: number }[] }
  tasks: { total: number; done: number; byPriority: { priority: string; _count: number }[] }
  finance: { totalRevenue: number; ticketsSold: number; avgPrice: number }
}

export function ReportsPage() {
  const { eventId } = useParams()
  const sse = useSse(eventId, 'access')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', eventId, sse],
    queryFn: () => api.get<Report>(`/events/${eventId}/reports`),
  })

  if (isLoading) return <FullPageSpinner />
  if (error || !data) return <InlineError message="Could not load reports." onRetry={refetch} />

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tkt-report-${eventId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const COLORS = ['#FFB020', '#F04444', '#3F8CFF', '#2FD164', '#A1A1AA']

  return (
    <div className="pb-16">
      <PageHeader
        title="Reports"
        subtitle="Operational intelligence across attendance, access, incidents, tasks and finance."
        icon={<BarChart3 className="size-5" />}
        actions={
          <Button variant="outline" onClick={exportJson} icon={<Download className="size-4" />}>
            Export JSON
          </Button>
        }
      />

      <div className="px-6 pt-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Attendance rate" value={`${data.attendance.rate}%`} icon={<BarChart3 className="size-4" />} />
          <StatCard label="Access success" value={`${data.access.successRate}%`} icon={<BarChart3 className="size-4" />} />
          <StatCard label="Incidents resolved" value={`${data.incidents.resolved}/${data.incidents.total}`} icon={<BarChart3 className="size-4" />} />
          <StatCard label="Revenue" value={formatMoney(data.finance.totalRevenue)} icon={<BarChart3 className="size-4" />} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Attendance by status">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.attendance.byStatus} dataKey="_count" nameKey="status" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {data.attendance.byStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#17171a', border: '1px solid #26262b', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Access denials by reason">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.access.byReason} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6d6d76', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="reason"
                    width={130}
                    tick={{ fill: '#a1a1aa', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ background: '#17171a', border: '1px solid #26262b', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Bar dataKey="count" name="Denials" fill="#F04444" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Tasks by priority">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.tasks.byPriority} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="priority" tick={{ fill: '#6d6d76', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6d6d76', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#17171a', border: '1px solid #26262b', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Bar dataKey="_count" name="Tasks" fill="#3F8CFF" radius={[4, 4, 0, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Incidents by severity">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.incidents.bySeverity} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="severity" tick={{ fill: '#6d6d76', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6d6d76', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#17171a', border: '1px solid #26262b', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Bar dataKey="_count" name="Incidents" fill="#F5A524" radius={[4, 4, 0, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-4 grid gap-3 rounded-none border border-line bg-raised/70 p-5 sm:grid-cols-3"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">Revenue</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular text-signal">{formatMoney(data.finance.totalRevenue)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">Tickets sold</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular">{data.finance.ticketsSold}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">Average price</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular">{formatMoney(data.finance.avgPrice)}</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}