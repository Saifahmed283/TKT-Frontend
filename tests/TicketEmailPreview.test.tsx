/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TicketEmailPreview } from '../src/components/events/TicketEmailPreview'

afterEach(cleanup)

describe('TicketEmailPreview', () => {
  it('generates a real sample QR image for the email preview', async () => {
    render(<TicketEmailPreview eventName="Preview Night" />)
    const qr = await screen.findByTestId('ticket-email-preview-qr')
    await waitFor(() => expect(qr.getAttribute('src')).toMatch(/^data:image\/png;base64,/))
    expect(qr.getAttribute('alt')).toBe('Preview-only QR code')
    expect(screen.getByText(/Preview QR only/)).toBeTruthy()
  })
  it('uses the saved email section order and theme in the preview', () => {
    render(<TicketEmailPreview eventName="Preview Night" design={{accentColor:'#445566',backgroundColor:'#fafafa',layoutOrder:['qr','intro','details','action','footer','legal']}} />)
    const qrCopy=screen.getByText('Scan this code to verify your ticket')
    const intro=screen.getByText('تم تأكيد حجزك بنجاح')
    expect(qrCopy.compareDocumentPosition(intro) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByTestId('ticket-email-preview').getAttribute('style')).toContain('background-color: rgb(250, 250, 250)')
  })
})
