# dsh-model-scheduler

[![check](https://github.com/Niobium-41-nb/dsh-model-scheduler/actions/workflows/check.yml/badge.svg)](https://github.com/Niobium-41-nb/dsh-model-scheduler/actions/workflows/check.yml) [![npm](https://img.shields.io/npm/v/dsh-model-scheduler)](https://www.npmjs.com/package/dsh-model-scheduler) [![license](https://img.shields.io/github/license/Niobium-41-nb/dsh-model-scheduler)](https://github.com/Niobium-41-nb/dsh-model-scheduler/blob/master/LICENSE)

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that adds two things to the Web UI:

1. **A searchable model picker.** The composer's model selector becomes searchable by name/ID — useful when your deployment exposes many models.
2. **Peak / off-peak automatic switching.** You assign one model for peak hours and another for off-peak hours; the deployment auto-switches between them at period boundaries, for **every open session (next request)** and **new sessions (the saved default)**.

> 🇨🇳 中文说明见 [README.zh.md](README.zh.md)。

---

## How it works

- The schedule is evaluated in **Asia/Shanghai** time (configurable).
- Default schedule:
  - **Peak (高峰):** Monday–Friday, 09:00–12:00 and 14:00–18:00 Beijing time.
  - **Off-peak (空闲):** everything else — including all of Saturday and Sunday.
- A host timer re-checks the period every **30 seconds**; when the period crosses a boundary, it applies the period's model:
  - `agentDefaultModel` is updated (default for **new sessions**);
  - every attached **non-subagent** session receives a `model/selection` session event, so that session's **next request** uses the period model immediately.
- Editing the schedule in the GUI applies **immediately** (force), not on the next tick.
- Startup never overrides anything: the current period is only recorded as a baseline.
- Models are validated with the deployment's LLM route resolution before being applied; an unavailable route logs a warning and is skipped.

## Install

```sh
dsh plugin --profile web add github:Niobium-41-nb/dsh-model-scheduler
```

Restart `dsh web` (or reload the profile), then refresh the browser page. The built bundle is committed to this repository, so no build step is required on the user side.

## Usage

1. In the composer, a badge next to the model seat shows the **current period** (peak / off-peak). Click it to open the schedule panel.
2. In the panel:
   - **Search and pick models** — search by model name, model ID, or provider name; two actions per row: *Use now* (switch this session, also becomes the new default) and *Set as peak/off-peak model*.
   - **Peak model / Off-peak model** — the two routes used by automatic switching.
   - **Peak windows (time zones shown)** — up to two time-of-day windows; an end at or before the start crosses midnight.
   - **Peak days** — weekday chips (default Mon–Fri; weekend is fully off-peak).
   - **Enable switch** — turns automatic switching on/off.
   - **Switch to the current period model now** — applies the current period's model immediately.
3. Changes are saved to the shared `model-scheduler` settings namespace and take effect right away.

## Configuration

The plugin works with zero configuration (defaults above). Everything is editable from the GUI, and the same namespace is available in `cordis.yml`:

```yaml
- id: dsh-model-scheduler
  config:
    enabled: true
    timeZone: Asia/Shanghai
    peakDays: [1, 2, 3, 4, 5]        # 0=Sunday … 6=Saturday
    peakWindows:
      - { start: "09:00", end: "12:00" }
      - { start: "14:00", end: "18:00" }
    peakModel: { provider: "deepseek-official", model: "deepseek-chat" }
    offPeakModel: { provider: "deepseek-official", model: "deepseek-reasoner" }
```

The `model-scheduler` settings section (what the GUI edits) overrides this composition config.

## Development

```sh
pnpm run host:test     # node --test on lib/tests (period engine + host apply behavior)
pnpm run bundle        # tsdown → lib/client.js (client half)
node scripts/verify-client.mjs  # smoke-check the client bundle contract
```

Layout:

- `lib/index.js` — host plugin (`apply`), settings namespace `model-scheduler`, the 30 s timer, default + session-level switching.
- `lib/period.js` — pure period engine (IANA time zone, weekday windows, midnight-crossing windows). Mirrored by `src/client/period.ts`.
- `src/client/*` — browser half: searchable picker + schedule panel as a `conversation.input.right` slot, locale dictionaries (`model.scheduler`), stylesheet.
- `cordis.patch.yml` — bundle manifest for `dsh plugin add`.

The published artifact is the **committed build output** (`lib/client.js`), so users install via git without `prepare` scripts or `allowBuilds`.

## License

MIT — see [LICENSE](LICENSE).