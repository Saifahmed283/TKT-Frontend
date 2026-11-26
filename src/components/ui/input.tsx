import { Children, cloneElement, isValidElement, useId, type InputHTMLAttributes, type ReactElement, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const base =
  'w-full border border-line bg-elevated px-3.5 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-signal/50 focus:ring-2 focus:ring-signal/15'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, 'h-10', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, 'py-2.5 leading-relaxed', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(base, 'h-10 appearance-none pr-8 bg-no-repeat', className)} {...props}>
      {children}
    </select>
  )
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  const generatedId = useId()
  const hintId = `${generatedId}-hint`
  const child = Children.count(children) === 1 && isValidElement(children)
    ? children as ReactElement<{ id?: string; 'aria-describedby'?: string }>
    : null
  const controlId = child?.props.id ?? generatedId
  const describedBy = hint
    ? [child?.props['aria-describedby'], hintId].filter(Boolean).join(' ')
    : child?.props['aria-describedby']
  const control = child
    ? cloneElement(child, { id: controlId, 'aria-describedby': describedBy })
    : children

  return (
    <label htmlFor={controlId} className={cn('block', className)}>
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-2">{label}</span>
        {hint && <span id={hintId} className="text-[11px] text-ink-3">{hint}</span>}
      </span>
      {control}
    </label>
  )
}
