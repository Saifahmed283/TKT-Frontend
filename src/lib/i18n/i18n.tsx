import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'ar'

const STORAGE_KEY = 'tkt_lang'

const dict = {
  // Shell / app
  workspace: { en: 'Workspace', ar: 'مساحة العمل' },
  event: { en: 'Event', ar: 'الفعالية' },
  signOut: { en: 'Sign out', ar: 'تسجيل الخروج' },
  allSystemsNominal: { en: 'Live', ar: 'مباشر' },
  jumpTo: { en: 'Jump to anything…', ar: 'انتقل إلى أي شيء…' },
  openNavigation: { en: 'Open navigation', ar: 'فتح القائمة' },
  closeNavigation: { en: 'Close navigation', ar: 'إغلاق القائمة' },
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
  payments: { en: 'Payments', ar: 'المدفوعات' },
  buses: { en: 'Bus seats', ar: 'مقاعد الحافلة' },
  accessCodes: { en: 'Access codes', ar: 'رموز الدخول' },
  credentials: { en: 'Credentials', ar: 'الاعتمادات' },
  accessLog: { en: 'Access log', ar: 'سجل الدخول' },
  devices: { en: 'Devices', ar: 'الأجهزة' },
  tasks: { en: 'Tasks', ar: 'المهام' },
  incidents: { en: 'Incidents', ar: 'البلاغات' },
  comms: { en: 'Comms', ar: 'التواصل' },
  staff: { en: 'Staff', ar: 'الطاقم' },
  workforce: { en: 'Workforce', ar: 'القوى العاملة' },
  integrations: { en: 'Integrations', ar: 'التكاملات' },
  teams: { en: 'Teams', ar: 'الفرق' },
  areas: { en: 'Areas', ar: 'المناطق' },
  audit: { en: 'Audit', ar: 'التدقيق' },
  reports: { en: 'Reports', ar: 'التقارير' },
  operations: { en: 'Operations', ar: 'العمليات' },
  people: { en: 'People', ar: 'الأشخاص' },
  accessControl: { en: 'Access control', ar: 'التحكم بالدخول' },
  revenue: { en: 'Revenue', ar: 'الإيرادات' },
  admin: { en: 'Admin', ar: 'الإدارة' },
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
  heroEyebrow: { en: 'Curated Nights · Lasting Moments', ar: 'ليالٍ منتقاة · لحظات خالدة' },
  heroTitleA: { en: 'Every Entrance', ar: 'كل دخول' },
  heroTitleB: { en: 'Tells a Story.', ar: 'يحكي قصة.' },
  heroBody: {
    en: 'From intimate gatherings to grand celebrations, TKT crafts seamless access to the moments that matter most.',
    ar: 'من اللقاءات الحميمة إلى الاحتفالات الكبرى، تصنع TKT وصولاً سلساً إلى اللحظات الأكثر أهمية.',
  },
  dragToExplore: { en: 'Drag to explore', ar: 'اسحب للاستكشاف' },
  browseUpcoming: { en: 'Explore Events', ar: 'استكشف الفعاليات' },


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


  // About
  siteContent: { en: 'Website content', ar: 'محتوى الموقع' },
  aboutEyebrow: { en: 'About TKT', ar: 'عن TKT' },
  aboutTitleA: { en: 'We run the night', ar: 'ندير الليلة' },
  aboutTitleB: { en: 'so you don’t have to.', ar: 'لتستمتع أنت بها.' },
  aboutBody: {
    en: 'TKT is the operations layer for live events — the people behind the gates, the screens, and the seamless entry of thousands of guests.',
    ar: 'TKT هي طبقة التشغيل للفعاليات الحية — الفريق خلف البوابات والشاشات ودخول آلاف الضيوف بسلاسة.',
  },
  ourPartners: { en: 'Our Partners', ar: 'شركاؤنا' },
  partnersTitleA: { en: 'Trusted by the teams', ar: 'موثوق من الفرق' },
  partnersTitleB: { en: 'who build the night.', ar: 'التي تصنع الليلة.' },
  testimonials: { en: 'Field Reports', ar: 'آراء من الميدان' },
  testimonialsTitleA: { en: 'Voices from', ar: 'أصوات من' },
  testimonialsTitleB: { en: 'the floor.', ar: 'قلب الحدث.' },
  reviews: { en: 'Reviews', ar: 'التقييمات' },
  thankYouTitle: { en: 'Thank you', ar: 'شكراً لكم' },
  thankYouBody: {
    en: 'To every organizer, partner, and guest who trusted us with their night — the next experience is already taking shape.',
    ar: 'لكل منظم وشريك وضيف وثق بنا في ليلته — التجربة القادمة بدأت تتشكل بالفعل.',
  },
  // Contact
  contactEyebrow: { en: 'Contact Us', ar: 'تواصل معنا' },
  contactTitleA: { en: 'From zero', ar: 'من الفكرة' },
  contactTitleB: { en: 'to hero.', ar: 'إلى التنفيذ.' },
  contactBody: {
    en: 'Planning an event and don’t know where to start? We take your idea from a blank page to a running control room — production, credentials, gates, and reporting included.',
    ar: 'تخطط لفعالية ولا تعرف من أين تبدأ؟ نأخذ فكرتك من صفحة فارغة إلى غرفة تشغيل جاهزة — الإنتاج، الاعتمادات، البوابات، والتقارير.',
  },
  directChannels: { en: 'Direct channels', ar: 'قنوات التواصل المباشر' },
  responseWindow: { en: 'Response window: under 24 hours', ar: 'وقت الرد: خلال 24 ساعة' },
  briefingForm: { en: 'Briefing form', ar: 'نموذج التواصل' },
  yourName: { en: 'Your name', ar: 'اسمك' },
  organization: { en: 'Organization', ar: 'الجهة / الشركة' },
  eventType: { en: 'Event type', ar: 'نوع الفعالية' },
  selectOption: { en: 'Select…', ar: 'اختر…' },
  eventDate: { en: 'Event date', ar: 'تاريخ الفعالية' },
  brief: { en: 'The brief', ar: 'تفاصيل الطلب' },
  briefPlaceholder: { en: 'Tell us about the event — audience, scale, venue, and what matters most.', ar: 'أخبرنا عن الفعالية — الجمهور، الحجم، المكان، وما يهمك أكثر.' },
  transmissionReceived: { en: 'Transmission received', ar: 'تم استلام رسالتك' },
  messageLogged: { en: 'Message logged.', ar: 'تم تسجيل الرسالة.' },
  messageLoggedBody: { en: 'Your request is in the queue — we’ll reply to', ar: 'طلبك في قائمة الانتظار — سنرد على' },
  within24: { en: 'within 24 hours.', ar: 'خلال 24 ساعة.' },
  sendAnother: { en: 'Send another message', ar: 'إرسال رسالة أخرى' },
  freeConsultation: { en: 'Free consultation · no strings', ar: 'استشارة مجانية · بدون التزام' },

  // Upcoming events / booking
  upcomingEyebrow: { en: 'The Collection', ar: 'المجموعة' },
  upcomingTitleA: { en: 'Moments worth', ar: 'لحظات تستحق' },
  upcomingTitleB: { en: 'attending.', ar: 'الحضور.' },
  upcomingBody: {
    en: 'A curated selection of live experiences. Choose your night, secure your place, and arrive with confidence.',
    ar: 'مجموعة منتقاة من التجارب الحية. اختر ليلتك، احجز مكانك، واحضر بثقة.',
  },
  loadingEvents: { en: 'Loading events…', ar: 'جاري تحميل الفعاليات…' },
  searchEvents: { en: 'Search events', ar: 'ابحث في الفعاليات' },
  searchEventsPlaceholder: { en: 'Search by name, venue, organizer, or ticket…', ar: 'ابحث بالاسم أو المكان أو المنظم أو التذكرة…' },
  noSearchResults: { en: 'No events match your search', ar: 'لا توجد فعاليات تطابق بحثك' },
  noSearchResultsBody: { en: 'Try a different name, venue, or ticket type.', ar: 'جرّب اسماً أو مكاناً أو نوع تذكرة مختلفاً.' },
  clearSearch: { en: 'Clear search', ar: 'مسح البحث' },
  previous: { en: 'Previous', ar: 'السابق' },
  pagination: { en: 'Event pages', ar: 'صفحات الفعاليات' },
  reserve: { en: 'Reserve your place', ar: 'احجز مكانك' },
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
  eventsAvailable: { en: 'experiences available', ar: 'تجربة متاحة' },
  doorsOpen: { en: 'Starts', ar: 'يبدأ' },
  ticketOptions: { en: 'Ticket options', ar: 'خيارات التذاكر' },
  reserveSeat: { en: 'Reserve your seat', ar: 'احجز مقعدك' },
  reserveFor: { en: 'Reserve for', ar: 'حجز لـ' },
  fullName: { en: 'Full name', ar: 'الاسم الكامل' },
  email: { en: 'Email', ar: 'البريد الإلكتروني' },
  phone: { en: 'Phone', ar: 'رقم الهاتف' },
  optional: { en: 'optional', ar: 'اختياري' },
  ticketType: { en: 'Ticket type', ar: 'نوع التذكرة' },
  ticketTypes: { en: 'Ticket types', ar: 'أنواع التذاكر' },
  confirmReservation: { en: 'Confirm reservation', ar: 'تأكيد الحجز' },
  stepTicket: { en: 'Ticket', ar: 'التذكرة' },
  stepDetails: { en: 'Details', ar: 'البيانات' },
  stepSeats: { en: 'Seat', ar: 'المقعد' },
  stepPayment: { en: 'Payment', ar: 'الدفع' },
  stepDesign: { en: 'Design', ar: 'التصميم' },
  stepReview: { en: 'Review', ar: 'مراجعة' },
  ticketStepHelp: { en: 'Pick the pass that fits your visit. We will guide you through the rest one step at a time.', ar: 'اختر الباقة المناسبة لزيارتك. سنأخذك في بقية الخطوات خطوة بخطوة.' },
  seatsStepHelp: { en: 'Choose one available seat. It will be held while you complete the booking.', ar: 'اختر مقعداً متاحاً واحداً. سيُحجز مؤقتاً أثناء إكمال الحجز.' },
  detailsStepHelp: { en: 'Enter the attendee details exactly as they appear on the identity document.', ar: 'أدخل بيانات الحامل كما تظهر في وثيقة الهوية بالضبط.' },
  paymentStepHelp: { en: 'Send the transfer details and upload your receipt. The team reviews it before approval.', ar: 'أرسل بيانات التحويل وارفع الإيصال. يراجعها الفريق قبل الموافقة.' },
  designStepHelp: { en: 'Choose the look of the ticket you will receive. This step is required.', ar: 'اختر شكل التذكرة التي ستحصل عليها. هذه الخطوة مطلوبة.' },
  reviewStepHelp: { en: 'Check each section, then submit. You can jump back to edit anything.', ar: 'راجع كل قسم ثم أرسل. يمكنك العودة لتعديل أي بيانات.' },
  ticketRequired: { en: 'Choose an available ticket to continue.', ar: 'اختر تذكرة متاحة للمتابعة.' },
  detailsRequired: { en: 'Complete the required attendee fields to continue.', ar: 'أكمل بيانات الحامل المطلوبة للمتابعة.' },
  useThisDesign: { en: 'Use this design', ar: 'اعتماد هذا التصميم' },
  designChosen: { en: 'Design saved', ar: 'تم حفظ التصميم' },
  designRequired: { en: 'Choose a style, or confirm the current design to continue.', ar: 'اختر نمطاً، أو اعتمد التصميم الحالي للمتابعة.' },
  editTicket: { en: 'Edit ticket', ar: 'تعديل التذكرة' },
  editSeat: { en: 'Edit seat', ar: 'تعديل المقعد' },
  editDetails: { en: 'Edit details', ar: 'تعديل البيانات' },
  editPayment: { en: 'Edit payment', ar: 'تعديل الدفع' },
  editDesign: { en: 'Edit design', ar: 'تعديل التصميم' },
  back: { en: 'Back', ar: 'رجوع' },
  next: { en: 'Next', ar: 'التالي' },
  total: { en: 'Total', ar: 'الإجمالي' },
  seats: { en: 'Seats', ar: 'المقاعد' },
  viewReservation: { en: 'View reservation', ar: 'عرض الحجز' },
  reservationExists: { en: 'A reservation already exists for this email.', ar: 'يوجد حجز بالفعل لهذا البريد الإلكتروني.' },
  transportIncluded: { en: 'Transport included', ar: 'يشمل المواصلات' },
  transportTicketHint: { en: 'This ticket includes transport, so you will choose exactly one bus seat in the next step.', ar: 'هذه التذكرة تشمل المواصلات، لذا ستختار مقعداً واحداً فقط في الخطوة التالية.' },
  phoneRequired: { en: 'Enter a valid phone number so we can contact you about your reservation.', ar: 'أدخل رقم هاتف صالحاً حتى نتمكن من التواصل معك بخصوص حجزك.' },
  customization: { en: 'Anything we should know?', ar: 'هل هناك شيء يجب أن نعرفه؟' },
  customizationPlaceholder: { en: 'Optional notes for the event team', ar: 'ملاحظات اختيارية لفريق الفعالية' },
  chooseOneSeat: { en: 'Choose exactly one seat', ar: 'اختر مقعداً واحداً فقط' },
  noBusAvailable: { en: 'No bus seats are available for this ticket yet. Please contact the event team.', ar: 'لا توجد مقاعد متاحة لهذه التذكرة بعد. يُرجى التواصل مع فريق الفعالية.' },
  available: { en: 'Available', ar: 'متاح' },
  held: { en: 'Held', ar: 'محجوز مؤقتاً' },
  reservedSeat: { en: 'Reserved', ar: 'محجوز' },
  unavailable: { en: 'Unavailable', ar: 'غير متاح' },
  customBusLayout: { en: 'Custom bus layout', ar: 'تخطيط حافلة مخصص' },
  selectedSeats: { en: 'Selected seat', ar: 'المقعد المختار' },
  holding: { en: 'Holding…', ar: 'جاري الحجز مؤقتاً…' },
  heldUntil: { en: 'Held until', ar: 'محجوز حتى' },
  seatRequired: { en: 'Select one available seat to continue.', ar: 'اختر مقعداً متاحاً واحداً للمتابعة.' },
  seatPassenger: { en: 'Passenger for seat', ar: 'المسافر للمقعد' },
  paymentDetails: { en: 'Payment details', ar: 'تفاصيل الدفع' },
  paymentInstructions: { en: 'Payment instructions', ar: 'تعليمات الدفع' },
  selectPaymentMethod: { en: 'Select payment method', ar: 'اختر طريقة الدفع' },
  noPaymentMethods: { en: 'No payment methods configured yet. You can still submit a reference or proof for review.', ar: 'لا توجد طرق دفع مُعدّة بعد. يمكنك إرسال رقم مرجعي أو إثبات دفع للمراجعة.' },
  account: { en: 'Account', ar: 'الحساب' },
  number: { en: 'Number', ar: 'الرقم' },
  openPaymentLink: { en: 'Open payment link', ar: 'فتح رابط الدفع' },
  paymentReference: { en: 'Payment reference / transaction ID', ar: 'المرجع / رقم العملية' },
  paymentProof: { en: 'Payment proof', ar: 'إثبات الدفع' },
  paymentDetailsRequired: { en: 'Select a provider, enter the transaction reference, and upload the receipt to continue.', ar: 'اختر مزود الدفع، أدخل رقم العملية، وارفع الإيصال للمتابعة.' },
  reviewBody: { en: 'Check everything above before submitting. Your reservation will be reviewed before the QR ticket is issued.', ar: 'تحقق من جميع البيانات قبل الإرسال. سيتم مراجعة حجزك قبل إصدار تذكرة QR.' },
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
  notTicketYet: { en: 'This is a reservation, not your ticket', ar: 'هذا حجز وليس تذكرتك' },
  notTicketYetBody: {
    en: 'The scannable QR is issued only after the event team approves your booking. Keep this code to check the status.',
    ar: 'رمز QR القابل للمسح يُصدر فقط بعد أن يوافق فريق الفعالية على حجزك. احتفظ بهذا الرمز لمتابعة الحالة.',
  },
  checkStatus: { en: 'Check status', ar: 'تحقق من الحالة' },
  checkingStatus: { en: 'Checking…', ar: 'جاري التحقق…' },
  pendingPollingBody: {
    en: 'This page updates automatically. We will also email your ticket once it is approved.',
    ar: 'تتحدث هذه الصفحة تلقائياً. سنرسل تذكرتك إلى بريدك الإلكتروني بعد الموافقة.',
  },
  preparingQr: { en: 'Your reservation is confirmed. Preparing your QR ticket…', ar: 'تم تأكيد حجزك. جاري تجهيز تذكرتك برمز QR…' },
  discardTitle: { en: 'Discard this reservation?', ar: 'إلغاء هذا الحجز؟' },
  discardBody: { en: 'Your details and payment information will be lost.', ar: 'ستفقد بياناتك ومعلومات الدفع.' },
  discardCancel: { en: 'Keep editing', ar: 'متابعة التحرير' },
  discardConfirm: { en: 'Discard', ar: 'إلغاء' },
  holdExpired: { en: 'Your seat hold expired. Select the seat again.', ar: 'انتهى حجز المقعد مؤقتاً. يُرجى اختيار المقعد مجدداً.' },
  holdEndingSoon: { en: 'Seat hold ending soon', ar: 'حجز المقعد ينتهي قريباً' },
  retryHold: { en: 'Retry hold', ar: 'إعادة الحجز مؤقتاً' },
  swipeSeats: { en: 'Swipe to see more seats', ar: 'اسحب لعرض المزيد من المقاعد' },
  seatSubtotal: { en: 'Seats', ar: 'المقاعد' },
  paymentSubtotal: { en: 'Amount to transfer', ar: 'المبلغ المطلوب تحويله' },
  resendTicket: { en: 'Resend my ticket', ar: 'إعادة إرسال تذكرتي' },
  forgotCode: { en: 'I don’t have my code', ar: 'لا أملك رمز الحجز' },
  resending: { en: 'Sending…', ar: 'جاري الإرسال…' },
  ticketResent: { en: 'Ticket sent to your email. Check your inbox.', ar: 'تم إرسال التذكرة إلى بريدك الإلكتروني. تحقق من صندوق الوارد.' },
  resendFailed: { en: 'We could not resend the ticket. Please try again.', ar: 'تعذر إعادة إرسال التذكرة. يُرجى المحاولة مرة أخرى.' },
  loadingReservation: { en: 'Loading reservation…', ar: 'جاري تحميل الحجز…' },
  reservationLoadFailed: { en: 'Could not load this reservation. Try again.', ar: 'تعذر تحميل هذا الحجز. يُرجى المحاولة مجدداً.' },
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
  pastEyebrow: { en: 'The Archive', ar: 'الأرشيف' },
  pastTitleA: { en: 'Nights we’ve', ar: 'ليالٍ' },
  pastTitleB: { en: 'brought to life.', ar: 'أحييناها.' },
  pastBody: {
    en: 'A living record of experiences delivered through TKT — every guest, every scan, every moment accounted for.',
    ar: 'سجل حي للتجارب التي قدمتها TKT — كل ضيف، كل مسح، وكل لحظة موثقة.',
  },
  loadingArchive: { en: 'Loading archive…', ar: 'جاري تحميل الأرشيف…' },
  archiveEmptyTitle: { en: 'The archive awaits', ar: 'الأرشيف بانتظار أول قصة' },
  archiveEmptyBody: { en: 'Completed experiences will appear here with their full record.', ar: 'ستظهر التجارب المكتملة هنا بسجلها الكامل.' },
  eventsOnRecord: { en: 'Experiences delivered', ar: 'تجارب تم تقديمها' },
  attendeesServed: { en: 'Guests welcomed', ar: 'ضيوف تم استقبالهم' },
  gateScans: { en: 'Verified entries', ar: 'دخول تم التحقق منه' },
  completed: { en: 'Completed', ar: 'مكتملة' },
  archived: { en: 'Archived', ar: 'مؤرشفة' },
  recordSealed: { en: 'Verified record', ar: 'سجل موثق' },

  // Contact
  contactForm: { en: 'Send a message', ar: 'أرسل رسالة' },
  message: { en: 'Message', ar: 'الرسالة' },
  sendMessage: { en: 'Send message', ar: 'إرسال الرسالة' },
  sending: { en: 'Sending…', ar: 'جاري الإرسال…' },
  messageSent: { en: 'Message sent', ar: 'تم إرسال الرسالة' },
  messageSentBody: { en: 'Thanks for reaching out. We’ll get back to you soon.', ar: 'شكراً لتواصلك. سنرد عليك قريباً.' },
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
