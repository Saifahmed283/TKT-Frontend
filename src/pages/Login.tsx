import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Globe } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { ApiError } from '../lib/api'
import { useLanguage } from '../lib/i18n'
import BrandLogo from '../components/public/BrandLogo'

export default function Login() {
  const { login, user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/app" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('loginError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,162,92,0.12),transparent_35%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex justify-center" aria-label="TKT home"><BrandLogo imageClassName="h-12" /></Link>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.32em] text-signal">{t('loginEyebrow')}</p>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight text-ink-0">{t('loginTitle')}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-3">{t('loginBody')}</p>
        </div>

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
        </form>

        <div className="mt-6 flex justify-center">
          <Link to="/" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3 transition-colors hover:text-signal">
            <Globe size={12} className="text-signal" /> {t('backHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
