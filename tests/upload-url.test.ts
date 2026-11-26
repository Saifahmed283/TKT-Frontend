import { describe, expect, it } from 'vitest'
import { API_BASE, resolveUploadUrl } from '../src/lib/api/api'

describe('resolveUploadUrl', () => {
  it('keeps absolute and inline URLs unchanged', () => {
    expect(resolveUploadUrl(null)).toBe('')
    expect(resolveUploadUrl('  ')).toBe('')
    expect(resolveUploadUrl('https://cdn.example.com/proof.png')).toBe('https://cdn.example.com/proof.png')
    expect(resolveUploadUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA')
  })

  it('maps API-relative proof links through the configured API base', () => {
    const base = API_BASE.replace(/\/+$/, '')
    expect(resolveUploadUrl('/api/uploads/blob/uploads/proof.png?token=abc&exp=1'))
      .toBe(`${base}/uploads/blob/uploads/proof.png?token=abc&exp=1`)
  })

  it('maps local upload paths to the backend origin', () => {
    const base = API_BASE.replace(/\/+$/, '').replace(/\/api\/?$/, '')
    expect(resolveUploadUrl('/uploads/proof.png')).toBe(`${base}/uploads/proof.png`)
  })
})
