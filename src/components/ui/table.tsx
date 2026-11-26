import type { ReactNode, TdHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'

export function Table({
  headers,
  children,
  className,
  dense = false,
}: {
  headers: string[]
  children: ReactNode
  className?: string
  dense?: boolean
}) {
  return (
    <div className={cn('relative overflow-x-auto border border-line-soft bg-raised/50', className)}>
      <table data-dense={dense || undefined} className={cn('w-full text-left', dense ? 'min-w-[900px]' : 'min-w-[640px]')}>
        <thead>
          <tr className="border-b border-line-soft bg-elevated font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-3">
            {headers.map((h) => (
              <th key={h} scope="col" className="whitespace-nowrap px-3 py-3 sm:px-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">{children}</tbody>
      </table>
    </div>
  )
}

export function Td({
  className,
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <td className={cn('px-3 py-3 align-middle text-[13px] text-ink-2 sm:px-4', className)} {...props}>
      {children}
    </td>
  )
}

export function EmptyState({ colSpan, title, body }: { colSpan: number; title: string; body?: string }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <Inbox className="size-6 text-ink-3" />
          <p className="text-[13px] font-medium text-ink-2">{title}</p>
          {body && <p className="max-w-sm text-[12px] text-ink-3">{body}</p>}
        </div>
      </td>
    </tr>
  )
}

export function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number
  pages: number
  onPage: (page: number) => void
}) {
  const visible = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pages || Math.abs(n - page) <= 1,
  )
  const numbers: (number | 'ellipsis')[] = []
  visible.forEach((n, i) => {
    if (i > 0 && n - visible[i - 1] > 1) numbers.push('ellipsis')
    numbers.push(n)
  })

  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <span className="text-[12px] text-ink-3">
        Page {page} of {pages}
      </span>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="inline-flex size-10 items-center justify-center border border-line-soft text-ink-2 transition-colors hover:bg-raised disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="hidden items-center gap-1.5 sm:flex">
          {numbers.map((n, i) => n === 'ellipsis' ? (
            <span key={`e${i}`} className="grid size-10 place-items-center text-[12px] text-ink-3" aria-hidden="true">…</span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onPage(n)}
              aria-current={n === page ? 'page' : undefined}
              aria-label={`Page ${n}`}
              className={`inline-flex size-10 items-center justify-center border text-[12px] transition-colors ${
                n === page
                  ? 'border-signal/40 bg-signal/10 font-semibold text-signal'
                  : 'border-line-soft text-ink-2 hover:bg-raised'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
          className="inline-flex size-10 items-center justify-center border border-line-soft text-ink-2 transition-colors hover:bg-raised disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  )
}
