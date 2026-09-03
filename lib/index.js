/**
 * dsh-model-scheduler node half (host plugin).
 *
 * Owns the automatic peak/off-peak model switching for a DeepSeek Harness
 * deployment. Configuration lives in the `model-scheduler` settings namespace
 * (schema below); the same namespace is what the browser panel edits, so a
 * change written from the Web GUI takes effect immediately.
 *
 * Behavior:
 * - A timer re-evaluates the current period every 30 seconds; when the period
 *   crosses a boundary (or the first configuration is completed), it applies
 *   the period's model: the deployment default (`agentDefaultModel`) for new
 *   sessions and the session-level `model/selection` event for every attached
 *   non-subagent session, so each session's next request uses the period model.
 * - A change to the `model-scheduler` namespace re-evaluates immediately
 *   (force), so saving the peak/off-peak models or enabling the switch applies
 *   right away instead of waiting for the next tick.
 * - Models are validated through `ctx.llm.resolveCallConfig` before being
 *   applied; an unavailable route is logged and skipped.
 * - Startup never overrides anything: the current period is recorded as a
 *   baseline and only later crossings switch.
 */

import Schema from '@deepseek-ai/schemastery'
import { periodAt } from './period.js'

export const name = 'dsh-model-scheduler'

export const inject = ['settings']

/** One peak/off-peak model route (provider-owned ids). */
const modelRoute = Schema.object({
  provider: Schema.string(),
  model: Schema.string(),
  reasoningEffort: Schema.string(),
}).default({})

/** Plugin configuration (cordis.yml `config`), also the settings base layer. */
export const Config = Schema.object({
  /** Whether automatic switching is active. */
  enabled: Schema.boolean().default(true),
  /** IANA time zone both host and browser evaluate the schedule in. */
  timeZone: Schema.string().default('Asia/Shanghai'),
  /** Days of week counted as peak-capable: 0=Sunday … 6=Saturday. */
  peakDays: Schema.array(Schema.number()).default([1, 2, 3, 4, 5]),
  /** Time-of-day windows that are peak; `end` before `start` crosses midnight. */
  peakWindows: Schema.array(Schema.object({
    start: Schema.string().default('09:00'),
    end: Schema.string().default('12:00'),
  })).default([
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '18:00' },
  ]),
  /** Model used during peak windows. */
  peakModel: modelRoute,
  /** Model used outside peak windows. */
  offPeakModel: modelRoute,
}).default({
  enabled: true,
  timeZone: 'Asia/Shanghai',
  peakDays: [1, 2, 3, 4, 5],
  peakWindows: [
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '18:00' },
  ],
  peakModel: {},
  offPeakModel: {},
})

const NAMESPACE = 'model-scheduler'
const CHECK_INTERVAL_MS = 30_000

/**
 * Mount the scheduler.
 * @param ctx - the hosting Cordis context.
 * @param config - composition `config` (fallback when no settings provider holds a user section).
 */
export function apply(ctx, config) {
  /** Last period whose model was applied; null while inert or disabled. */
  let baseline = null

  /** Fallback to the plugin `config` when the settings provider is absent. */
  const effectiveConfig = () => {
    const settings = ctx.get('settings')
    if (settings === undefined) return config
    const stored = settings.get(NAMESPACE)
    return stored === undefined ? config : stored
  }

  /**
   * Apply the period model when the period changed (or on force).
   * @param {boolean} force - apply regardless of the baseline (user edits).
   * @returns whether a switch was applied.
   */
  const applyPeriod = async (force) => {
    const cfg = effectiveConfig()
    if (cfg.enabled !== true) {
      baseline = null
      return false
    }
    if (cfg.peakModel?.provider === undefined
      || cfg.peakModel?.provider === ''
      || cfg.peakModel?.model === undefined
      || cfg.peakModel?.model === ''
      || cfg.offPeakModel?.provider === undefined
      || cfg.offPeakModel?.provider === ''
      || cfg.offPeakModel?.model === undefined
      || cfg.offPeakModel?.model === '') {
      return false // models not configured yet; stay inert
    }
    let period
    try {
      period = periodAt(new Date(), cfg)
    } catch (error) {
      ctx.logger.warn(`model-scheduler: period evaluation failed: ${String(error)}`)
      return false
    }
    if (!force && period === baseline) return false
    const target = period === 'peak' ? cfg.peakModel : cfg.offPeakModel
    const llm = ctx.get('llm')
    if (llm === undefined) {
      ctx.logger.warn('model-scheduler: no llm service mounted; cannot validate routes')
      return false
    }
    let resolved
    try {
      resolved = await llm.resolveCallConfig({
        provider: target.provider,
        model: target.model,
        ...(target.reasoningEffort === undefined || target.reasoningEffort === ''
          ? {}
          : { reasoningEffort: target.reasoningEffort }),
      })
    } catch (error) {
      ctx.logger.warn(
        `model-scheduler: configured ${period} model is unavailable (${target.provider}/${target.model}): ${String(error)}`,
      )
      return false
    }
    const selection = {
      provider: resolved.provider,
      model: resolved.model,
      ...(resolved.reasoningEffort === undefined
        ? {}
        : { reasoningEffort: resolved.reasoningEffort }),
    }
    const defaults = ctx.get('agentDefaultModel')
    if (defaults !== undefined) {
      try {
        await defaults.saveSelection(selection)
      } catch (error) {
        ctx.logger.warn(`model-scheduler: default model save failed: ${String(error)}`)
      }
    }
    const agents = ctx.get('agents')
    if (agents !== undefined) {
      for (const agent of agents.list()) {
        if (agent.session.header.origin === 'subagent') continue
        agent.session.append('model/selection', selection)
      }
    }
    baseline = period
    ctx.logger.info(
      `model-scheduler: switched to ${period === 'peak' ? 'peak' : 'off-peak'} model ${selection.provider}/${selection.model}`,
    )
    return true
  }

  /** Record the current period WITHOUT applying it (startup baseline). */
  const recordBaseline = () => {
    const cfg = effectiveConfig()
    if (cfg.enabled !== true) {
      baseline = null
      return
    }
    try {
      baseline = periodAt(new Date(), cfg)
    } catch {
      baseline = null
    }
  }

  let settled = false
  const settings = ctx.get('settings')
  if (settings !== undefined) {
    ctx.effect(() => settings.installSection(ctx, NAMESPACE, Config, config, {
      setSource: () => {},
      // Registration itself calls onChange once before `settled` flips, which
      // must NOT apply: startup never overrides existing selections.
      onChange: () => {
        if (!settled) return
        void applyPeriod(true)
      },
    }), 'model-scheduler: settings section')
  }
  recordBaseline()
  settled = true

  ctx.effect(() => {
    const timer = setInterval(() => { void applyPeriod(false) }, CHECK_INTERVAL_MS)
    return () => { clearInterval(timer) }
  }, 'model-scheduler: period timer')
}