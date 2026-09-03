/**
 * Host-side tests for the period engine (`lib/period.js`).
 * Run with `node --test` (see package.json `host:test`).
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseClock, formatClock, windowContains, periodAt } from '../period.js'

const CONFIG = {
  timeZone: 'Asia/Shanghai',
  peakDays: [1, 2, 3, 4, 5], // Mon–Fri
  peakWindows: [
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '18:00' },
  ],
}

/** Build a UTC Date for an Asia/Shanghai wall-clock instant. */
function beijing(day, hour, minute) {
  // Asia/Shanghai is UTC+8 with no DST.
  return new Date(Date.UTC(2026, 0, day, hour - 8, minute))
}

// 2026-01-05 is a Monday; 2026-01-10 is a Saturday; 2026-01-11 is a Sunday.
test('parseClock and formatClock round-trip', () => {
  assert.equal(parseClock('09:00'), 540)
  assert.equal(parseClock('23:59'), 1439)
  assert.equal(parseClock('24:00'), Number.NaN)
  assert.equal(parseClock('9:5'), Number.NaN)
  assert.equal(parseClock('nope'), Number.NaN)
  assert.equal(formatClock(540), '09:00')
  assert.equal(formatClock(1500), '01:00')
})

test('windowContains handles same-day and midnight-crossing windows', () => {
  const day = { start: '09:00', end: '12:00' }
  assert.equal(windowContains(day, 8 * 60 + 59), false)
  assert.equal(windowContains(day, 9 * 60), true)
  assert.equal(windowContains(day, 11 * 60 + 59), true)
  assert.equal(windowContains(day, 12 * 60), false)

  const night = { start: '22:00', end: '02:00' }
  assert.equal(windowContains(night, 23 * 60), true)
  assert.equal(windowContains(night, 0), true)
  assert.equal(windowContains(night, 1 * 60 + 59), true)
  assert.equal(windowContains(night, 2 * 60), false)
  assert.equal(windowContains(night, 12 * 60), false)

  assert.equal(windowContains({ start: '22:00', end: '22:00' }, 22 * 60), false)
  assert.equal(windowContains({ start: 'bad', end: '12:00' }, 10 * 60), false)
})

test('Monday peak windows in Beijing time', () => {
  assert.equal(periodAt(beijing(5, 8, 59), CONFIG), 'off-peak')
  assert.equal(periodAt(beijing(5, 9, 0), CONFIG), 'peak')
  assert.equal(periodAt(beijing(5, 11, 59), CONFIG), 'peak')
  assert.equal(periodAt(beijing(5, 12, 0), CONFIG), 'off-peak')
  assert.equal(periodAt(beijing(5, 13, 30), CONFIG), 'off-peak')
  assert.equal(periodAt(beijing(5, 14, 0), CONFIG), 'peak')
  assert.equal(periodAt(beijing(5, 17, 59), CONFIG), 'peak')
  assert.equal(periodAt(beijing(5, 18, 0), CONFIG), 'off-peak')
  assert.equal(periodAt(beijing(5, 23, 0), CONFIG), 'off-peak')
})

test('weekends are fully off-peak', () => {
  assert.equal(periodAt(beijing(10, 10, 30), CONFIG), 'off-peak') // Saturday
  assert.equal(periodAt(beijing(11, 15, 0), CONFIG), 'off-peak') // Sunday
})

test('custom peak days and windows', () => {
  const custom = {
    ...CONFIG,
    peakDays: [0, 6], // weekends only
    peakWindows: [{ start: '20:00', end: '08:00' }], // overnight
  }
  assert.equal(periodAt(beijing(10, 21, 0), custom), 'peak') // Saturday night
  assert.equal(periodAt(beijing(11, 1, 0), custom), 'peak') // Sunday early morning
  assert.equal(periodAt(beijing(11, 9, 0), custom), 'off-peak') // Sunday day
  assert.equal(periodAt(beijing(5, 21, 0), custom), 'off-peak') // Monday excluded
})

test('local time when timeZone is empty, and fallback on invalid zone', () => {
  const local = { ...CONFIG, timeZone: '' }
  const now = new Date()
  assert.equal(periodAt(now, local), periodAt(now, { ...local, timeZone: undefined }))
  const bogus = { ...CONFIG, timeZone: 'Not/AZone' }
  assert.equal(periodAt(now, bogus), periodAt(now, local))
})