import type { ReservationWizard } from './useReservationWizard'

export function DetailsStep({ w }: { w: ReservationWizard }) {
  const { t, name, setName, email, setEmail, phone, setPhone, notes, setNotes, phoneValid } = w
  return (
    <div data-testid="wizard-step-details" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label mb-1.5 block" htmlFor="res-name">{t('fullName')}</label>
          <input id="res-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </div>
        <div>
          <label className="label mb-1.5 block" htmlFor="res-email">{t('email')}</label>
          <input id="res-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <label className="label mb-1.5 block" htmlFor="res-phone">{t('phone')}</label>
          <input id="res-phone" data-testid="reservation-phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
          {phone && !phoneValid && <p className="mt-1 text-[11px] text-danger">{t('phoneRequired')}</p>}
        </div>
      </div>
      <div>
        <label className="label mb-1.5 block" htmlFor="res-notes">{t('customization')}</label>
        <textarea id="res-notes" data-testid="reservation-notes" className="input min-h-20" maxLength={1000} placeholder={t('customizationPlaceholder')} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </div>
  )
}
