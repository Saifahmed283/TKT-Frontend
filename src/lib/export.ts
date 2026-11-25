import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { API_BASE, getAccessToken } from './api'

const escape = (v: unknown): string => {
  const s = v == null ? '' : String(v)
  // Neutralize spreadsheet formula injection before CSV quoting.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function exportCsv(filename: string, headers: string[], rows: unknown[][]) {
  const lines = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))]
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadAuthFile(path: string, filename: string) {
  const token = getAccessToken()
  const res = await fetch(`${API_BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined, credentials: 'include' })
  if (!res.ok) throw new Error(`Export failed (${res.status})`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportPdf(filename: string, title: string, headers: string[], rows: unknown[][]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  doc.setFillColor('#0b0c0d')
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 14, 'F')
  doc.setTextColor('#ffb020')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TKT', 10, 9)
  doc.setTextColor('#ffffff')
  doc.setFontSize(9)
  doc.text(title.toUpperCase(), 20, 9)
  doc.setTextColor('#8f8f99')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(`${new Date().toLocaleString()}  ·  ${rows.length} rows`, 10, 20)
  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => r.map((v) => (v == null ? '' : String(v)))),
    startY: 25,
    styles: { fontSize: 7, cellPadding: 1.6 },
    headStyles: { fillColor: [11, 12, 13], textColor: [255, 176, 32], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [244, 244, 245] },
  })
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}