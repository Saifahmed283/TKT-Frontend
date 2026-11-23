import { AnimatePresence, motion } from 'motion/react'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, Info, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Corners } from '../instruments'

export function Dialog({
  open,
  onClose,
  title,
  children,
  wide,
  className,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  wide?: boolean
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              'tkt-window relative w-full overflow-hidden border border-signal/35 bg-elevated shadow-float',
              wide ? 'max-w-2xl' : 'max-w-md',
              className,
            )}
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between border-b border-signal/20 bg-raised/40 px-5 py-3.5">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>
            <Corners />
            <span className="tkt-window-corner" aria-hidden="true" />
            <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

type DialogTone = 'danger' | 'default' | 'warning' | 'success'
type ConfirmOptions = {
  title: string
  body: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: DialogTone
  icon?: ReactNode
}
type AlertOptions = Omit<ConfirmOptions, 'cancelLabel' | 'confirmLabel'> & { confirmLabel?: string }
type PromptOptions = ConfirmOptions & { placeholder?: string; defaultValue?: string; inputLabel?: string }

type DialogState =
  | ({ kind: 'confirm' } & ConfirmOptions & { resolve: (v: boolean) => void })
  | ({ kind: 'alert' } & AlertOptions & { resolve: () => void })
  | ({ kind: 'prompt' } & PromptOptions & { resolve: (v: string | null) => void; value: string })

const DialogContext = createContext<{
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  alert: (opts: AlertOptions) => Promise<void>
  prompt: (opts: PromptOptions) => Promise<string | null>
} | null>(null)

export function useConfirm() {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>')
  return ctx.confirm
}
export function useDialog() {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialog must be used within <ConfirmProvider>')
  return ctx
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => new Promise<boolean>((resolve) => {
    setState({ kind: 'confirm', ...opts, resolve })
  }), [])
  const alert = useCallback((opts: AlertOptions) => new Promise<void>((resolve) => {
    setState({ kind: 'alert', ...opts, resolve })
  }), [])
  const prompt = useCallback((opts: PromptOptions) => new Promise<string | null>((resolve) => {
    setState({ kind: 'prompt', ...opts, value: opts.defaultValue ?? '', resolve })
  }), [])

  const close = (value: boolean | string | null) => {
    if (!state) return
    if (state.kind === 'confirm') state.resolve(Boolean(value))
    if (state.kind === 'alert') state.resolve()
    if (state.kind === 'prompt') state.resolve(typeof value === 'string' ? value : null)
    setState(null)
  }

  const tone = state?.tone ?? (state?.kind === 'alert' ? 'default' : 'danger')
  const Icon = tone === 'danger' ? Trash2 : tone === 'warning' ? AlertTriangle : tone === 'success' ? Info : Info
  const confirmVariant = tone === 'danger' ? 'danger' : 'default'

  return (
    <DialogContext.Provider value={{ confirm, alert, prompt }}>
      {children}
      <Dialog open={!!state} onClose={() => close(state?.kind === 'prompt' ? null : false)} title={state?.title ?? 'Confirm'}>
        <div className="flex gap-3">
          <div className={cn('mt-0.5 grid size-10 shrink-0 place-items-center border rounded-none',
            tone === 'danger' && 'border-danger/30 bg-danger/10 text-danger',
            tone === 'warning' && 'border-signal/30 bg-signal/10 text-signal',
            tone === 'success' && 'border-ok/30 bg-ok/10 text-ok',
            tone === 'default' && 'border-info/30 bg-info/10 text-info')}>
            {state?.icon ?? <Icon className="size-5" />}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="text-[13px] leading-relaxed text-ink-2">{state?.body}</div>
            {state?.kind === 'prompt' && (
              <label className="block">
                {state.inputLabel && <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">{state.inputLabel}</span>}
                <input autoFocus className="input w-full" value={state.value} placeholder={state.placeholder} onChange={e => setState(s => s?.kind === 'prompt' ? { ...s, value: e.target.value } : s)} />
              </label>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          {state?.kind !== 'alert' && <Button variant="ghost" onClick={() => close(state?.kind === 'prompt' ? null : false)}>{state?.cancelLabel ?? 'Cancel'}</Button>}
          <Button variant={confirmVariant} onClick={() => close(state?.kind === 'prompt' ? (state.value) : true)}>{state?.confirmLabel ?? (state?.kind === 'alert' ? 'OK' : 'Confirm')}</Button>
        </div>
      </Dialog>
    </DialogContext.Provider>
  )
}

/** Declarative wrapper around the imperative confirm system. */
export function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Confirm',
  onConfirm,
  children,
  tone = 'danger',
}: {
  title: string
  body: ReactNode
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
  children: ReactNode
  tone?: DialogTone
}) {
  const confirm = useConfirm()
  return (
    <span onClick={async () => { if (await confirm({ title, body, confirmLabel, tone })) await onConfirm() }}>{children}</span>
  )
}
