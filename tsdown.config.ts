/**
 * Browser bundle for the model-scheduler client face.
 *
 * Produces the `window.__ModuleLoader__.load({ id, factory })` artifact the
 * harness client-module registry serves. Values that the harness module table
 * supplies (React, Cordis, client primitives, …) are externalized; everything
 * else is inlined into the single factory. No CSS pipeline: styles live in
 * `src/client/styles.ts` as an injected stylesheet.
 */
import { defineConfig } from 'tsdown'

/** Specifiers resolved by the harness module table at runtime, never bundled. */
const moduleTableExternals = new Set([
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-ui-settings',
  '@deepseek-ai/dsh-client-ui-conversation',
  '@deepseek-ai/dsh-client-ui-renderer',
  '@deepseek-ai/dsh-api-remotes/client',
  '@deepseek-ai/dsh-api-session-controller',
])

export default defineConfig({
  entry: { client: 'src/client/index.tsx' },
  outDir: 'lib',
  format: ['cjs'],
  platform: 'browser',
  target: 'es2024',
  dts: false,
  sourcemap: false,
  clean: false,
  deps: {
    neverBundle: (id: string) => moduleTableExternals.has(id),
    alwaysBundle: (id: string) => !moduleTableExternals.has(id),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: 'window.__ModuleLoader__.load({ id: "dsh-model-scheduler", factory: (require) => {',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    outro: '',
    footer: 'return module.exports; } });',
  },
})