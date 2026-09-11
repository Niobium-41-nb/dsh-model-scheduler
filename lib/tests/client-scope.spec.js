/**
 * Client-half wiring test: the browser bundle must consume a settings scope
 * through bound callbacks.
 *
 * Why it exists (measured failure, 2026-09-11): `SettingsScope` declares
 * `getSnapshot()` / `subscribe()` as methods and implements them as class
 * prototype methods, so passing the bare references to `useSyncExternalStore`
 * calls them with `this === undefined`. The entry's per-slot error boundary
 * catches the `TypeError`, logs one line, and renders an empty
 * `[data-slot-error]` node — the trigger simply never appears, while the boot
 * graph, the bundle bytes, and every host test stay green. Only a rendered
 * page caught it.
 *
 * This test renders the registered component against a prototype-backed scope
 * using a tiny React stub, so the same mistake fails here in milliseconds.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const bundle = readFileSync(join(here, '..', 'client.js'), 'utf8')

/** One recorded `useSyncExternalStore` call. */
let lastStoreCall = null

/** Minimal React stub: hooks are called synchronously, no renderer needed. */
const reactStub = {
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
  useRef: (initial) => ({ current: initial ?? null }),
  useEffect: () => {},
  useCallback: (callback) => callback,
  useSyncExternalStore: (subscribe, getSnapshot) => {
    lastStoreCall = { subscribe, getSnapshot }
    return getSnapshot()
  },
}

const jsxRuntimeStub = {
  Fragment: Symbol('Fragment'),
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
}

/** Load the built bundle under stubs and hand back its factory exports. */
function loadBundle() {
  let entry = null
  const documentStub = {
    querySelector: () => null,
    createElement: () => ({ dataset: {}, style: {}, appendChild() {} }),
    head: { appendChild() {} },
  }
  const requireStub = (specifier) => {
    switch (specifier) {
      case 'react': return reactStub
      case 'react/jsx-runtime': return jsxRuntimeStub
      case 'react-dom': return { createPortal: (node) => node }
      case '@deepseek-ai/dsh-client-ui-primitives':
        return {
          IconChevronDownOutline14: () => null,
          useAnchoredPosition: () => undefined,
          useDismissOnOutsidePointer: () => {},
        }
      default: throw new Error(`unexpected external require: ${specifier}`)
    }
  }
  new Function(
    'window', 'document', 'require',
    `${bundle}\nreturn window.__ModuleLoader__;`,
  )({ __ModuleLoader__: { load: (candidate) => { entry = candidate } } }, documentStub, requireStub)
  return entry.factory(requireStub)
}

/** Mount the bundle against a stub client ctx and return the registered component. */
function mountRegisteredComponent(scope) {
  const exports = loadBundle()
  let component = null
  const ctx = {
    effect: (callback) => { callback() },
    locale: { register: () => () => {} },
    settingsScope: { bind: () => scope },
    slots: {
      inject: (_key, callback) => { callback() },
      register: (_options, Comp) => { component = Comp },
    },
    remote: {
      session: {
        modelCatalog: () => Promise.resolve({ ok: false, error: { code: 'x', message: 'x' } }),
        selectModel: () => Promise.resolve({ ok: false, error: { code: 'x', message: 'x' } }),
      },
    },
  }
  exports.apply(ctx)
  assert.notEqual(component, null, 'the bundle must register a composer entry')
  return component
}

/**
 * A scope shaped like the real one: `getSnapshot` / `subscribe` live on the
 * prototype, so detaching them from the instance throws — exactly what the
 * harness's SettingsScopeController does.
 */
class PrototypeScope {
  constructor(snapshot) {
    this.store = { read: () => snapshot }
  }

  getSnapshot() {
    return this.store.read()
  }

  subscribe() {
    return () => {}
  }

  set() {
    return Promise.resolve()
  }
}

test('the trigger reads its settings scope through bound callbacks', () => {
  const snapshot = { status: 'ready', value: { enabled: true }, revision: 1 }
  const scope = new PrototypeScope(snapshot)
  const Trigger = mountRegisteredComponent(scope)

  let rendered
  assert.doesNotThrow(() => {
    rendered = Trigger({
      t: (key) => key,
      sessionId: 'session-1',
      scope,
      loadCatalog: () => Promise.resolve({ groups: [] }),
      selectModel: () => Promise.resolve(),
    })
  }, 'rendering the trigger must not lose the scope receiver')

  assert.equal(lastStoreCall.getSnapshot(), snapshot, 'the rendered snapshot comes from the scope')
  assert.doesNotThrow(() => { lastStoreCall.subscribe(() => {}) }, 'subscribing must not lose the scope receiver')
  assert.notEqual(rendered, undefined, 'the trigger renders a tree')
})
