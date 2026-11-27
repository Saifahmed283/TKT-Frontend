import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import type { PwaReservationTicket } from '../api/public'
import { formatTicketDateTime } from '../time'

export type TicketExportLang = 'en' | 'ar'

const W = 1200
const H = 1800
const INK = '#171A20'
const PAPER = '#F8F7F3'
const MUTED = '#77766F'
const SIGNAL = '#FFB020'
const LINE = '#D8D6CF'

const labels = {
  en: {
    pass: 'TKT · EVENT PASS',
    guest: 'Guest',
    type: 'Ticket type',
    date: 'Date',
    venue: 'Venue',
    seats: 'Seats',
    payment: 'Payment status',
    code: 'Reservation code',
    ready: 'TICKET READY FOR ENTRY',
    free: 'FREE',
  },
  ar: {
    pass: 'TKT · تذكرة الفعالية',
    guest: 'اسم صاحب الحجز',
    type: 'نوع التذكرة',
    date: 'الموعد',
    venue: 'المكان',
    seats: 'المقاعد',
    payment: 'حالة الدفع',
    code: 'رقم الحجز',
    ready: 'التذكرة جاهزة للدخول',
    free: 'مجانية',
  },
} as const

function font(lang: TicketExportLang, weight: 'normal' | 'bold', size: number) {
  const family = lang === 'ar' ? 'Tahoma, Arial, sans-serif' : 'Arial, Helvetica, sans-serif'
  return `${weight} ${size}px ${family}`
}

function wrap(ctx: CanvasRenderingContext2D, value: string, maxWidth: number): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ['']
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
  maxLines: number,
) {
  const visible = lines.slice(0, maxLines)
  visible.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight))
  return visible.length
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load the entry QR code'))
    image.src = src
  })
}

function formatDate(value: string, lang: TicketExportLang, _timezone: string) {
  const formatted = formatTicketDateTime(value, lang === 'ar' ? 'ar-EG' : 'en-GB')
  return formatted === '—' ? value : formatted
}

async function buildCanvas(ticket: PwaReservationTicket, lang: TicketExportLang) {
  if (!ticket.qr) throw new Error('The entry QR code is not available yet')

  const qrUrl = await QRCode.toDataURL(ticket.qr, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 900,
    color: { dark: '#0B0B0C', light: '#FFFFFF' },
  })
  const qr = await loadImage(qrUrl)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not supported on this device')

  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = INK
  ctx.fillRect(0, 0, W, 350)
  ctx.fillStyle = SIGNAL
  ctx.fillRect(0, 350, W, 14)

  ctx.direction = 'ltr'
  ctx.textAlign = 'left'
  ctx.fillStyle = SIGNAL
  ctx.font = font(lang, 'bold', 44)
  ctx.fillText('TKT', 80, 110)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = font(lang, 'normal', 22)
  ctx.fillText(labels[lang].pass, 80, 165)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = font(lang, 'bold', 56)
  const eventLines = wrap(ctx, ticket.eventName, W - 160)
  drawLines(ctx, eventLines, 80, 245, 64, 2)
  ctx.fillStyle = '#B9BBC1'
  ctx.font = font(lang, 'normal', 28)
  ctx.fillText(ticket.ticketName.slice(0, 70), 80, 325)

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(100, 420, W - 200, 800)
  const qrSize = 690
  ctx.drawImage(qr, (W - qrSize) / 2, 462, qrSize, qrSize)
  ctx.textAlign = 'center'
  ctx.direction = lang === 'ar' ? 'rtl' : 'ltr'
  ctx.fillStyle = '#16794C'
  ctx.font = font(lang, 'bold', 28)
  ctx.fillText(labels[lang].ready, W / 2, 1185)

  ctx.textAlign = lang === 'ar' ? 'right' : 'left'
  ctx.strokeStyle = LINE
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(80, 1275)
  ctx.lineTo(W - 80, 1275)
  ctx.stroke()

  const text = labels[lang]
  const cell = (label: string, value: string, x: number, y: number, wide = false) => {
    ctx.fillStyle = MUTED
    ctx.font = font(lang, 'normal', 22)
    ctx.fillText(label, x, y)
    ctx.fillStyle = INK
    ctx.font = font(lang, 'bold', 30)
    const lines = wrap(ctx, value, wide ? W - 160 : 450)
    drawLines(ctx, lines, x, y + 42, 38, wide ? 3 : 2)
  }

  const left = lang === 'ar' ? W - 80 : 80
  const right = lang === 'ar' ? 650 : 640
  const alignLeft = lang === 'ar' ? 'right' : 'left'
  ctx.textAlign = alignLeft
  cell(text.guest, ticket.attendeeName, left, 1345)
  cell(text.type, ticket.ticketName, right, 1345)
  cell(text.date, formatDate(ticket.eventStartAt, lang, ticket.timezone), left, 1465)
  cell(text.venue, ticket.venueName || ticket.venueAddress || '—', right, 1465)

  if (ticket.seats.length) {
    const seatText = ticket.seats
      .map((seat) => [seat.busName, seat.label, seat.passengerName].filter(Boolean).join(' · '))
      .join(' / ')
    cell(text.seats, seatText, left, 1585, true)
  } else {
    cell(text.payment, ticket.paymentStatus, left, 1585)
  }

  ctx.strokeStyle = LINE
  ctx.beginPath()
  ctx.moveTo(80, 1665)
  ctx.lineTo(W - 80, 1665)
  ctx.stroke()
  ctx.fillStyle = MUTED
  ctx.font = font(lang, 'normal', 22)
  ctx.fillText(text.code, left, 1710)
  ctx.fillStyle = INK
  ctx.font = font(lang, 'bold', 34)
  ctx.fillText(ticket.reservationCode, left, 1755)

  ctx.fillStyle = SIGNAL
  ctx.fillRect(0, H - 16, W, 16)
  return canvas
}

function safeName(code: string) {
  return code.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 32) || 'ticket'
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function downloadTicketImage(ticket: PwaReservationTicket, lang: TicketExportLang = 'en') {
  const canvas = await buildCanvas(ticket, lang)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not render the ticket image')
  saveBlob(blob, `ticket-${safeName(ticket.reservationCode)}.png`)
}

export async function downloadTicketPdf(ticket: PwaReservationTicket, lang: TicketExportLang = 'en') {
  const canvas = await buildCanvas(ticket, lang)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [120, 180], compress: true })
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 120, 180, undefined, 'FAST')
  pdf.save(`ticket-${safeName(ticket.reservationCode)}.pdf`)
}
