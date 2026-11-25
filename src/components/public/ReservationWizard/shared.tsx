import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export function money(price: string, lang: string, currency = 'EGP') {
  const n = Number(price)
  if (!Number.isFinite(n)) return price
  if (n === 0) return lang === 'ar' ? 'مجاني' : 'Free'
  return `${currency} ${n.toLocaleString()}`
}

export function useQrDataUrl(code: string | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!code) { setUrl(null); return }
    let alive = true
    QRCode.toDataURL(code, { errorCorrectionLevel: 'M', margin: 1, width: 320, color: { dark: '#0B0B0C', light: '#FFFFFF' } })
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(null))
    return () => { alive = false }
  }, [code])
  return url
}

export function QrDataImg({ code }: { code: string }) {
  const url = useQrDataUrl(code)
  if (!url) return null
  return <img src={url} alt="Ticket QR" className="h-32 w-32 border border-line-soft bg-white p-2" />
}
