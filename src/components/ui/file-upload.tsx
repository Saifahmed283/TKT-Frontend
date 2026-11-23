import { useRef, useState } from 'react'
import { Upload, X, FileImage, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAccessToken } from '@/lib/api'
import { useToast } from './toast'

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

type UploadResult = { url: string; path: string; name: string; mimeType: string; size: number }

export function FileUploadField({
  label,
  value,
  onChange,
  accept = 'image/*,application/pdf',
  hint,
  preview = true,
  className,
}: {
  label: string
  value: string
  onChange: (url: string) => void
  accept?: string
  hint?: string
  preview?: boolean
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const toast = useToast()

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const headers: Record<string, string> = {}
      const token = getAccessToken()
      if (token) headers.Authorization = `Bearer `
      const res = await fetch(`${API_BASE}/uploads`, { method: 'POST', body: fd, headers, credentials: 'include' })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error?.message ?? 'Upload failed')
      const data = body?.data as UploadResult
      onChange(data.url)
      toast.success('File uploaded')
    } catch (e: any) {
      toast.error(e?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(value) || value.startsWith('data:image')

  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-2">{label}</span>
        {hint && <span className="text-[11px] text-ink-3">{hint}</span>}
      </span>
      <div className="border border-line bg-elevated p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 border border-line-soft bg-raised px-3 py-2 text-[12px] font-medium text-ink-2 transition hover:border-signal/40 hover:text-ink disabled:opacity-60"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading ? 'Uploading…' : value ? 'Replace file' : 'Upload file'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} className="inline-flex items-center gap-1 px-2 py-2 text-[12px] text-ink-3 hover:text-danger">
              <X className="size-3.5" /> Remove
            </button>
          )}
          <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f) }} />
        </div>
        {value ? (
          <div className="mt-3 flex items-center gap-3">
            {preview && isImage ? (
              <img src={value} alt="" className="h-14 w-14 border border-line object-cover bg-canvas" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center border border-line bg-canvas text-ink-3"><FileImage className="size-5" /></div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] text-ink-2">{value}</p>
              <p className="text-[11px] text-ink-3">Stored securely via authenticated upload</p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-[11px] text-ink-3">Upload an image or PDF. Files are stored on the server.</p>
        )}
      </div>
    </label>
  )
}

