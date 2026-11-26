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
| 2 | Wizard steps — paid | Seed event with a priced public ticket and active provider instructions → open Reserve → advance | Payment step shows instructions/provider/reference/proof, then review | `public.spec.ts` (transport test is paid) |
| 3 | Wizard steps — transport | Seed event with bus seats → choose transport ticket → advance | Seat selection step shown; exactly one seat required before review | `public.spec.ts` |
| 4 | Phone required | Leave phone empty or short on details step and try to continue | Inline phone error; Next disabled; cannot advance | `public.spec.ts` |
| 5 | Exactly one seat for transport | Select 0 seats, then 2 seats, then 1 seat | 0 and 2 keep Next disabled; 1 seat enables Next/review | `public.spec.ts` |
| 6 | Review before submit | Fill valid details → click Next until review → intercept `POST /public/events/*/reservations` | No reservation POST before review; review summary shows name, email, phone, ticket, seats, total; Back preserves values; submit from review only | `public.spec.ts` |
| 7 | Payment review previews proof before approving | Create paid reservation with reference/proof → admin `/app/events/:id/payments` → `Review & confirm` → preview dialog → `Confirm & approve reservation` | Uploaded proof is shown in the dialog with booking details; no review call is made by the row button alone; payment `CONFIRMED`, reservation `APPROVED`, attendee confirmed, QR issued | `reservations-api.test.ts`; `pending-payment-row`, `payment-confirm`, `payment-proof-dialog`, `payment-proof-preview`, `payment-review-confirm` |
| 8 | Payment REJECT permanently purges reservation | Same setup → `Reject` from the row or the review dialog | Payment rejected; ticket, attendee, credentials, access logs, delivery attempts, seat holds removed; proof file deleted; no QR issued or delivery attempt recorded | `reservations-api.test.ts`; `pending-payment-row`, `payment-reject`, `payment-review-reject` |
| 9 | Paid manual approval blocked while payment pending | Paid reservation with `paymentStatus=PENDING` → admin `/app/events/:id/reservations` → `Approve` | Approval refused (`manual-approve` disabled or API 409); no credential/QR issued; remains pending | `reservations-api.test.ts`; `manual-approve` added |
| 10 | Pending attendees hidden by default | Seed pending reservation → open `/app/events/:id/attendees` with no filters | Pending attendee absent by default; appears only when pending status is explicitly selected | `reservations-api.test.ts`; UI scope selector added |
| 11 | Credential visibility | Approve reservation → `/app/events/:id/credentials` → open QR dialog | Short code visible in list; signed QR payload hidden until reveal and shown only for issued credentials | `credential-reveal` / `qr-payload` added |
| 12 | Dashboard route smoke | Login as admin → visit `/app`, `/app/events`, `/app/organizations`, `/app/profile`, `/app/guide`, `/app/scanner` and every event module route | No `Access denied`, `Could not load`, runtime error, or 5xx | `dashboard-smoke.spec.ts`, `dashboard-audit.spec.ts` |
| 13 | Auth + negative login | Login as staff/admin via `/login`; submit admin email with deliberately invalid password | Valid credentials reach `/app`; invalid password shows `Invalid email or password`; missing env vars fail before login | `app.spec.ts`, `journeys.spec.ts`, `auth.ts` |
| 14 | Pending payments list | Create paid reservation with explicit or metadata `paymentStatus=PENDING` → open `/app/events/:id/payments` | Reservation appears under `pending-payments` with status and review actions; `Preview proof` and `Review & confirm` open the proof dialog; actions disabled while reviewing | `reservations-api.test.ts`; `pending-payments`, `pending-payment-row`, `payment-proof-open` |
| 15 | Public payment proof upload | Submit multipart proof to `/uploads/proof` without auth; submit to `/uploads` without auth | Public endpoint returns a stored `/uploads/...` URL; authenticated endpoint denies anonymous callers | `reservations-api.test.ts`; `payment-proof` |
| 16 | Startup cleanup of stale rejected/cancelled reservations | Seed rejected/cancelled public reservations → restart backend outside tests | Stale tickets, attendees, credentials, access logs, seat holds, and uploaded proofs are purged; test runs are unaffected | `reservations-api.test.ts`; `purge.ts` |
| 17 | My ticket save options | Open `/my-ticket#code=...` with an approved reservation → find ticket → open `ticket-save-menu` | Menu offers PDF, image, wallet-style home-screen install, and offline copy; PDF/image downloads contain the same signed QR and booking details | `ticket-save-menu`, `ticket-save-options`, `ticket-download-pdf`, `ticket-download-image`, `ticket-home-screen` |
| 18 | Dashboard creates canonical layouts | Admin `/app/events/:id/buses` → `Add bus` → pick MECT 49 / Coaster 21 / grid → inspect live blueprint → create | Preview uses the same geometry as the public map; the created layout contains `viewBox`, `features`, `cabin` and seat `x/y/mx/z`; seat count matches the blueprint | `bus-layout` unit tests, `coach-seat-map`, `seat-option` |
| 19 | Public 2D map follows the saved bus layout | Seed buses with MECT 49, Coaster 21 and custom grid layouts → open the transport seat step → switch 2D | Every bus renders its own saved blueprint; `seat-option` count equals that bus's seat inventory; WC/TV/exits appear only where the layout defines them; keyboard Enter/Space selects an available seat | `busSeatMap2D.test.tsx`, `wizard-step-seats`, `seat-option` |
| 20 | Public 3D cabin is original TKT geometry | Open the transport seat step for a canonical bus → switch to 3D → use iso/top/front/side camera presets and roof toggle | Procedural TKT coach cabin renders with the shared seat model; no Scania GLTF is loaded; clicking a seat updates the same selection shown in 2D | `wizard-step-seats`, 3D view controls |

## Wizard selectors in use

- `wizard-step-ticket`, `ticket-option`
- `wizard-step-details`, `reservation-phone`, `reservation-notes`
- `wizard-step-seats`, `seat-option`
- `wizard-step-payment`, `payment-instructions`, `payment-provider`, `payment-reference`, `payment-proof`
- `wizard-step-review`, `wizard-review`
- `wizard-back`, `wizard-next`, `wizard-submit`

## Admin selectors in use

- `manual-approve` on paid pending reservations; disabled until payment proof is confirmed.
- `pending-payments` lists metadata/explicit pending payments; `pending-payment-row` exposes status.
- `payment-proof-open` and `payment-confirm` open `payment-proof-dialog`; `payment-proof-preview` renders the uploaded image/PDF, or `payment-proof-missing` warns when only a reference was submitted.
- `payment-review-confirm` approves, issues QR, and closes the pending row; `payment-review-reject` purges the reservation and closes the dialog.
- `payment-reject` on the row purges the reservation without opening the preview.
- `credential-reveal` opens the credential QR dialog.
- `qr-payload` is present only after reveal, for issued credentials.

## Public ticket selectors in use

- `ticket-save-menu` opens the save/download choices on `/my-ticket`.
- `ticket-download-pdf` downloads the ticket as a PDF.
- `ticket-download-image` downloads the ticket as a PNG.
- `ticket-home-screen` adds the TKT ticket app to the device home screen (wallet-style access; not a signed Apple/Google Wallet pass).
- `ticket-offline-save` keeps the read-only offline copy.

Full E2E execution requires the four environment variables above and a backend reachable at `http://localhost:4000`.
