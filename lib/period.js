/**
 * Peak/off-peak period engine (host half).
 * Pure functions shared by the scheduler tick and the browser panel. The
 * browser half re-implements the same algorithm in TypeScript
 * (`src/client/period.ts`); keep both in sync when changing window semantics.
 */

/** 'HH:mm' → minutes since midnight. Returns NaN for malformed input. */
export function parseClock(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value))
  if (match === null) return Number.NaN
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return Number.NaN
  return hours * 60 + minutes
}

/** minutes since midnight → 'HH:mm'. */
export function formatClock(minutes) {
  const safe = Number.isFinite(minutes) ? Math.round(minutes) : 0
  const hours = Math.floor(((safe % 1440) + 1440) % 1440 / 60)
  const mins = ((safe % 60) + 60) % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * One time-of-day window. `end` at or before `start` means the window crosses
 * midnight (e.g. 22:00–02:00 is active from 22:00 until 02:00 the next day).
 */
export function windowContains(window, minute) {
  const start = parseClock(window.start)
  const end = parseClock(window.end)
  if (Number.isNaN(start) || Number.isNaN(end)) return false
  if (start === end) return false // zero-length window selects nothing
  if (start < end) return minute >= start && minute < end
  return minute >= start || minute < end
}

/** Weekday face for one instant in the configured time zone. */
function timeFace(date, timeZone) {
  if (timeZone !== undefined && timeZone !== '') {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(date)
      const get = (type) => parts.find((part) => part.type === type)?.value
      const weekday = get('weekday')
      const hour = Number(get('hour'))
      const minute = Number(get('minute'))
      const weeks = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
      if (weekday === undefined || !Number.isFinite(hour) || !Number.isFinite(minute)) {
        // Unusable zone face (also covers the '24' midnight hour): fall back below.
      } else {
        return { day: weeks[weekday], minute: hour * 60 + minute }
      }
    } catch {
      // invalid time zone: fall back to host-local time
    }
  }
  return { day: date.getDay(), minute: date.getHours() * 60 + date.getMinutes() }
}

/**
 * Compute the current period for an instant.
 * @param {Date} date - the instant to evaluate.
 * @param {object} config - `timeZone`, `peakDays` (0=Sunday … 6=Saturday),
 *   and `peakWindows` (array of `{start, end}` 'HH:mm').
 * @returns {'peak' | 'off-peak'}
 */
export function periodAt(date, config) {
  const face = timeFace(date, config.timeZone)
  if (face === null) return 'off-peak'
  const days = config.peakDays ?? [1, 2, 3, 4, 5]
  if (!days.includes(face.day)) return 'off-peak'
  const windows = config.peakWindows ?? []
  for (const window of windows) {
    if (windowContains(window, face.minute)) return 'peak'
  }
  return 'off-peak'
}

/** Next minute boundary crossing after `now` (ms until the next full minute). */
export function msUntilNextMinute(now) {
  return (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
}