/**
 * Composer trigger for the model-scheduler panel: a period badge (peak /
 * off-peak) next to the model seat. Clicking opens the portaled panel; the
 * panel content lives in ModelSchedulerPanel.
 */

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { IconChevronDownOutline14, useAnchoredPosition, useDismissOnOutsidePointer } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { ModelSchedulerInjected } from './contract.ts'
import { NS } from './locales.ts'
import { ModelSchedulerPanel } from './ModelSchedulerPanel.tsx'
import { periodAt } from './period.ts'

/** Full props of the composer model-scheduler trigger. */
export type ModelSchedulerButtonProps =
  PropsRuntime<'conversation.input.right'> & PropsLocale<typeof NS> & ModelSchedulerInjected

/** Render the trigger and, while open, the anchored panel. */
export function ModelSchedulerButton({ t, ...injected }: ModelSchedulerButtonProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const style = useAnchoredPosition({ open, anchorRef: rootRef, panelRef, gap: 6, margin: 12 })
  useDismissOnOutsidePointer(rootRef, open, setOpen, panelRef)

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => { setNow(new Date()) }, 1_000)
    return () => { clearInterval(timer) }
  }, [])
  const snapshot = useSyncExternalStore(injected.scope.subscribe, injected.scope.getSnapshot)
  const period = periodAt(now, snapshot.value ?? {})
  const periodLabel = period === 'peak' ? t('period.peak') : t('period.offpeak')

  return (
    <div ref={rootRef} className="msd-root">
      <button
        type="button"
        className="msd-trigger"
        aria-label={t('button.aria', { period: periodLabel })}
        title={t('button.tooltip')}
        onClick={() => { setOpen(open => !open) }}
      >
        <span className={period === 'peak' ? 'msd-badge msd-badge-peak' : 'msd-badge msd-badge-offpeak'} />
        <span>{periodLabel}</span>
        <IconChevronDownOutline14 />
      </button>
      {open ? createPortal(
        <div ref={panelRef} className="msd-panel" style={style ?? undefined}>
          <ModelSchedulerPanel injected={injected} t={t} onClose={() => { setOpen(false) }} />
        </div>,
        document.body,
      ) : null}
    </div>
  )
}