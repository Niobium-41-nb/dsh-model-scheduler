/**
 * Schedule panel: current period + effective model, the peak/off-peak
 * configuration (models, windows, days, enable switch), and a searchable
 * model picker that assigns a model or uses it for the current session.
 */

import { useEffect, useSyncExternalStore, useState } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { CatalogState, ModelSchedulerInjected } from './contract.ts'
import { ModelSearchList } from './ModelSearchList.tsx'
import { NS } from './locales.ts'
import { activeRoute, periodAt, type ModelSchedulerSettings } from './period.ts'

/** Panel internal navigation. */
type View = 'main' | 'search'

/** What the search view assigns a picked model to. */
type SearchTarget = 'use' | 'peak' | 'off-peak'

const WEEKDAYS = [
  { id: 0, key: 'weekday.sun' },
  { id: 1, key: 'weekday.mon' },
  { id: 2, key: 'weekday.tue' },
  { id: 3, key: 'weekday.wed' },
  { id: 4, key: 'weekday.thu' },
  { id: 5, key: 'weekday.fri' },
  { id: 6, key: 'weekday.sat' },
] as const

const EMPTY_CONFIG: ModelSchedulerSettings = {}

/** Props of the schedule panel content. */
export interface ModelSchedulerPanelProps {
  readonly injected: ModelSchedulerInjected
  /** Localized copy seat. */
  readonly t: TranslateNS<typeof NS>
  /** Close the panel (back to the composer). */
  readonly onClose: () => void
}

