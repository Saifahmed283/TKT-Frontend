import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { useLanguage } from './lib/i18n'
import BrandLogo from './components/public/BrandLogo'
import WebsiteIntro from './components/public/WebsiteIntro'
const Shell = lazy(() => import('./components/shell/Shell'))
const RequirePermission = lazy(() => import('./components/auth/RequirePermission').then((m) => ({ default: m.RequirePermission })))

const Landing = lazy(() => import('./pages/public/Landing'))
const Login = lazy(() => import('./pages/auth/Login'))
const UpcomingEvents = lazy(() => import('./pages/public/UpcomingEvents'))
const PastWorks = lazy(() => import('./pages/public/PastWorks'))
const Contact = lazy(() => import('./pages/public/Contact'))
const About = lazy(() => import('./pages/public/About'))
const ReservationStatusPage = lazy(() => import('./pages/public/ReservationStatus'))
const MyTicketPwaPage = lazy(() => import('./pages/public/MyTicketPwa'))

// App pages are loaded on demand. The old static import graph put every
// operations page (and libraries such as three, recharts and jspdf) into the
// first JS download, delaying data requests on the public site.
const Dashboard = lazy(() => import('./pages/app/Dashboard'))
const EventsPage = lazy(() => import('./pages/public/Events'))
const EventDetail = lazy(() => import('./pages/public/EventDetail'))
const AttendeesPage = lazy(() => import('./pages/app/attendees/Attendees'))
const TicketsPage = lazy(() => import('./pages/app/tickets/Tickets'))
const ScannerPage = lazy(() => import('./pages/app/scanner/Scanner'))
const AccessLogsPage = lazy(() => import('./pages/app/events/AccessLogsPage').then((m) => ({ default: m.AccessLogsPage })))
const AreasPage = lazy(() => import('./pages/app/events/AreasPage').then((m) => ({ default: m.AreasPage })))
const AuditPage = lazy(() => import('./pages/app/events/AuditPage').then((m) => ({ default: m.AuditPage })))
const CommsPage = lazy(() => import('./pages/app/events/CommsPage').then((m) => ({ default: m.CommsPage })))
const CredentialsPage = lazy(() => import('./pages/app/events/CredentialsPage').then((m) => ({ default: m.CredentialsPage })))
const IncidentsPage = lazy(() => import('./pages/app/events/IncidentsPage').then((m) => ({ default: m.IncidentsPage })))
const PaymentsPage = lazy(() => import('./pages/app/events/PaymentsPage').then((m) => ({ default: m.PaymentsPage })))
const AccessCodesPage = lazy(() => import('./pages/app/events/AccessCodesPage').then((m) => ({ default: m.AccessCodesPage })))
const DevicesPage = lazy(() => import('./pages/app/events/DevicesPage').then((m) => ({ default: m.DevicesPage })))
const WorkforcePage = lazy(() => import('./pages/app/events/WorkforcePage').then((m) => ({ default: m.WorkforcePage })))
const BusesPage = lazy(() => import('./pages/app/events/BusesPage').then((m) => ({ default: m.BusesPage })))
const EventSettingsPage = lazy(() => import('./pages/app/events/EventSettings').then((m) => ({ default: m.EventSettingsPage })))
const IntegrationsPage = lazy(() => import('./pages/app/events/IntegrationsPage').then((m) => ({ default: m.IntegrationsPage })))
const ReportsPage = lazy(() => import('./pages/app/events/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const ReservationsPage = lazy(() => import('./pages/app/events/ReservationsPage').then((m) => ({ default: m.ReservationsPage })))
const StaffPage = lazy(() => import('./pages/app/events/StaffPage').then((m) => ({ default: m.StaffPage })))
const TasksPage = lazy(() => import('./pages/app/events/TasksPage').then((m) => ({ default: m.TasksPage })))
const TeamsPage = lazy(() => import('./pages/app/events/TeamsPage').then((m) => ({ default: m.TeamsPage })))
const Guide = lazy(() => import('./pages/app/Guide').then((m) => ({ default: m.Guide })))
const ProfilePage = lazy(() => import('./pages/app/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const OrganizationsPage = lazy(() => import('./pages/app/organizations/OrganizationsPage').then((m) => ({ default: m.OrganizationsPage })))
const OrganizationDetailPage = lazy(() => import('./pages/app/organizations/OrganizationDetailPage').then((m) => ({ default: m.OrganizationDetailPage })))
const SiteContentPage = lazy(() => import('./pages/app/SiteContentPage').then((m) => ({ default: m.SiteContentPage })))

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <BootSplash />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export function BootSplash() {
  const { t } = useLanguage()
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="animate-fade-in flex flex-col items-center gap-5 text-center">
        <BrandLogo imageClassName="h-14 sm:h-16" />
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-ink-3">
          <span className="inline-block h-1.5 w-1.5 animate-blink rounded-full bg-signal" />
          {t('loading')}
        </div>
        <div className="h-1 w-32 overflow-hidden bg-line-soft">
          <div className="h-full w-1/2 animate-pulse bg-signal" />
        </div>
      </div>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)

    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) canonical.href = new URL(pathname, window.location.origin).toString()

    const privateRoute = pathname.startsWith('/app') || pathname.startsWith('/reservation/') || pathname === '/my-ticket' || pathname === '/login'
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    robots.content = privateRoute ? 'noindex, nofollow' : 'index, follow'

    const pageTitles: Record<string, string> = {
      '/': 'TKT — Events & Experiences',
      '/upcoming': 'Upcoming Events | TKT',
      '/past': 'Past Experiences | TKT',
      '/about': 'About TKT — Events & Experiences',
      '/contact': 'Contact TKT',
    }
    document.title = pageTitles[pathname] ?? (privateRoute ? 'Private Ticket Area | TKT' : 'TKT — Events & Experiences')
  }, [pathname])
  return null
}

