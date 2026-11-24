# E2E test cases

## Credentials

Set before running `npm run test:e2e`:

| Variable | Used by |
| --- | --- |
| `E2E_ADMIN_EMAIL` | admin login, API seeding, wrong-password test, profile assertion |
| `E2E_ADMIN_PASSWORD` | admin login and API seeding |
| `E2E_STAFF_EMAIL` | staff/scanner login |
| `E2E_STAFF_PASSWORD` | staff/scanner login |

`e2e/auth.ts` reads `process.env` and throws `Missing required E2E environment variable(s): <names>` before any navigation or API call. No password is printed or logged.

## Matrix

| # | Case | Steps / precondition | Expected | Coverage |
| --- | --- | --- | --- | --- |
| 1 | Wizard steps — free | Seed published event with a free public ticket → open Reserve → advance through steps | Ticket → details → review → confirmation; no payment or seat step | `public.spec.ts` |
| 2 | Wizard steps — paid | Seed event with a priced public ticket → open Reserve → advance | Payment step shown with reference/proof, then review | `public.spec.ts` (transport test is paid) |
| 3 | Wizard steps — transport | Seed event with bus seats → choose transport ticket → advance | Seat selection step shown; exactly one seat required before review | `public.spec.ts` |
| 4 | Phone required | Leave phone empty or short on details step and try to continue | Inline phone error; Next disabled; cannot advance | `public.spec.ts` |
| 5 | Exactly one seat for transport | Select 0 seats, then 2 seats, then 1 seat | 0 and 2 keep Next disabled; 1 seat enables Next/review | `public.spec.ts` |
| 6 | Review before submit | Fill valid details → click Next until review → intercept `POST /public/events/*/reservations` | No reservation POST before review; review summary shows name, email, phone, ticket, seats, total; Back preserves values; submit from review only | `public.spec.ts` |
| 7 | Payment CONFIRM fully approves and issues QR | Create paid reservation with reference/proof → admin `/app/events/:id/payments` → `Confirm` | Payment `CONFIRMED`, reservation `APPROVED`, QR issued; QR visible on reservation and in Credentials dialog | `reservations-api.test.ts`; UI selectors ready |
| 8 | Payment REJECT does not issue QR | Same setup → `Reject` | Payment rejected, reservation not approved, no credential/QR issued | Backend decision path; UI selectors ready |
| 9 | Paid manual approval blocked while payment pending | Paid reservation with `paymentStatus=PENDING` → admin `/app/events/:id/reservations` → `Approve` | Approval refused (`manual-approve` disabled or API 409); no credential/QR issued; remains pending | `reservations-api.test.ts`; `manual-approve` added |
| 10 | Pending attendees hidden by default | Seed pending reservation → open `/app/events/:id/attendees` with no filters | Pending attendee absent by default; appears only when pending status is explicitly selected | `reservations-api.test.ts`; UI scope selector added |
| 11 | Credential visibility | Approve reservation → `/app/events/:id/credentials` → open QR dialog | Short code visible in list; signed QR payload hidden until reveal and shown only for issued credentials | `credential-reveal` / `qr-payload` added |
| 12 | Dashboard route smoke | Login as admin → visit `/app`, `/app/events`, `/app/organizations`, `/app/profile`, `/app/guide`, `/app/scanner` and every event module route | No `Access denied`, `Could not load`, runtime error, or 5xx | `dashboard-smoke.spec.ts`, `dashboard-audit.spec.ts` |
| 13 | Auth + negative login | Login as staff/admin via `/login`; submit admin email with deliberately invalid password | Valid credentials reach `/app`; invalid password shows `Invalid email or password`; missing env vars fail before login | `app.spec.ts`, `journeys.spec.ts`, `auth.ts` |

## Wizard selectors in use

- `wizard-step-ticket`, `ticket-option`
- `wizard-step-details`, `reservation-phone`, `reservation-notes`
- `wizard-step-seats`, `seat-option`
- `wizard-step-payment`, `payment-reference`
- `wizard-step-review`, `wizard-review`
- `wizard-back`, `wizard-next`, `wizard-submit`

## Admin selectors in use

- `manual-approve` on paid pending reservations; disabled until payment proof is confirmed.
- `credential-reveal` opens the credential QR dialog.
- `qr-payload` is present only after reveal, for issued credentials.

Full E2E execution requires the four environment variables above and a backend reachable at `http://localhost:4000`.
