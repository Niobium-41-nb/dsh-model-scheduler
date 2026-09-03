/**
 * Shared client contracts for the model-scheduler browser face.
 */

import type { ModelCatalog, ModelProviderGroup } from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ModelSchedulerSettings } from './period.ts'

/** One selectable model row within its provider group. */
export interface CatalogRow {
  readonly group: ModelProviderGroup
  readonly model: ModelProviderGroup['models'][number]
}

/** One configurable action offered for a model row in the search list. */
export interface ModelRowAction {
  readonly key: string
  readonly label: string
  readonly primary?: boolean
  readonly onPick: (row: CatalogRow) => void
}

/** Live catalog state held by the panel. */
export interface CatalogState {
  readonly status: 'idle' | 'loading' | 'ready' | 'error'
  readonly value: ModelCatalog | null
  readonly error: string | null
}

/** Business face injected into the ModelSchedulerButton component. */
export interface ModelSchedulerInjected {
  /** Owning session identity. */
  readonly sessionId: string
  /** Bound `model-scheduler` settings scope (shared across sessions). */
  readonly scope: SettingsScope<ModelSchedulerSettings>
  /** Load the Host-generation model catalog. */
  readonly loadCatalog: () => Promise<ModelCatalog>
  /**
   * Select one route for the owning session (also becomes the deployment
   * default, matching the built-in model seat).
   * @param route - provider/provider-owned model and optional reasoning effort.
   */
  readonly selectModel: (
    route: { readonly provider: string; readonly model: string; readonly reasoningEffort?: string },
  ) => Promise<void>
}