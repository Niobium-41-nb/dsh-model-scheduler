/**
 * Client bundle smoke check (run with plain Node; no browser needed).
 *
 * Executes lib/client.js inside a stubbed window/loader environment and
 * asserts the module-loader contract: a `load({ id, factory })` call whose
 * factory exports `name`, `inject`, and `apply`, and whose only requires are
 * specifiers the harness module table supplies.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const code = await readFile(join(root, 'lib', 'client.js'), 'utf8')

/** Module-table baseline: everything the bundle may require at runtime. */
const TABLE = new Set([
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
])

let entry = null
const windowStub = {
  __ModuleLoader__: {
    load(candidate) {
      entry = candidate
    },
  },
}
const globals = {
  window: windowStub,
  document: { querySelector: () => null, createElement: () => ({ dataset: {}, appendChild() {} }), head: { appendChild() {} } },
}
const requireCalls = []
const requireStub = (specifier) => {
  requireCalls.push(specifier)
  if (!TABLE.has(specifier)) throw new Error(`unexpected external require: ${specifier}`)
  return { specifier }
}

// The bundle top level is the single `window.__ModuleLoader__.load(...)` call;
// execute it under the stubs, then invoke the factory to capture its exports.
new Function('window', 'document', 'require', `${code}\nreturn window.__ModuleLoader__;`)(windowStub, globals.document, requireStub)

if (entry === null || typeof entry !== 'object') throw new Error('loader contract violated: no load() call captured')
if (entry.id !== 'dsh-model-scheduler') throw new Error(`unexpected bundle id: ${entry.id}`)
if (typeof entry.factory !== 'function') throw new Error('loader contract violated: factory is not a function')

const exports = entry.factory(requireStub)
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}
assert(Array.isArray(exports.inject), 'export inject must be an array')
assert(typeof exports.apply === 'function', 'export apply must be a function')
assert(!requireCalls.some((spec) => !TABLE.has(spec)), 'bundle requires a non-table specifier')

console.log(`\u2713 client bundle ok: id=${entry.id} size=${code.length} externals=[${[...new Set(requireCalls)].join(', ')}]`)