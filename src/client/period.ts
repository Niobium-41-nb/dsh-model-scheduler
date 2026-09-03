/**
 * Peak/off-peak period engine (browser half).
 * Mirrors `lib/period.js`; keep the two implementations in sync. Both sides
 * evaluate the same configured schedule so the panel preview matches the host
 * switch without extra wiring.
 */

/** 'HH:mm' → minutes since midnight; NaN for malformed input. */
export function parseClock(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (match === null) return Number.NaN
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return Number.NaN
  return hours * 60 + minutes
}

/** One time-of-day window. `end` at or before `start` crosses midnight. */
export interface PeakWindowConfig {
  readonly start: string
  readonly end: string
}

/** Route-shaped model config mirroring the Host schema's `modelRoute`. */
export interface ModelRouteConfig {
  readonly provider?: string
  readonly model?: string
  readonly reasoningEffort?: string
}

/** Full section shape of the `model-scheduler` settings namespace. */
export interface ModelSchedulerSettings {
  readonly enabled?: boolean
  readonly timeZone?: string
  readonly peakDays?: readonly number[]
  readonly peakWindows?: readonly PeakWindowConfig[]
  readonly peakModel?: ModelRouteConfig
  readonly offPeakModel?: ModelRouteConfig
}

/** Whether one instant falls inside a window. */
export function windowContains(window: PeakWindowConfig, minute: number): boolean {
  const start = parseClock(window.start)
  const end = parseClock(window.end)
  if (Number.isNaN(start) || Number.isNaN(end)) return false
  if (start === end) return false
  if (start < end) return minute >= start && minute < end
  return minute >= start || minute < end
}

/** Weekday face (0=Sunday … 6=Saturday) for one instant in a time zone. */
function timeFace(date: Date, timeZone: string | undefined) {
  if (timeZone !== undefined && timeZone !== '') {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(date)
      const get = (type: string) => parts.find((part) => part.type === type)?.value
      const weekday = get('weekday')
      const hour = Number(get('hour'))
      const minute = Number(get('minute'))
      const weeks: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
      if (weekday !== undefined && Number.isFinite(hour) && Number.isFinite(minute)) {
        return { day: weeks[weekday], minute: hour * 60 + minute }
      }
    } catch {
      // invalid time zone: fall back to browser-local time
    }
  }
  return { day: date.getDay(), minute: date.getHours() * 60 + date.getMinutes() }
}

/** Current period for one instant under a schedule section. */
export function periodAt(date: Date, settings: ModelSchedulerSettings): 'peak' | 'off-peak' {
  const face = timeFace(date, settings.timeZone)
  if (face === null) return 'off-peak'
  const days = settings.peakDays ?? [1, 2, 3, 4, 5]
  if (!days.includes(face.day)) return 'off-peak'
  const windows = settings.peakWindows ?? []
  for (const window of windows) {
    if (windowContains(window, face.minute)) return 'peak'
  }
  return 'off-peak'
}

/** The model route active for one instant, or undefined when unconfigured. */
export function activeRoute(
  settings: ModelSchedulerSettings,
  period: 'peak' | 'off-peak',
): ModelRouteConfig | undefined {
  const route = period === 'peak' ? settings.peakModel : settings.offPeakModel
  if (route?.provider === undefined || route?.provider === '' || route?.model === undefined || route?.model === '') {
    return undefined
  }
  return route
}