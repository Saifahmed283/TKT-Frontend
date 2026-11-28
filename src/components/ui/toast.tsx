import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastKind = 'success' | 'error' | 'info' | 'warning'
type ToastItem = { id: number; kind: ToastKind; message: string; title?: string }

const ToastContext = createContext<{ push: (kind: ToastKind, message: string, title?: string) => void } | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return {
    success: (message: string, title?: string) => ctx.push('success', message, title),
    error: (message: string, title?: string) => ctx.push('error', message, title),
    info: (message: string, title?: string) => ctx.push('info', message, title),
    warning: (message: string, title?: string) => ctx.push('warning', message, title),
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const reduceMotion = useReducedMotion()

  const push = useCallback((kind: ToastKind, message: string, title?: string) => {
    const id = Date.now() + Math.random()
    setItems((prev) => [...prev.slice(-3), { id, kind, message, title }])
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4500)
  }, [])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 end-4 z-[100] flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2 sm:bottom-5 sm:end-5"
      >
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'pointer-events-auto relative overflow-hidden  border bg-elevated/95 px-4 py-3 shadow-float backdrop-blur',
                t.kind === 'success' && 'border-ok/30',
                t.kind === 'error' && 'border-danger/30',
                t.kind === 'info' && 'border-info/30',
                t.kind === 'warning' && 'border-signal/30',
              )}
            >
              <div className={cn('absolute inset-y-0 start-0 w-1',
                t.kind === 'success' && 'bg-ok', t.kind === 'error' && 'bg-danger', t.kind === 'info' && 'bg-info', t.kind === 'warning' && 'bg-signal')} />
              <div className="flex items-start gap-3">
                {t.kind === 'success' && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />}
                {t.kind === 'error' && <XCircle className="mt-0.5 size-4 shrink-0 text-danger" />}
                {t.kind === 'info' && <Info className="mt-0.5 size-4 shrink-0 text-info" />}
                {t.kind === 'warning' && <AlertTriangle className="mt-0.5 size-4 shrink-0 text-signal" />}
                <div className="min-w-0 flex-1">
                  {t.title && <p className="text-[12px] font-semibold text-ink">{t.title}</p>}
                  <p className="text-[13px] leading-snug text-ink-2">{t.message}</p>
                </div>
                <button onClick={() => setItems(prev => prev.filter(x => x.id !== t.id))} className="grid size-8 shrink-0 place-items-center text-ink-3 hover:bg-raised hover:text-ink" aria-label="Dismiss"><X className="size-3.5" /></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

