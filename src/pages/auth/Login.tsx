import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Globe } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { ApiError, request } from '../../lib/api'
import { useLanguage } from '../../lib/i18n'
import BrandLogo from '../../components/public/BrandLogo'
import ShinyText from '../../components/reactbits/ShinyText'
import { PageAccents } from '../../components/public/PlayfulBits'

export default function Login() {
  const { login, user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const passHandoff = searchParams.get('passHandoff') === '1'
  const handoffStarted = useRef(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [handoffError, setHandoffError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!passHandoff || !user || handoffStarted.current) return
    handoffStarted.current = true
    let cancelled = false

    void request<{ url: string }>('/passes/handoff', { method: 'POST' })
      .then((result) => {
        if (!cancelled && result?.url) window.location.assign(result.url)
      })
      .catch((err) => {
        if (cancelled) return
        setHandoffError(err instanceof ApiError ? err.message : 'Could not open TKT-PASS')
        handoffStarted.current = false
      })

    return () => { cancelled = true }
  }, [passHandoff, user])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
      if (!passHandoff) navigate('/app', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('loginError'))
    } finally {
      setBusy(false)
    }
  }

  if (user && !passHandoff) return <Navigate to="/app" replace />

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,162,92,0.12),transparent_35%)]" />
      <PageAccents />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex justify-center" aria-label="TKT home"><BrandLogo imageClassName="h-12" /></Link>
          <ShinyText text={t('loginEyebrow')} className="mt-5 text-[11px] font-medium uppercase tracking-[0.2em]" color="var(--color-signal)" shineColor="var(--color-ink-0)" speed={3.2} />
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink-0">{t('loginTitle')}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-3">{t('loginBody')}</p>
        </div>

        {user && passHandoff ? (
          <div className="panel relative space-y-4 p-6 text-center shadow-float">
            <p className="text-sm font-semibold text-ink-0">Opening TKT-PASS…</p>
            <p className="text-xs text-ink-3">Signed handoff in progress.</p>
            {handoffError && (
              <>
                <p className="border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">{handoffError}</p>
                <button
                  type="button"
                  className="btn-primary w-full"
                  onClick={() => {
                    handoffStarted.current = false
                    setHandoffError(null)
                    window.location.reload()
                  }}
                >
                  Retry
                </button>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="panel relative space-y-4 p-6 shadow-float">
            <div>
              <label className="label mb-1.5 block" htmlFor="email">{t('email')}</label>
              <input id="email" type="email" autoComplete="email" className="input" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label mb-1.5 block" htmlFor="password">{t('password')}</label>
              <input id="password" type="password" autoComplete="current-password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
              {busy ? t('signingIn') : t('signIn')}
              {!busy && <ArrowRight size={15} />}
            </button>
            {passHandoff && <p className="text-center text-[11px] text-ink-3">You’ll be taken to TKT-PASS after signing in.</p>}
          </form>
        )}

        <div className="mt-6 flex justify-center">
          <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3 transition-colors hover:text-signal">
            <Globe size={12} className="text-signal" /> {t('backHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
