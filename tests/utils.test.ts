import { describe, expect, it, vi, afterEach } from 'vitest'
import { cn, formatDate, formatDateTime, timeAgo, money, truncate, initials, pluralize } from '../src/lib/utils'

describe('cn', () => {
  it('merges tailwind classes with clsx', () => {
    expect(cn('a', 'b')).toBe('a b')
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn(false && 'x', null, undefined, 'y')).toBe('y')
  })
})

describe('formatDate / formatDateTime', () => {
  it('returns em dash for nullish or invalid input', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('not-a-date')).toBe('—')
    expect(formatDateTime(null)).toBe('—')
  })

  it('formats a valid date', () => {
    const d = new Date(2026, 7, 14, 9, 30)
    expect(formatDate(d)).toBe(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }))
    expect(formatDateTime(d.toISOString())).toBe(
      d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    )
  })
})

describe('timeAgo', () => {
  afterEach(() => vi.useRealTimers())

  it('handles nullish input', () => {
    expect(timeAgo(null)).toBe('—')
    expect(timeAgo('garbage')).toBe('—')
  })

  it('renders relative labels', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-14T12:00:00Z'))
    expect(timeAgo(Date.now() - 20_000)).toBe('just now')
    expect(timeAgo(Date.now() - 5 * 60_000)).toBe('5m ago')
    expect(timeAgo(Date.now() - 3 * 3600_000)).toBe('3h ago')
    expect(timeAgo(Date.now() - 4 * 86_400_000)).toBe('4d ago')
  })
})

describe('money', () => {
  it('formats currency', () => {
    expect(money(1234.5)).toBe('$1,234.50')
    expect(money('99')).toBe('$99.00')
    expect(money(null)).toBe('$0.00')
    expect(money('abc')).toBe('$0.00')
  })
})

describe('text helpers', () => {
  it('truncates long strings', () => {
    expect(truncate('short')).toBe('short')
    expect(truncate('a very long string', 6)).toBe('a very…')
  })

  it('builds initials', () => {
    expect(initials('ahmed hassan')).toBe('AH')
    expect(initials('sara')).toBe('S')
    expect(initials('')).toBe('')
  })

  it('pluralizes', () => {
    expect(pluralize(1, 'task')).toBe('1 task')
    expect(pluralize(3, 'task')).toBe('3 tasks')
    expect(pluralize(2, 'person', 'people')).toBe('2 people')
  })
})
