/**
 * Brand colors shared by ticket cards, PDF/CSV exports, PWA passes and email previews.
 * Values match the originals (case-insensitively) so generated assets stay visually identical.
 */
export const BRAND_COLORS = {
  // Core PDF palette.
  ink: '#0b0c0d',
  signal: '#ffb020',
  muted: '#8f8f99',
  white: '#ffffff',
  line: '#e2e2e7',
  seat: '#b45309',
  seatLight: '#fcd34d',
  mutedLight: '#a1a1aa',

  // PWA pass palette (distinct from the core PDF palette by design).
  passInk: '#171A20',
  passPaper: '#F8F7F3',
  passMuted: '#77766F',
  passLine: '#D8D6CF',
  passMutedLight: '#B9BBC1',
  passSuccess: '#16794C',

  // QR codes.
  qrDark: '#0B0B0C',
  qrLight: '#FFFFFF',

  // Email preview palette and supporting text colors.
  emailPrimary: '#0b1f44',
  emailAccent: '#c8a25c',
  emailBackground: '#fdfbf7',
  emailHeader: '#0b0b0c',
  emailPanel: '#f1ede4',
  emailText: '#172033',
  emailDetailMuted: '#6d6a64',
  emailQrPanel: '#faf8f4',
  emailQrCaption: '#565e6b',
  emailQrNote: '#8a6a35',
  emailFooter: '#687080',
  emailLegalMuted: '#8b8e96',
  emailBorder: '#e8e3d9',
} as const

type Rgb = [number, number, number]

/** RGB tuples required by jspdf-autotable, kept in sync with the palette above. */
export const BRAND_RGB: Record<'ink' | 'signal' | 'tableAlternate', Rgb> = {
  ink: [11, 12, 13],
  signal: [255, 176, 32],
  tableAlternate: [244, 244, 245],
}