function LegacyBusTicketsRedirect() {
  const { eventId = '' } = useParams()
  return <Navigate to={`/upcoming?event=${encodeURIComponent(eventId)}`} replace />
}

export default function App() {
  return (
    <>
      <WebsiteIntro />
      <ScrollToTop />
      <Suspense fallback={<BootSplash />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/upcoming" element={<UpcomingEvents />} />
          <Route path="/past" element={<PastWorks />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/events/:eventId/bus-tickets" element={<LegacyBusTicketsRedirect />} />
          <Route path="/reservation/:code" element={<ReservationStatusPage />} />
          <Route path="/my-ticket" element={<MyTicketPwaPage />} />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <Shell />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/:eventId" element={<EventDetail />} />
            <Route path="events/:eventId/teams" element={<RequirePermission permission="team.view"><TeamsPage /></RequirePermission>} />
            <Route path="events/:eventId/areas" element={<RequirePermission permission="area.view"><AreasPage /></RequirePermission>} />
            <Route path="events/:eventId/staff" element={<RequirePermission permission="event.members.view"><StaffPage /></RequirePermission>} />
            <Route path="events/:eventId/workforce" element={<RequirePermission permission="workforce.view"><WorkforcePage /></RequirePermission>} />
            <Route path="events/:eventId/integrations" element={<RequirePermission permission="integration.view"><IntegrationsPage /></RequirePermission>} />
            <Route path="events/:eventId/attendees" element={<RequirePermission permission="attendee.view"><AttendeesPage /></RequirePermission>} />
            <Route path="events/:eventId/tickets" element={<RequirePermission permission="ticket.view"><TicketsPage /></RequirePermission>} />
            <Route path="events/:eventId/reservations" element={<RequirePermission permission="ticket.view"><ReservationsPage /></RequirePermission>} />
            <Route path="events/:eventId/payments" element={<RequirePermission permission="payment.view"><PaymentsPage /></RequirePermission>} />
            <Route path="events/:eventId/buses" element={<RequirePermission permission="bus.view"><BusesPage /></RequirePermission>} />
            <Route path="events/:eventId/access-codes" element={<RequirePermission permission="access_code.view"><AccessCodesPage /></RequirePermission>} />
            <Route path="events/:eventId/credentials" element={<RequirePermission permission="credential.view"><CredentialsPage /></RequirePermission>} />
            <Route path="events/:eventId/access" element={<RequirePermission permission="access.logs.view"><AccessLogsPage /></RequirePermission>} />
            <Route path="events/:eventId/devices" element={<RequirePermission permission="device.view"><DevicesPage /></RequirePermission>} />
            <Route path="events/:eventId/tasks" element={<RequirePermission permission="task.view"><TasksPage /></RequirePermission>} />
            <Route path="events/:eventId/incidents" element={<RequirePermission permission="incident.view"><IncidentsPage /></RequirePermission>} />
            <Route path="events/:eventId/comms" element={<RequirePermission permission="message.send"><CommsPage /></RequirePermission>} />
            <Route path="events/:eventId/audit" element={<RequirePermission permission="audit.view"><AuditPage /></RequirePermission>} />
            <Route path="events/:eventId/reports" element={<RequirePermission permission="report.view"><ReportsPage /></RequirePermission>} />
            <Route path="events/:eventId/settings" element={<RequirePermission permission="event.settings"><EventSettingsPage /></RequirePermission>} />
            <Route path="organizations" element={<OrganizationsPage />} />
            <Route path="organizations/:orgId" element={<OrganizationDetailPage />} />
            <Route path="site-content" element={<RequirePermission permission="platform.manage"><SiteContentPage /></RequirePermission>} />
            <Route path="guide" element={<Guide />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="scanner" element={<ScannerPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
