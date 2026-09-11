/**
 * Host plugin behavior test: apply() against a real Cordis context with
 * in-memory settings and fake agent/llm services. Covers startup baseline,
 * user-edit force application, session-level switching, subagent exclusion,
 * inert states (disabled / unconfigured), and validation failures.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { Context } from '@deepseek-ai/cordis'
import { SettingsProvider } from '@deepseek-ai/dsh-settings'
import { apply } from '../index.js'

/**
 * Pin the wall clock: the host evaluates `periodAt(new Date(), cfg)`, so a run
 * outside Beijing peak hours would otherwise apply the off-peak route and fail
 * assertions about the peak one. The suite reads `clockNow` on every `new
 * Date()`; individual tests may move it.
 */
let clockNow = Date.parse('2026-09-14T02:00:00.000Z') // Monday 10:00 Asia/Shanghai (peak)
const RealDate = Date
class FrozenDate extends RealDate {
  constructor(...args) {
    if (args.length === 0) super(clockNow)
    else super(...args)
  }

  static now() {
    return clockNow
  }
}
globalThis.Date = FrozenDate

/** In-memory settings provider implementing the provider primitives. */
class MemorySettings extends SettingsProvider {
  doc
  constructor(ctx, options = {}) {
    super(ctx)
    this.doc = structuredClone(options.doc ?? {})
  }

  get writable() {
    return true
  }

  load() {
    return Promise.resolve(structuredClone(this.doc))
  }

  persist(namespace, section) {
    this.doc[namespace] = structuredClone(section)
    return Promise.resolve()
  }
}

/** Fake session: header origin plus an append recorder. */
function fakeSession(origin, events) {
  return {
    header: { ...(origin === undefined ? {} : { origin }) },
    append(type, data) {
      events.push({ type, data })
    },
  }
}

/** Boot a full context: memory settings + fake domain services + the plugin. */
async function boot({ llmResolve } = {}) {
  const ctx = new Context()
  await ctx.plugin(MemorySettings, {})
  const settings = ctx.get('settings')

  const savedDefaults = []
  const llmRuns = []
  const events = []
  // Agent entries carry their session; only non-subagent sessions are switched.
  const sessions = [
    { session: fakeSession(undefined, events) },
    { session: fakeSession('subagent', events) },
  ]

  ctx.provide('agentDefaultModel', {
    currentSelection: () => ({ provider: '', model: '' }),
    saveSelection: (selection) => {
      savedDefaults.push(selection)
      return Promise.resolve()
    },
  })
  ctx.provide('agents', {
    list: () => sessions,
  })
  ctx.provide('llm', {
    resolveCallConfig: (call) => {
      llmRuns.push(call)
      if (llmResolve === 'reject') return Promise.reject(new Error('no such route'))
      return Promise.resolve({ ...call })
    },
  })

  await ctx.plugin({ name: 'dsh-model-scheduler', apply }, undefined)
  // Let registration-time onChange and effect hooks settle.
  await new Promise((resolve) => setTimeout(resolve, 5))

  return { ctx, settings, savedDefaults, llmRuns, events, sessions }
}

/** Panel-shaped edit: writes routes + enables the switch. */
function routesEdit(peak = true) {
  return {
    enabled: true,
    peakModel: peak ? { provider: 'peak-gw', model: 'peak-large' } : { provider: '', model: '' },
    offPeakModel: { provider: 'calm-gw', model: 'calm-medium' },
  }
}

test('startup records a baseline and never applies anything', async () => {
  const { savedDefaults, llmRuns, events } = await boot()
  assert.equal(savedDefaults.length, 0)
  assert.equal(llmRuns.length, 0)
  assert.equal(events.length, 0)
})

test('settings edit forces application: default + non-subagent sessions only', async () => {
  const { settings, savedDefaults, llmRuns, events } = await boot()
  await settings.update('model-scheduler', routesEdit())
  await new Promise((resolve) => setTimeout(resolve, 10))

  assert.equal(savedDefaults.length, 1)
  assert.equal(llmRuns.length, 1)
  const routeEvents = events.filter((event) => event.type === 'model/selection')
  assert.equal(routeEvents.length, 1) // the subagent session was excluded
  assert.deepEqual(routeEvents[0].data, { provider: 'peak-gw', model: 'peak-large' })
})

test('unavailable route is skipped: no default, no session events', async () => {
  const { settings, savedDefaults, llmRuns, events } = await boot({ llmResolve: 'reject' })
  await settings.update('model-scheduler', routesEdit())
  await new Promise((resolve) => setTimeout(resolve, 10))

  assert.equal(savedDefaults.length, 0)
  assert.equal(llmRuns.length, 1)
  assert.equal(events.length, 0)
})

test('disabled config stays inert even after edits', async () => {
  const { settings, savedDefaults, llmRuns, events } = await boot()
  await settings.update('model-scheduler', { ...routesEdit(), enabled: false })
  await new Promise((resolve) => setTimeout(resolve, 10))

  assert.equal(savedDefaults.length, 0)
  assert.equal(llmRuns.length, 0)
  assert.equal(events.length, 0)
})

test('enabled but unconfigured stays inert; completing routes then applies', async () => {
  const { settings, savedDefaults, llmRuns } = await boot()
  await settings.update('model-scheduler', { enabled: true })
  await new Promise((resolve) => setTimeout(resolve, 10))
  assert.equal(savedDefaults.length, 0)
  assert.equal(llmRuns.length, 0)

  await settings.update('model-scheduler', routesEdit())
  await new Promise((resolve) => setTimeout(resolve, 10))
  assert.equal(savedDefaults.length, 1)
  assert.equal(llmRuns.length, 1)
})

test('an off-peak instant applies the off-peak route instead', async () => {
  const previous = clockNow
  clockNow = Date.parse('2026-09-14T20:00:00.000Z') // Tuesday 04:00 Asia/Shanghai
  try {
    const { settings, savedDefaults, events } = await boot()
    await settings.update('model-scheduler', routesEdit())
    await new Promise((resolve) => setTimeout(resolve, 10))

    assert.equal(savedDefaults.length, 1)
    assert.deepEqual(savedDefaults[0], { provider: 'calm-gw', model: 'calm-medium' })
    const routeEvents = events.filter((event) => event.type === 'model/selection')
    assert.equal(routeEvents.length, 1)
    assert.deepEqual(routeEvents[0].data, { provider: 'calm-gw', model: 'calm-medium' })
  } finally {
    clockNow = previous
  }
})
