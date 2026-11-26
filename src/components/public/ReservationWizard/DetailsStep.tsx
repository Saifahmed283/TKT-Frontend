import type { ReservationWizard } from './useReservationWizard'

export function DetailsStep({ w }: { w: ReservationWizard }) {
  const {
    t, lang, name, setName, email, setEmail, phone, setPhone, phoneValid,
    gender, setGender, nationality, setNationality, identityNumber, setIdentityNumber, identityValid,
  } = w
  const isAr = lang === 'ar'
  const identityLabel = nationality === 'EG'
    ? (isAr ? 'الرقم القومي المصري' : 'Egyptian National ID')
    : (isAr ? 'رقم جواز السفر' : 'Passport number')
  return (
    <div data-testid="wizard-step-details" className="space-y-4">
      <div className="rounded-lg border border-line-soft bg-elevated/20 px-3 py-2">
        <p className="text-[11px] font-semibold text-ink-1">{isAr ? 'بيانات صاحب الحجز' : 'Attendee information'}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-ink-3">{isAr ? 'اكتب البيانات كما تظهر في وثيقة الهوية. ستُراجع قبل إصدار التذكرة.' : 'Enter details exactly as shown on the identity document. They are checked before the ticket is issued.'}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label mb-1.5 block" htmlFor="res-name">{t('fullName')}</label>
          <input id="res-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} autoComplete="name" autoCapitalize="words" />
        </div>
        <div>
          <label className="label mb-1.5 block" htmlFor="res-email">{t('email')}</label>
          <input id="res-email" type="email" inputMode="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" maxLength={254} />
        </div>
        <div>
          <label className="label mb-1.5 block" htmlFor="res-phone">{t('phone')}</label>
          <input id="res-phone" data-testid="reservation-phone" type="tel" inputMode="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" maxLength={24} aria-invalid={!!phone && !phoneValid} placeholder="+20 10 1234 5678" />
          {phone && !phoneValid && <p className="mt-1 text-[11px] text-danger">{isAr ? 'أدخل رقمًا صحيحًا من 8 إلى 15 رقمًا مع رمز الدولة إن أمكن.' : 'Enter a valid phone number with 8–15 digits, including country code when possible.'}</p>}
        </div>
        <div>
          <label className="label mb-1.5 block" htmlFor="res-gender">{isAr ? 'النوع' : 'Gender'}</label>
          <select id="res-gender" className="input" value={gender} onChange={(e) => setGender(e.target.value as typeof gender)} required>
            <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
            <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
            <option value="other">{isAr ? 'آخر' : 'Other'}</option>
            <option value="prefer_not_to_say">{isAr ? 'أفضل عدم الإفصاح' : 'Prefer not to say'}</option>
          </select>
        </div>
        <div>
          <label className="label mb-1.5 block" htmlFor="res-nationality">{isAr ? 'الجنسية' : 'Nationality'}</label>
          <select id="res-nationality" className="input" value={nationality} onChange={(e) => { setNationality(e.target.value as typeof nationality); setIdentityNumber('') }} required>
            <option value="EG">{isAr ? 'مصري' : 'Egyptian'}</option>
            <option value="OTHER">{isAr ? 'غير مصري' : 'Non-Egyptian'}</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label mb-1.5 block" htmlFor="res-identity">{identityLabel}</label>
          <input
            id="res-identity"
            data-testid="reservation-identity"
            className="input font-mono tracking-wider"
            type="text"
            inputMode={nationality === 'EG' ? 'numeric' : 'text'}
            autoComplete="off"
            spellCheck={false}
            dir="ltr"
            value={identityNumber}
            onChange={(e) => setIdentityNumber(nationality === 'EG' ? e.target.value.replace(/\D/g, '').slice(0, 14) : e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20))}
            required
            maxLength={20}
            aria-invalid={!!identityNumber && !identityValid}
            placeholder={nationality === 'EG' ? '14 digits' : 'Passport number'}
          />
          {identityNumber && !identityValid && <p className="mt-1 text-[11px] text-danger">{nationality === 'EG' ? (isAr ? 'الرقم القومي المصري يجب أن يتكون من 14 رقمًا.' : 'Egyptian National ID must contain exactly 14 digits.') : (isAr ? 'رقم جواز السفر يجب أن يكون من 5 إلى 20 حرفًا أو رقمًا.' : 'Passport number must contain 5–20 letters or digits.')}</p>}
          <p className="mt-1 text-[10px] text-ink-3">{isAr ? 'تُستخدم هذه البيانات لمطابقة الحجز والتحقق من أحقية الدخول فقط.' : 'Used only to match the reservation and verify admission eligibility.'}</p>
        </div>
      </div>
      <div>
        <label className="label mb-1.5 block" htmlFor="res-notes">{t('customization')}</label>
        <textarea id="res-notes" data-testid="reservation-notes" className="input min-h-20" maxLength={1000} placeholder={t('customizationPlaceholder')} value={w.notes} onChange={(e) => w.setNotes(e.target.value)} />
      </div>
    </div>
  )
}
