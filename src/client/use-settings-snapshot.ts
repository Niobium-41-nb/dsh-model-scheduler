/**
 * React binding for one settings scope.
 *
 * `SettingsScope.getSnapshot` / `subscribe` are declared as interface methods
 * and implemented as class prototype methods, so they lose `this` the moment
 * they are handed to `useSyncExternalStore` as bare references. The failure is
 * silent from the user's side: the entry's per-slot error boundary catches the
 * `TypeError`, logs it, and renders an empty `[data-slot-error]` node — the
 * trigger button simply never appears. Always read a scope through this hook.
 */

import { useCallback, useSyncExternalStore } from 'react'
import type { SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ModelSchedulerSettings } from './period.ts'

/** Subscribe to the `model-scheduler` namespace snapshot with stable callbacks. */
export function useSettingsSnapshot(
  scope: SettingsScope<ModelSchedulerSettings>,
): SettingsScopeSnapshot<ModelSchedulerSettings> {
  const subscribe = useCallback((listener: () => void) => scope.subscribe(listener), [scope])
  const getSnapshot = useCallback(() => scope.getSnapshot(), [scope])
  return useSyncExternalStore(subscribe, getSnapshot)
}
