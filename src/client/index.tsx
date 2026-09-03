/**
 * Model scheduler browser half: registers the dictionary, the stylesheet, and
 * the `conversation.input.right` trigger whose panel provides the searchable
 * model picker and the peak/off-peak schedule configuration. All writes go
 * through the shared `model-scheduler` settings scope; the host half reacts to
 * every change and applies the current period model.
 */

// Type-only: pulls the Context merges that type `ctx.locale`, `ctx.settingsScope`,
// `ctx.remote`, and the slot map without importing any runtime value cross-package.
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { ModelCatalog } from '@deepseek-ai/dsh-api-remotes/client'
import type { ModelSchedulerInjected } from './contract.ts'
import { en, NS, zh } from './locales.ts'
import { ModelSchedulerButton } from './ModelSchedulerButton.tsx'
import type { ModelSchedulerSettings } from './period.ts'
import { installStyles } from './styles.ts'

/** Required client services. */
export const inject = ['slots', 'locale', 'settingsScope', 'remote', 'remote.session']

/**
 * Mount the model-scheduler UI.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => installStyles(), 'model-scheduler: styles')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'model-scheduler: dictionaries')
  const scope = ctx.settingsScope.bind<ModelSchedulerSettings>({ namespace: 'model-scheduler' })

  ctx.slots.inject(
    'conversation.input.right',
    () => ctx.slots.register({
      name: 'conversation.input.right',
      id: 'model-scheduler',
      // Sits beside the model seat; the seat itself is a separate 'single' slot.
      order: 30,
      locale: NS,
      inject: (sessionId): ModelSchedulerInjected => ({
        sessionId: String(sessionId),
        scope,
        loadCatalog: () => ctx.remote.session.modelCatalog().then((result) => {
          if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`)
          return result.value
        }),
        selectModel: (route) => ctx.remote.session.selectModel({
          sessionId,
          provider: route.provider,
          model: route.model,
          ...(route.reasoningEffort === undefined ? {} : { reasoningEffort: route.reasoningEffort }),
        }).then((result) => {
          if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`)
        }),
      }),
    }, ModelSchedulerButton),
  )
}