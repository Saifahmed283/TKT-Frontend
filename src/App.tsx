import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { useLanguage } from './lib/i18n'
import BrandLogo from './components/public/BrandLogo'
import WebsiteIntro from './components/public/WebsiteIntro'
import Landing from './pages/Landing'
import Login from './pages/Login'
import UpcomingEvents from './pages/UpcomingEvents'
import PastWorks from './pages/PastWorks'
import Contact from './pages/Contact'
import About from './pages/About'
import Shell from './components/shell/Shell'
import Dashboard from './pages/Dashboard'
import EventsPage from './pages/Events'
import EventDetail from './pages/EventDetail'
import AttendeesPage from './pages/attendees/Attendees'
import TicketsPage from './pages/tickets/Tickets'
import { AccessLogsPage } from './pages/app/events/AccessLogsPage'
import { AreasPage } from './pages/app/events/AreasPage'
import { AuditPage } from './pages/app/events/AuditPage'
import { CommsPage } from './pages/app/events/CommsPage'
import { CredentialsPage } from './pages/app/events/CredentialsPage'
import { IncidentsPage } from './pages/app/events/IncidentsPage'
import { PaymentsPage } from './pages/app/events/PaymentsPage'
import { AccessCodesPage } from './pages/app/events/AccessCodesPage'
import { DevicesPage } from './pages/app/events/DevicesPage'
import { WorkforcePage } from './pages/app/events/WorkforcePage'
import { IntegrationsPage } from './pages/app/events/IntegrationsPage'
import { ReportsPage } from './pages/app/events/ReportsPage'
import { ReservationsPage } from './pages/app/events/ReservationsPage'
import { StaffPage } from './pages/app/events/StaffPage'
import { TasksPage } from './pages/app/events/TasksPage'
import { TeamsPage } from './pages/app/events/TeamsPage'
import { Guide } from './pages/app/Guide'
import { ProfilePage } from './pages/app/ProfilePage'
import { OrganizationsPage } from './pages/app/organizations/OrganizationsPage'
import { OrganizationDetailPage } from './pages/app/organizations/OrganizationDetailPage'
import { RequirePermission } from './components/auth/RequirePermission'
import ScannerPage from './pages/scanner/Scanner'

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
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <WebsiteIntro />
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/upcoming" element={<UpcomingEvents />} />
      <Route path="/past" element={<PastWorks />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
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
        <Route path="events/:eventId/access-codes" element={<RequirePermission permission="access_code.view"><AccessCodesPage /></RequirePermission>} />
        <Route path="events/:eventId/credentials" element={<RequirePermission permission="credential.view"><CredentialsPage /></RequirePermission>} />
        <Route path="events/:eventId/access" element={<RequirePermission permission="access.logs.view"><AccessLogsPage /></RequirePermission>} />
        <Route path="events/:eventId/devices" element={<RequirePermission permission="device.view"><DevicesPage /></RequirePermission>} />
        <Route path="events/:eventId/tasks" element={<RequirePermission permission="task.view"><TasksPage /></RequirePermission>} />
        <Route path="events/:eventId/incidents" element={<RequirePermission permission="incident.view"><IncidentsPage /></RequirePermission>} />
        <Route path="events/:eventId/comms" element={<RequirePermission permission="message.send"><CommsPage /></RequirePermission>} />
        <Route path="events/:eventId/audit" element={<RequirePermission permission="audit.view"><AuditPage /></RequirePermission>} />
        <Route path="events/:eventId/reports" element={<RequirePermission permission="report.view"><ReportsPage /></RequirePermission>} />
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route path="organizations/:orgId" element={<OrganizationDetailPage />} />
        <Route path="guide" element={<Guide />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="scanner" element={<ScannerPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
