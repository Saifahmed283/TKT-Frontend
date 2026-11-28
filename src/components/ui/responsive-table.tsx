import { Children, isValidElement, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { EmptyState as TableEmptyState, Table } from './table'
import { Inbox } from 'lucide-react'

type Cell = { label: string; content: ReactNode }
type Row = { key: string; cells: Cell[] }

function toRows(children: ReactNode): { rows: Row[]; empty?: { title: string; body?: string } } {
  const rows: Row[] = []
  let empty: { title: string; body?: string } | undefined

  const visit = (node: ReactNode) => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return
      if (child.type === TableEmptyState) {
        const props = child.props as { title: string; body?: string }
        empty = { title: props.title, body: props.body }
        return
      }
      if (child.type === 'tbody' || child.type === 'thead') {
        if (child.type === 'tbody') visit((child.props as { children?: ReactNode }).children)
        return
      }
      if (child.type !== 'tr') return
      const cells = Children.toArray((child.props as { children?: ReactNode }).children ?? [])
        .map((cell) => ({
          label: '',
          content: isValidElement(cell) ? (cell.props as { children?: ReactNode }).children : cell,
        }))
      rows.push({ key: String(child.key ?? rows.length), cells })
    })
  }

  visit(children)
  return { rows, empty }
}

/** Drop-in Table replacement: full table at sm+, stacked cards below sm with every cell preserved. */
export function ResponsiveTable({
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
  const { rows, empty } = toRows(children)

  return (
    <>
      <div className="hidden sm:block">
        <Table headers={headers} className={className} dense={dense}>
          {children}
        </Table>
      </div>
      <div className="space-y-2 sm:hidden">
        {rows.map((row) => {
          const labeled: Cell[] = row.cells.map((cell, i) => ({ label: headers[i] ?? '', content: cell.content }))
          const primary = labeled[0]?.content
          const fields = labeled.slice(1).filter((cell) => cell.label !== '')
          const actions = labeled.find((cell) => cell.label === '')?.content
          return (
            <section key={row.key} className="panel relative p-3" aria-label={headers.filter(Boolean).join(' · ')}>
              <p className="break-words text-[13px] font-semibold text-ink-0">{primary}</p>
              {fields.length > 0 && (
                <dl className="mt-2">
                  {fields.map((field, i) => (
                    <div key={`${field.label}-${i}`} className="flex items-start justify-between gap-3 border-t border-line-soft py-1.5 text-[12px]">
                      <dt className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">{field.label}</dt>
                      <dd className={cn('min-w-0 break-words text-end text-ink-2')}>{field.content}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {actions != null && actions !== false && (
                <div className="mt-2 flex flex-wrap justify-end gap-2 max-sm:[&_button]:min-h-11 max-sm:[&_button]:min-w-11">
                  {actions}
                </div>
              )}
            </section>
          )
        })}
        {empty && (
          <div className="panel flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Inbox className="size-6 text-ink-3" aria-hidden="true" />
            <p className="text-[13px] font-medium text-ink-2">{empty.title}</p>
            {empty.body && <p className="max-w-sm text-[12px] text-ink-3">{empty.body}</p>}
          </div>
        )}
      </div>
    </>
  )
}
