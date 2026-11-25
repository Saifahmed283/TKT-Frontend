import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

const INK = '#0b0c0d'
const SIGNAL = '#ffb020'
const MUTED = '#8f8f99'
const WHITE = '#ffffff'

export type CardSeat = { label: string; busName?: string | null; passengerName?: string | null }

export type CardIdentity = {
  eventName: string
  eventDate: string
  venue: string | null
  attendeeName: string
  ticketType: string
  price?: string
  shortCode?: string | null
  code: string
  seats?: CardSeat[]
}

async function qrImage(code: string): Promise<string> {
  return QRCode.toDataURL(code, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 640,
    color: { dark: INK, light: WHITE },
  })
}

export async function downloadTicketPdf(c: CardIdentity) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a6' })
  const W = 148
  const H = 105

  doc.setFillColor(INK)
  doc.rect(0, 0, W, 8, 'F')
  doc.setFillColor(SIGNAL)
  doc.rect(0, 8, W, 1.2, 'F')

  doc.setTextColor(SIGNAL)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TKT', 10, 25)
  doc.setTextColor(MUTED)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text('SIGNED EVENT TICKET', 10, 30)

  doc.setTextColor(INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(doc.splitTextToSize(c.eventName, 78), 10, 42)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(MUTED)
  doc.text(c.eventDate, 10, 52)
  if (c.venue) doc.text(c.venue, 10, 58)

  doc.setDrawColor('#e2e2e7')
  doc.line(10, 63, 86, 63)

  doc.setTextColor(INK)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(c.attendeeName, 10, 72)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(MUTED)
  doc.text(`${c.ticketType}${c.price ? `  ·  ${money(c.price)}` : ''}`, 10, 79)
  if (c.seats?.length) {
    const seatText = c.seats.map(s => `${s.busName ? s.busName + ' ' : ''}${s.label}${s.passengerName && s.passengerName !== c.attendeeName ? ` (${s.passengerName})` : ''}`).join(', ')
    doc.setFontSize(7)
    doc.setTextColor('#b45309')
    doc.text(doc.splitTextToSize(`SEATS: ${seatText}`, 78), 10, 84)
  }

  doc.setFontSize(7)
  doc.setTextColor(MUTED)
  doc.text('TICKET CODE', 10, 90)
  doc.setTextColor(INK)
  doc.setFont('courier', 'bold')
  doc.setFontSize(12)
  doc.text(c.shortCode ?? c.code.slice(0, 12), 10, 96)

  const qr = await qrImage(c.code)
  doc.addImage(qr, 'PNG', 100, 38, 38, 38)
  doc.setFillColor(SIGNAL)
  doc.rect(0, H - 3, W, 3, 'F')

  doc.save(`ticket-${(c.shortCode ?? c.code.slice(0, 12)).replace(/[^a-zA-Z0-9-]/g, '')}.pdf`)
}

export async function downloadIdCardPdf(c: CardIdentity) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] })
  const W = 85.6
  const H = 54

  doc.setFillColor(INK)
  doc.rect(0, 0, W, H, 'F')

  doc.setFillColor(SIGNAL)
  doc.rect(0, 0, 2.4, H, 'F')
  doc.rect(0, 0, W, 2, 'F')

  doc.setTextColor(SIGNAL)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('TKT', 6.5, 11)
  doc.setTextColor('#ffffff')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(4.6)
  doc.text(doc.splitTextToSize(c.eventName.toUpperCase(), 30), 6.5, 15.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(WHITE)
  doc.text(doc.splitTextToSize(c.attendeeName, 40), 6.5, 27)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(SIGNAL)
  doc.text(c.ticketType.toUpperCase(), 6.5, 34)
  if (c.seats?.length) {
    doc.setFontSize(4.8)
    doc.setTextColor('#fcd34d')
    const seatText = c.seats.map(s => s.label).join(', ')
    doc.text(doc.splitTextToSize(`SEAT ${seatText}`, 38), 6.5, 38)
  }

  doc.setFontSize(5)
  doc.setTextColor('#a1a1aa')
  doc.text('TICKET CODE', 6.5, 43)
  doc.setFont('courier', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(WHITE)
  doc.text(c.shortCode ?? c.code.slice(0, 12), 6.5, 47)

  const qr = await qrImage(c.code)
  doc.addImage(qr, 'PNG', 52, 10, 26, 26)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(4.4)
  doc.setTextColor('#a1a1aa')
  doc.text('PRESENT AT GATE', 52, 40)

  doc.save(`id-card-${(c.shortCode ?? c.code.slice(0, 12)).replace(/[^a-zA-Z0-9-]/g, '')}.pdf`)
}

export function money(price: string, currency = 'EGP'): string {
  const n = Number(price)
  if (!Number.isFinite(n)) return price
  if (n === 0) return 'FREE'
  return `${currency} ${n.toLocaleString()}`
}