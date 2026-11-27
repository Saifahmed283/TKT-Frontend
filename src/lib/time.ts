export const EGYPT_TIME_ZONE = 'Africa/Cairo'
export const EGYPT_TIME_LABEL = 'Egypt · Africa/Cairo'

export type DateInput = string | Date | number | null | undefined

function toDate(input: DateInput): Date | null {
  if (input === null || input === undefined || input === '') return null
  const date = input instanceof Date ? input : new Date(input)
  return Number.isFinite(date.getTime()) ? date : null
}

function upperPeriod(value: string): string {
  return value.replace(/\s?([ap]m)$/i, (_match, period: string) => ` ${period.toUpperCase()}`)
}

export function formatInEgypt(
  input: DateInput,
  options: Intl.DateTimeFormatOptions,
  locale = 'en-GB',
): string {
  const date = toDate(input)
  if (!date) return '—'
  return upperPeriod(
    new Intl.DateTimeFormat(locale, {
      ...options,
      timeZone: EGYPT_TIME_ZONE,
      hour12: true,
      hourCycle: 'h12',
    }).format(date),
  )
}

export function formatEgyptDate(
  input: DateInput,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
  locale = 'en-GB',
): string {
  return formatInEgypt(input, options, locale)
}

export function formatEgyptTime(
  input: DateInput,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' },
  locale = 'en-GB',
): string {
  return formatInEgypt(input, options, locale)
}

export function formatEgyptDateTime(
  input: DateInput,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
  locale = 'en-GB',
): string {
  return formatInEgypt(input, options, locale)
}

/** Canonical ticket/event label: Friday, 4 December at 08:34 PM. */
export function formatTicketDateTime(input: DateInput, locale = 'en-GB'): string {
  const date = toDate(input)
  if (!date) return '—'
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone: EGYPT_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    hourCycle: 'h12',
  }).formatToParts(date)
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  const hour = pick('hour').padStart(2, '0')
  return `${pick('weekday')}, ${pick('day')} ${pick('month')} at ${hour}:${pick('minute')} ${pick('dayPeriod').toUpperCase()}`
}

function egyptOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EGYPT_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const pick = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0)
  const asUtc = Date.UTC(pick('year'), pick('month') - 1, pick('day'), pick('hour'), pick('minute'), pick('second'))
  return (asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000
}

/** Interpret a datetime-local value as Egypt wall time and return its UTC instant. */
export function egyptDateTimeLocalToIso(value: string): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)
  if (!match) return undefined
  const [, year, month, day, hour, minute] = match.map(Number)
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute)
  let utc = localAsUtc
  for (let i = 0; i < 3; i += 1) {
    utc = localAsUtc - egyptOffsetMinutes(new Date(utc)) * 60000
  }
  return new Date(utc).toISOString()
}

/** Format a UTC instant for a datetime-local input in Egypt wall time. */
export function toEgyptDateTimeLocal(input: DateInput): string {
  const date = toDate(input)
  if (!date) return ''
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: EGYPT_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date)
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${pick('year')}-${pick('month')}-${pick('day')}T${pick('hour')}:${pick('minute')}`
}