/** Render the schedule panel content. */
export function ModelSchedulerPanel({ injected, t, onClose }: ModelSchedulerPanelProps) {
  const snapshot = useSyncExternalStore(injected.scope.subscribe, injected.scope.getSnapshot)
  const config = snapshot.value ?? EMPTY_CONFIG
  const [now, setNow] = useState(() => new Date())
  const [view, setView] = useState<View>('main')
  const [target, setTarget] = useState<SearchTarget>('use')
  const [query, setQuery] = useState('')
  const [catalog, setCatalog] = useState<CatalogState>({ status: 'idle', value: null, error: null })
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'saved' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const timer = setInterval(() => { setNow(new Date()) }, 1_000)
    return () => { clearInterval(timer) }
  }, [])

  useEffect(() => {
    void injected.loadCatalog().then(
      (value) => { setCatalog({ status: 'ready', value, error: null }) },
      (error: unknown) => {
        setCatalog({ status: 'error', value: null, error: error instanceof Error ? error.message : String(error) })
      },
    )
  }, [injected])

  const period = periodAt(now, config)
  const effective = activeRoute(config, period)
  const periodLabel = period === 'peak' ? t('period.peak') : t('period.offpeak')

  /** Write one settings field, surfacing the outcome on the shared notice. */
  const setField = (field: keyof ModelSchedulerSettings, value: unknown): void => {
    setBusy(true)
    void injected.scope.set(String(field), value).then(
      () => {
        setBusy(false)
        setNotice({ kind: 'saved', text: t('notice.saved') })
      },
      (error: unknown) => {
        setBusy(false)
        setNotice({ kind: 'error', text: t('notice.error', { message: error instanceof Error ? error.message : String(error) }) })
      },
    )
  }

  const openSearch = (next: SearchTarget): void => {
    setTarget(next)
    setQuery('')
    setView('search')
  }

  const routeOf = (row: { readonly group: { readonly id: string }; readonly model: { readonly id: string; readonly reasoning?: { readonly defaultEffort?: string } } }) => ({
    provider: row.group.id,
    model: row.model.id,
    ...(row.model.reasoning?.defaultEffort === undefined ? {} : { reasoningEffort: row.model.reasoning.defaultEffort }),
  })

  const useNow = (row: Parameters<typeof routeOf>[0]): void => {
    setBusy(true)
    void injected.selectModel(routeOf(row)).then(
      () => {
        setBusy(false)
        setNotice({ kind: 'saved', text: t('notice.saved') })
        setView('main')
      },
      (error: unknown) => {
        setBusy(false)
        setNotice({ kind: 'error', text: t('notice.error', { message: error instanceof Error ? error.message : String(error) }) })
      },
    )
  }

  const assign = (row: Parameters<typeof routeOf>[0]): void => {
    setField(target === 'peak' ? 'peakModel' : 'offPeakModel', routeOf(row))
    setView('main')
  }

  const actions = target === 'use'
    ? [{ key: 'use', label: t('search.use'), primary: true, onPick: useNow }]
    : [
      { key: 'assign', label: target === 'peak' ? t('search.setPeak') : t('search.setOffpeak'), primary: true, onPick: assign },
      { key: 'use', label: t('search.use'), onPick: useNow },
    ]

  /** Route label for one configured slot ('provider / model'), or a pick hint when empty. */
  const routeLabel = (route: ModelSchedulerSettings['peakModel']): string =>
    route?.provider === undefined || route?.provider === '' || route?.model === undefined || route?.model === ''
      ? t('config.pick')
      : t('config.route', { provider: route.provider, model: route.model })

  const windows = config.peakWindows ?? []
  const days = config.peakDays ?? []

  if (view === 'search') {
    const groups = catalog.value?.groups ?? []
    return (
      <>
        <div className="msd-panelHead">
          <button type="button" className="msd-close" onClick={() => { setView('main') }}>{t('action.back')}</button>
          <span className="msd-panelTitle">{t('search.title')}</span>
          <button type="button" className="msd-close" aria-label={t('panel.close')} onClick={onClose}>✕</button>
        </div>
        <div className="msd-searchRoot">
          <input
            type="text"
            className="msd-search"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(event) => { setQuery(event.target.value) }}
            autoFocus
          />
          <span className="msd-hint">{t('search.hint')}</span>
          {catalog.status === 'loading' || catalog.status === 'idle'
            ? <div className="msd-loading">{t('notice.loading')}</div>
            : catalog.status === 'error'
              ? <div className="msd-fail">{t('notice.error', { message: catalog.error ?? 'catalog' })}</div>
              : (
                <ModelSearchList
                  groups={groups}
                  query={query}
                  current={catalog.value?.default ?? null}
                  actions={actions}
                  t={t}
                />
              )}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="msd-panelHead">
        <span className="msd-panelTitle">{t('panel.title')}</span>
        <button type="button" className="msd-close" aria-label={t('panel.close')} onClick={onClose}>✕</button>
      </div>
      <div className="msd-status">
        <div className="msd-statusRow">
          <span className={period === 'peak' ? 'msd-badge msd-badge-peak' : 'msd-badge msd-badge-offpeak'} />
          <span>{t('period.active', { period: periodLabel })}</span>
        </div>
        <div className="msd-statusRow">
          {effective !== undefined
            ? <span>{t('status.effective', { model: routeLabelFrom(effective, t) })}</span>
            : config.enabled === true
              ? <span className="msd-statusDim">{t('status.unconfigured')}</span>
              : <span className="msd-statusDim">{t('status.disabled')}</span>}
        </div>
      </div>
      <div className="msd-section">
        <span className="msd-sectionTitle">{t('config.enabled')}</span>
        <label className="msd-switchRow">
          <input
            type="checkbox"
            checked={config.enabled === true}
            disabled={busy}
            onChange={(event) => { setField('enabled', event.target.checked) }}
          />
          <span className="msd-switchLabel">{config.enabled === true ? t('config.on') : t('config.off')}</span>
        </label>
      </div>
      <div className="msd-section">
        <span className="msd-sectionTitle">{t('config.peakModel')}</span>
        <div className="msd-row">
          <span className="msd-rowLabel">{t('period.peak')}</span>
          <button type="button" className="msd-pick" onClick={() => { openSearch('peak') }}>
            <span className="msd-pickText">{routeLabel(config.peakModel)}</span>
            <span className="msd-pickChevron">▾</span>
          </button>
        </div>
        <div className="msd-row">
          <span className="msd-rowLabel">{t('period.offpeak')}</span>
          <button type="button" className="msd-pick" onClick={() => { openSearch('off-peak') }}>
            <span className="msd-pickText">{routeLabel(config.offPeakModel)}</span>
            <span className="msd-pickChevron">▾</span>
          </button>
        </div>
      </div>
      <div className="msd-section">
        <span className="msd-sectionTitle">{t('config.peakWindows', { timeZone: config.timeZone ?? '' })}</span>
        {[0, 1].map(index => (
          <div className="msd-windowRow" key={index}>
            <span className="msd-windowLabel">{t('config.windowN', { n: index + 1 })}</span>
            <input
              type="time"
              className="msd-time"
              aria-label={t('config.windowStart')}
              value={windows[index]?.start ?? '09:00'}
              onChange={(event) => {
                const next = windows.map(window => ({ ...window }))
                next[index] = { start: event.target.value || '', end: windows[index]?.end ?? '' }
                setField('peakWindows', next)
              }}
            />
            <span>–</span>
            <input
              type="time"
              className="msd-time"
              aria-label={t('config.windowEnd')}
              value={windows[index]?.end ?? '12:00'}
              onChange={(event) => {
                const next = windows.map(window => ({ ...window }))
                next[index] = { start: windows[index]?.start ?? '', end: event.target.value || '' }
                setField('peakWindows', next)
              }}
            />
          </div>
        ))}
      </div>
      <div className="msd-section">
        <span className="msd-sectionTitle">{t('config.peakDays')}</span>
        <div className="msd-days">
          {WEEKDAYS.map(day => (
            <button
              key={day.id}
              type="button"
              className="msd-chip"
              aria-pressed={days.includes(day.id)}
              onClick={() => {
                const next = days.includes(day.id)
                  ? days.filter(existing => existing !== day.id)
                  : [...days, day.id].sort()
                setField('peakDays', next)
              }}
            >
              {t(day.key)}
            </button>
          ))}
        </div>
      </div>
      <div className="msd-actions">
        <button
          type="button"
          className="msd-primary"
          disabled={busy || effective === undefined}
          onClick={() => { setField('applyRequestedAt', Date.now()) }}
        >
          {t('action.applyNow')}
        </button>
        {notice !== null ? (
          <span className={notice.kind === 'error' ? 'msd-fail' : 'msd-statusDim'}>{notice.text}</span>
        ) : null}
      </div>
    </>
  )
}

/** Route label helper shared with the status line (accepts any route-shaped value). */
function routeLabelFrom(
  route: { readonly provider?: string; readonly model?: string },
  t: TranslateNS<typeof NS>,
): string {
  return t('config.route', { provider: route.provider ?? '?', model: route.model ?? '?' })
}