import { describe, expect, it } from 'vitest'
import { resolveUploadPreviewUrl } from '../src/components/ui/file-upload'

describe('resolveUploadPreviewUrl', () => {
  it('resolves signed API paths against the configured backend origin', () => {
    const url = resolveUploadPreviewUrl(
      '/api/uploads/blob/uploads/proof.jpg?token=signed',
      'https://tkt-api.example/api',
      'https://ticket.example',
    )
    expect(url).toBe('https://tkt-api.example/api/uploads/blob/uploads/proof.jpg?token=signed')
  })

  it('keeps absolute storage URLs unchanged', () => {
    const value = 'https://storage.example/uploads/photo.png?signature=1'
    expect(resolveUploadPreviewUrl(value, 'https://tkt-api.example/api', 'https://ticket.example')).toBe(value)
  })

  it('does not modify browser-local data or blob URLs', () => {
    const dataUrl = 'data:image/png;base64,abc'
    const blobUrl = 'blob:https://ticket.example/local-id'
    expect(resolveUploadPreviewUrl(dataUrl, 'https://tkt-api.example/api', 'https://ticket.example')).toBe(dataUrl)
    expect(resolveUploadPreviewUrl(blobUrl, 'https://tkt-api.example/api', 'https://ticket.example')).toBe(blobUrl)
  })

  it('uses the app origin when API_BASE is a same-origin relative path', () => {
    expect(resolveUploadPreviewUrl('/api/uploads/blob/uploads/proof.webp?token=1', '/api', 'https://ticket.example'))
      .toBe('https://ticket.example/api/uploads/blob/uploads/proof.webp?token=1')
  })
})
