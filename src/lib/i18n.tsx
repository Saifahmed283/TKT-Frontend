import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'ar'

const STORAGE_KEY = 'tkt_lang'

const dict = {
  // Shell / app
  workspace: { en: 'Workspace', ar: 'مساحة العمل' },
  event: { en: 'Event', ar: 'الفعالية' },
  signOut: { en: 'Sign out', ar: 'تسجيل الخروج' },
  allSystemsNominal: { en: 'All systems nominal', ar: 'جميع الأنظمة تعمل' },
  jumpTo: { en: 'Jump to anything…', ar: 'انتقل إلى أي شيء…' },
  apiStable: { en: 'API stable', ar: 'الخادم مستقر' },
  sseLive: { en: 'SSE live', ar: 'البث المباشر' },
  overview: { en: 'Overview', ar: 'نظرة عامة' },
  events: { en: 'Events', ar: 'الفعاليات' },
  organizations: { en: 'Organizations', ar: 'المنظمات' },
  scanner: { en: 'Scanner', ar: 'الماسح الضوئي' },
  guide: { en: 'Guide', ar: 'الدليل' },
  attendees: { en: 'Attendees', ar: 'الحضور' },
  tickets: { en: 'Tickets', ar: 'التذاكر' },
  reservations: { en: 'Reservations', ar: 'الحجوزات' },
  credentials: { en: 'Credentials', ar: 'الاعتمادات' },
  accessLog: { en: 'Access log', ar: 'سجل الدخول' },
  tasks: { en: 'Tasks', ar: 'المهام' },
  incidents: { en: 'Incidents', ar: 'البلاغات' },
  comms: { en: 'Comms', ar: 'التواصل' },
  staff: { en: 'Staff', ar: 'الطاقم' },
  teams: { en: 'Teams', ar: 'الفرق' },
  areas: { en: 'Areas', ar: 'المناطق' },
  audit: { en: 'Audit', ar: 'التدقيق' },
  reports: { en: 'Reports', ar: 'التقارير' },
  dashboardSubtitle: { en: 'live across all your events', ar: 'مباشر عبر جميع فعالياتك' },
  refresh: { en: 'Refresh', ar: 'تحديث' },
  totalGuests: { en: 'Total guests', ar: 'إجمالي الضيوف' },
  checkedIn: { en: 'Checked in', ar: 'تم تسجيل الدخول' },
  pendingEntry: { en: 'Pending entry', ar: 'في انتظار الدخول' },
  activeDevices: { en: 'Active devices', ar: 'الأجهزة النشطة' },
  todayScans: { en: 'Scans (24h)', ar: 'عمليات المسح (24س)' },
  validScans: { en: 'Valid scans', ar: 'مسح صالح' },
  invalidScans: { en: 'Invalid scans', ar: 'مسح غير صالح' },
  liveActivity: { en: 'Live activity', ar: 'النشاط المباشر' },

  // Public nav/footer
  home: { en: 'Home', ar: 'الرئيسية' },
  upcomingEvents: { en: 'Upcoming events', ar: 'الفعاليات القادمة' },
  pastWorks: { en: 'Past works', ar: 'الأعمال السابقة' },
  contactUs: { en: 'Contact', ar: 'تواصل معنا' },
  aboutUs: { en: 'About', ar: 'من نحن' },
  backToSite: { en: 'Back to site', ar: 'العودة إلى الموقع' },
  signIn: { en: 'Sign in', ar: 'تسجيل الدخول' },
  dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
  menu: { en: 'Menu', ar: 'القائمة' },
  close: { en: 'Close', ar: 'إغلاق' },
  language: { en: 'Language', ar: 'اللغة' },
  theme: { en: 'Theme', ar: 'المظهر' },

  // Home
  heroEyebrow: { en: 'Premium event ticketing', ar: 'منصة تذاكر فعاليات مميزة' },
  heroTitleA: { en: 'Book your next event', ar: 'احجز فعاليتك القادمة' },
  heroTitleB: { en: 'with confidence.', ar: 'بثقة وسهولة.' },
  heroBody: {
    en: 'Discover upcoming events, reserve your seat in seconds, and receive a secure digital ticket ready for check-in.',
    ar: 'اكتشف الفعاليات القادمة، احجز مقعدك خلال ثوانٍ، واحصل على تذكرة رقمية آمنة جاهزة للدخول.',
  },
  browseUpcoming: { en: 'Browse upcoming events', ar: 'تصفح الفعاليات القادمة' },
  howItWorks: { en: 'How booking works', ar: 'كيف يعمل الحجز' },
  trustSigned: { en: 'Signed QR tickets', ar: 'تذاكر QR موقعة' },
  trustSignedBody: { en: 'Every ticket is digitally signed and verified at entry.', ar: 'كل تذكرة موقعة رقمياً ويتم التحقق منها عند الدخول.' },
  trustFast: { en: 'Fast booking', ar: 'حجز سريع' },
  trustFastBody: { en: 'Reserve in a few simple steps from any device.', ar: 'احجز في خطوات بسيطة من أي جهاز.' },
  trustSecure: { en: 'Secure check-in', ar: 'دخول آمن' },
  trustSecureBody: { en: 'Tampered, revoked, or invalid tickets are rejected.', ar: 'يتم رفض التذاكر المزورة أو الملغاة أو غير الصالحة.' },
  featuredEvents: { en: 'Upcoming events', ar: 'الفعاليات القادمة' },
  featuredEventsBody: {
    en: 'Pick an event, choose your ticket, and reserve your place.',
    ar: 'اختر الفعالية، حدد نوع التذكرة، واحجز مكانك.',
  },
  viewAllEvents: { en: 'View all events', ar: 'عرض كل الفعاليات' },
  noUpcomingTitle: { en: 'No upcoming events yet', ar: 'لا توجد فعاليات قادمة حالياً' },
  noUpcomingBody: {
    en: 'New events will appear here as soon as they are published.',
    ar: 'ستظهر الفعاليات الجديدة هنا فور نشرها.',
  },
  simpleSteps: { en: 'Simple booking', ar: 'حجز بسيط' },
  simpleStepsBody: { en: 'Designed to be clear for every guest.', ar: 'مصمم ليكون واضحاً لكل ضيف.' },
  step1Title: { en: 'Choose an event', ar: 'اختر الفعالية' },
  step1Body: { en: 'Browse upcoming events and find the right one for you.', ar: 'تصفح الفعاليات القادمة واختر المناسبة لك.' },
  step2Title: { en: 'Reserve your ticket', ar: 'احجز تذكرتك' },
  step2Body: { en: 'Enter your details and select the ticket type you want.', ar: 'أدخل بياناتك واختر نوع التذكرة المناسبة.' },
  step3Title: { en: 'Get your QR', ar: 'استلم رمز QR' },
  step3Body: { en: 'Receive a secure QR ticket for fast entry at the venue.', ar: 'استلم تذكرة QR آمنة للدخول السريع في مكان الفعالية.' },

  // Upcoming events / booking
  upcomingEyebrow: { en: 'Public events', ar: 'الفعاليات العامة' },
  upcomingTitleA: { en: 'Upcoming', ar: 'الفعاليات' },
  upcomingTitleB: { en: 'events', ar: 'القادمة' },
  upcomingBody: {
    en: 'Find your next event and reserve your ticket in a few simple steps.',
    ar: 'اعثر على فعاليتك القادمة واحجز تذكرتك في خطوات بسيطة.',
  },
  loadingEvents: { en: 'Loading events…', ar: 'جاري تحميل الفعاليات…' },
  reserve: { en: 'Reserve', ar: 'احجز' },
  openingSoon: { en: 'Opening soon', ar: 'يفتح قريباً' },
  soldOut: { en: 'Sold out', ar: 'نفدت التذاكر' },
  locked: { en: 'Locked', ar: 'مغلق' },
  closed: { en: 'Closed', ar: 'مغلق' },
  reservationsOpen: { en: 'Reservations open', ar: 'الحجز مفتوح' },
  reservationsClosed: { en: 'Reservations closed', ar: 'الحجز مغلق' },
  reservationsLocked: { en: 'Reservations locked', ar: 'الحجز مقفل' },
  free: { en: 'Free', ar: 'مجاني' },
  reserved: { en: 'reserved', ar: 'محجوز' },
  left: { en: 'left', ar: 'متبقي' },
  venueTba: { en: 'Venue TBA', ar: 'المكان يُعلن لاحقاً' },
  untitledEvent: { en: 'Untitled event', ar: 'فعالية بدون عنوان' },
  reserveSeat: { en: 'Reserve your seat', ar: 'احجز مقعدك' },
  reserveFor: { en: 'Reserve for', ar: 'حجز لـ' },
  fullName: { en: 'Full name', ar: 'الاسم الكامل' },
  email: { en: 'Email', ar: 'البريد الإلكتروني' },
  phone: { en: 'Phone', ar: 'رقم الهاتف' },
  optional: { en: 'optional', ar: 'اختياري' },
  ticketType: { en: 'Ticket type', ar: 'نوع التذكرة' },
  ticketTypes: { en: 'Ticket types', ar: 'أنواع التذاكر' },
  confirmReservation: { en: 'Confirm reservation', ar: 'تأكيد الحجز' },
  submitting: { en: 'Submitting…', ar: 'جاري الإرسال…' },
  reservationConfirmed: { en: 'Reservation confirmed', ar: 'تم تأكيد الحجز' },
  reservationPending: { en: 'Reservation pending', ar: 'الحجز قيد المراجعة' },
  reservationCode: { en: 'Reservation code', ar: 'رمز الحجز' },
  ticketReady: { en: 'Your ticket is ready', ar: 'تذكرتك جاهزة' },
  ticketReadyBody: {
    en: 'Present this QR code at the entrance. A copy has also been sent to your email if delivery is enabled.',
    ar: 'اعرض رمز QR هذا عند المدخل. تم إرسال نسخة إلى بريدك الإلكتروني إذا كانت خدمة الإرسال مفعلة.',
  },
  pendingBody: {
    en: 'Your reservation is pending approval. We will update the status here and email your ticket once approved.',
    ar: 'حجزك قيد الموافقة. سنحدث الحالة هنا ونرسل التذكرة إلى بريدك الإلكتروني بعد الموافقة.',
  },
  checkStatus: { en: 'Check status', ar: 'تحقق من الحالة' },
  checkingStatus: { en: 'Checking…', ar: 'جاري التحقق…' },
  approved: { en: 'Approved', ar: 'تمت الموافقة' },
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  rejected: { en: 'Rejected', ar: 'مرفوض' },
  status: { en: 'Status', ar: 'الحالة' },
  copyCode: { en: 'Copy code', ar: 'نسخ الرمز' },
  copied: { en: 'Copied', ar: 'تم النسخ' },
  done: { en: 'Done', ar: 'تم' },
  closeDialog: { en: 'Close dialog', ar: 'إغلاق النافذة' },
  date: { en: 'Date', ar: 'التاريخ' },
  location: { en: 'Location', ar: 'الموقع' },
  capacity: { en: 'Capacity', ar: 'السعة' },
  attendeeCount: { en: 'attendees', ar: 'حضور' },
  scanCount: { en: 'scans', ar: 'عمليات مسح' },
  ticket: { en: 'Ticket', ar: 'تذكرة' },
  price: { en: 'Price', ar: 'السعر' },
  from: { en: 'From', ar: 'يبدأ من' },
  secureBooking: { en: 'Secure booking', ar: 'حجز آمن' },
  secureBookingBody: {
    en: 'Your reservation creates a secure digital ticket that can be verified at the gate.',
    ar: 'حجزك ينشئ تذكرة رقمية آمنة يمكن التحقق منها عند البوابة.',
  },

  // Past works
  pastEyebrow: { en: 'Archive', ar: 'الأرشيف' },
  pastTitleA: { en: 'Past', ar: 'الأعمال' },
  pastTitleB: { en: 'works', ar: 'السابقة' },
  pastBody: {
    en: 'A record of completed events powered by TKT.',
    ar: 'سجل للفعاليات المكتملة التي تم تشغيلها عبر TKT.',
  },
  loadingArchive: { en: 'Loading archive…', ar: 'جاري تحميل الأرشيف…' },
  archiveEmptyTitle: { en: 'Archive is empty', ar: 'الأرشيف فارغ' },
  archiveEmptyBody: { en: 'Completed events will appear here with their full record.', ar: 'ستظهر الفعاليات المكتملة هنا بسجلها الكامل.' },
  eventsOnRecord: { en: 'Events on record', ar: 'فعاليات مسجلة' },
  attendeesServed: { en: 'Attendees served', ar: 'ضيوف تم خدمتهم' },
  gateScans: { en: 'Gate scans', ar: 'عمليات مسح البوابات' },
  completed: { en: 'Completed', ar: 'مكتملة' },
  archived: { en: 'Archived', ar: 'مؤرشفة' },
  recordSealed: { en: 'Record sealed', ar: 'سجل موثق' },

  // Contact
  contactEyebrow: { en: 'Contact', ar: 'تواصل' },
  contactTitleA: { en: 'Let’s plan your', ar: 'لنخطط' },
  contactTitleB: { en: 'next event.', ar: 'لفعاليتك القادمة.' },
  contactBody: {
    en: 'Tell us about your event and we’ll help you get started with the right setup.',
    ar: 'أخبرنا عن فعاليتك وسنساعدك على البدء بالإعداد المناسب.',
  },
  contactForm: { en: 'Send a message', ar: 'أرسل رسالة' },
  message: { en: 'Message', ar: 'الرسالة' },
  sendMessage: { en: 'Send message', ar: 'إرسال الرسالة' },
  sending: { en: 'Sending…', ar: 'جاري الإرسال…' },
  messageSent: { en: 'Message sent', ar: 'تم إرسال الرسالة' },
  messageSentBody: { en: 'Thanks for reaching out. We’ll get back to you soon.', ar: 'شكراً لتواصلك. سنرد عليك قريباً.' },

  // About
  aboutEyebrow: { en: 'About TKT', ar: 'عن TKT' },
  aboutTitleA: { en: 'Built for smooth', ar: 'مصممة لتجربة' },
  aboutTitleB: { en: 'event entry.', ar: 'دخول سلسة.' },
  aboutBody: {
    en: 'TKT helps teams manage events and gives guests a simple, secure booking experience.',
    ar: 'تساعد TKT الفرق على إدارة الفعاليات وتمنح الضيوف تجربة حجز بسيطة وآمنة.',
  },
  ourMission: { en: 'Our mission', ar: 'مهمتنا' },
  missionBody: {
    en: 'Make event booking and entry simple, fast, and trustworthy for everyone.',
    ar: 'جعل حجز الفعاليات والدخول إليها بسيطاً وسريعاً وموثوقاً للجميع.',
  },
  whyTkt: { en: 'Why TKT', ar: 'لماذا TKT' },
  why1Title: { en: 'Simple for guests', ar: 'بسيطة للضيوف' },
  why1Body: { en: 'Clear event details and a fast reservation flow.', ar: 'تفاصيل واضحة للفعالية وتدفق حجز سريع.' },
  why2Title: { en: 'Secure by design', ar: 'آمنة بالتصميم' },
  why2Body: { en: 'Signed digital tickets and controlled check-in.', ar: 'تذاكر رقمية موقعة وتسجيل دخول مضبوط.' },
  why3Title: { en: 'Ready for operations', ar: 'جاهزة للتشغيل' },
  why3Body: { en: 'Built to support real event teams and live entry.', ar: 'مصممة لدعم فرق الفعاليات والدخول المباشر.' },

  // Login
  loginEyebrow: { en: 'Staff access', ar: 'دخول الطاقم' },
  loginTitle: { en: 'Sign in to TKT', ar: 'سجل الدخول إلى TKT' },
  loginBody: { en: 'Use your staff account to access the control room.', ar: 'استخدم حساب الطاقم للوصول إلى غرفة التحكم.' },
  password: { en: 'Password', ar: 'كلمة المرور' },
  signingIn: { en: 'Signing in…', ar: 'جاري تسجيل الدخول…' },
  loginError: { en: 'Unable to sign in', ar: 'تعذر تسجيل الدخول' },
  backHome: { en: 'Back to home', ar: 'العودة للرئيسية' },

  // Common
  loading: { en: 'Loading…', ar: 'جاري التحميل…' },
  error: { en: 'Something went wrong', ar: 'حدث خطأ ما' },
  retry: { en: 'Retry', ar: 'إعادة المحاولة' },
  details: { en: 'Details', ar: 'التفاصيل' },
  viewDetails: { en: 'View details', ar: 'عرض التفاصيل' },
  open: { en: 'Open', ar: 'مفتوح' },
  upcoming: { en: 'Upcoming', ar: 'قادم' },
  tba: { en: 'TBA', ar: 'يُعلن لاحقاً' },
} as const

export type I18nKey = keyof typeof dict

type LanguageContextValue = {
  lang: Lang
  dir: 'ltr' | 'rtl'
  setLang: (l: Lang) => void
  toggle: () => void
  t: (key: I18nKey | string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function initialLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'ar') return stored
  return navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    document.documentElement.dataset.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l)
    setLangState(l)
  }, [])

  const toggle = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === 'en' ? 'ar' : 'en'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  const t = useCallback(
    (key: I18nKey | string) => {
      const entry = (dict as Record<string, { en: string; ar: string }>)[key]
      if (!entry) return key
      return lang === 'ar' ? entry.ar : entry.en
    },
    [lang],
  )

  const value = useMemo<LanguageContextValue>(() => ({ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', setLang, toggle, t }), [lang, setLang, toggle, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
