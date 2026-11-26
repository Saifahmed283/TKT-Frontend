import { useRef, useState } from 'react'
import { ExternalLink, FileImage, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { API_BASE, getAccessToken } from '@/lib/api'
import { useToast } from './toast'

type UploadResult = { url: string; path: string; name: string; mimeType: string; size: number }

/**
 * Upload APIs may return a same-origin path (for example /api/uploads/blob/...),
 * even when the API itself lives on another host. Resolve display URLs against
 * the configured API base, but keep the original URL for the reservation payload:
 * the backend validates and signs that stored capability URL.
 */
export function resolveUploadPreviewUrl(
  value: string,
  apiBase = API_BASE,
  origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
) {
  if (!value || /^(data:|blob:)/i.test(value)) return value
  try {
    return new URL(value, new URL(apiBase, origin)).toString()
  } catch {
    return value
  }
}

export function FileUploadField({
  label,
  value,
  onChange,
  accept = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf',
  hint,
  preview = true,
  className,
  uploadEndpoint = '/uploads',
}: {
  label: string
  value: string
  onChange: (url: string) => void
  accept?: string
  hint?: string
  preview?: boolean
  className?: string
  uploadEndpoint?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedMimeType, setUploadedMimeType] = useState<string | null>(null)
  const [uploadedName, setUploadedName] = useState<string | null>(null)
  const [previewFailed, setPreviewFailed] = useState(false)
  const toast = useToast()

  const upload = async (file: File) => {
    setUploading(true)
    setPreviewFailed(false)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const headers: Record<string, string> = {}
      const isPublicProof = uploadEndpoint === '/uploads/proof'
      const token = isPublicProof ? null : getAccessToken()
      if (token) headers.Authorization = 'Bearer ' + token
      const res = await fetch(API_BASE + uploadEndpoint, {
        method: 'POST',
        body: fd,
        headers,
        credentials: 'include',
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error?.message ?? 'Upload failed')
      const data = body?.data as UploadResult | undefined
      if (!data?.url) throw new Error('The server did not return a file URL')

      setUploadedMimeType(data.mimeType || file.type || null)
      setUploadedName(data.name || file.name)
      // Do not replace this with the resolved preview URL. Signed proxy paths
      // are interpreted by the backend when the reservation is submitted.
      onChange(data.url)
      toast.success('File uploaded')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed'
      toast.error(message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const cleanPath = value.split(/[?#]/, 1)[0]
  const isImage = Boolean(
    uploadedMimeType?.startsWith('image/')
    || /^data:image\//i.test(value)
    || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(cleanPath),
  )
  const isPdf = uploadedMimeType === 'application/pdf' || /\.pdf$/i.test(cleanPath)
  const previewUrl = value ? resolveUploadPreviewUrl(value) : ''

  const removeFile = () => {
    setUploadedMimeType(null)
    setUploadedName(null)
    setPreviewFailed(false)
    onChange('')
  }

  return (
    <div className={cn('block', className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-2">{label}</span>
        {hint && <span className="text-[11px] text-ink-3">{hint}</span>}
      </div>
      <div className="border border-line bg-elevated p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-busy={uploading || undefined}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 border border-line-soft bg-raised px-3 py-2 text-[12px] font-medium text-ink-2 transition hover:border-signal/40 hover:text-ink disabled:cursor-wait disabled:opacity-80"
          >
            {uploading ? <span className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current" /> : <Upload className="size-4" />}
            <span>{uploading ? 'Uploading…' : value ? 'Replace file' : 'Upload file'}</span>
          </button>
          {value && (
            <button type="button" onClick={removeFile} className="inline-flex items-center gap-1 px-2 py-2 text-[12px] text-ink-3 hover:text-danger">
              <X className="size-3.5" /> Remove
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void upload(file)
            }}
          />
        </div>

        {value && preview ? (
          <div className="mt-4 space-y-2 border border-line-soft bg-panel/50 p-3" data-testid="file-preview">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-ink-2">
                <FileImage className="size-4 shrink-0 text-signal" />
                <span>File preview</span>
              </div>
              <a href={previewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-signal hover:underline">
                <ExternalLink className="size-3" /> Open original
              </a>
            </div>

            {isImage && !previewFailed ? (
              <div className="grid min-h-40 place-items-center overflow-hidden border border-line-soft bg-canvas p-2 sm:min-h-56">
                <img
                  src={previewUrl}
                  alt={uploadedName ? uploadedName + ' preview' : label + ' preview'}
                  onError={() => setPreviewFailed(true)}
                  className="max-h-[420px] w-full object-contain"
                />
              </div>
            ) : isPdf ? (
              <object data={previewUrl} type="application/pdf" className="h-64 w-full border border-line-soft bg-canvas sm:h-80">
                <div className="p-4 text-xs text-ink-2">
                  PDF preview is not available in this browser. Use “Open original” to view it.
                </div>
              </object>
            ) : (
              <div role="status" className="border border-line-soft bg-canvas p-4 text-xs text-ink-2">
                {isImage
                  ? 'The preview could not be loaded. Check the file link or open the original file.'
                  : 'This file type can be opened separately.'}
              </div>
            )}

            <p className="break-all text-[11px] text-ink-3">{uploadedName || value}</p>
          </div>
        ) : value ? (
          <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-3">
            <FileImage className="size-4" /> File uploaded
            <a href={previewUrl} target="_blank" rel="noreferrer" className="text-signal hover:underline">Open original</a>
          </div>
        ) : (
          <p className="mt-2 text-[11px] text-ink-3">Upload an image or PDF. Files are stored on the server.</p>
        )}
      </div>
    </div>
  )
}
