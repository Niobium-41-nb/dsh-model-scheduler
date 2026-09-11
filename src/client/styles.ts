/**
 * Static stylesheet for the model-scheduler browser face.
 * Uses the Web client's design tokens (`--dsw-*`), injected once by apply.
 */

export const cssText = `
.msd-root{position:relative;display:inline-flex}
.msd-trigger{min-height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-radius:6px;align-items:center;gap:4px;padding:3px 2px;font-size:12px;line-height:18px;display:inline-flex}
.msd-trigger:hover,.msd-trigger:focus-visible{color:var(--dsw-alias-label-secondary)}
.msd-trigger svg{flex:none}
.msd-badge{width:8px;height:8px;border-radius:50%;flex:none}
.msd-badge-peak{background:var(--dsw-alias-state-warn-primary)}
.msd-badge-offpeak{background:var(--dsw-alias-label-tertiary)}
.msd-panel{z-index:100;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-specific-menu);width:340px;max-width:min(340px,100vw - 32px);max-height:min(560px,100vh - 140px);box-shadow:var(--dsw-shadow-lv3);border-radius:12px;flex-direction:column;overflow:auto;position:fixed;display:flex}
.msd-panelHead{box-sizing:border-box;width:100%;flex:none;align-items:center;gap:8px;padding:10px 12px 6px;display:flex}
.msd-panelTitle{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:20px;flex:1;min-width:0}
.msd-close{cursor:pointer;color:var(--dsw-alias-label-tertiary);background:0 0;border:0;border-radius:6px;padding:2px;display:inline-flex}
.msd-close:hover{color:var(--dsw-alias-label-secondary)}
.msd-status{box-sizing:border-box;width:100%;flex:none;gap:5px;margin:4px 12px 2px;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-surface-tertiary);display:flex;flex-direction:column}
.msd-statusRow{color:var(--dsw-alias-label-secondary);align-items:center;gap:6px;font-size:12px;line-height:18px;display:flex;flex-wrap:wrap}
.msd-statusDim{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}
.msd-notice{font-size:11px;line-height:16px;border-radius:6px;padding:4px 8px;margin-top:2px}
.msd-notice-saved{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-surface-tertiary)}
.msd-notice-error{color:var(--dsw-alias-state-warn-label);background:var(--dsw-alias-state-warn-tertiary,var(--dsw-alias-surface-tertiary))}
.msd-section{box-sizing:border-box;width:100%;flex:none;gap:6px;padding:8px 12px;display:flex;flex-direction:column}
.msd-sectionTitle{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;font-weight:600;letter-spacing:.02em;text-transform:uppercase}
.msd-row{width:100%;align-items:center;gap:8px;display:flex}
.msd-rowLabel{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;width:86px;flex:none}
.msd-pick{cursor:pointer;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-surface-tertiary);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;flex:1;min-width:0;align-items:center;gap:6px;padding:6px 10px;font-size:12px;line-height:18px;text-align:left;display:flex}
.msd-pick:hover:not(:disabled){border-color:var(--dsw-alias-border-l1)}
.msd-pick:disabled{cursor:default;color:var(--dsw-alias-label-tertiary)}
.msd-pickText{flex:1;min-width:0;flex-direction:column;gap:1px;display:flex}
.msd-pickName{font-size:12px;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.msd-pickEmpty{color:var(--dsw-alias-label-tertiary)}
.msd-pickRoute{color:var(--dsw-alias-label-tertiary);font-size:10px;line-height:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.msd-pickChevron{color:var(--dsw-alias-label-tertiary);flex:none}
.msd-switchRow{align-items:center;gap:8px;padding:2px 0;display:flex}
.msd-switchLabel{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;flex:1}
.msd-windowRow{width:100%;align-items:center;gap:6px;display:flex}
.msd-windowLabel{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;width:52px;flex:none}
.msd-time{box-sizing:border-box;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-surface-tertiary);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:5px 8px;font-size:12px;line-height:18px;font-family:inherit}
.msd-time:focus-visible{border-color:var(--dsw-alias-accent-primary);outline:0}
.msd-days{width:100%;flex-wrap:wrap;gap:6px;display:flex}
.msd-chip{cursor:pointer;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-surface-tertiary);border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:3px 10px;font-size:12px;line-height:18px}
.msd-chip:hover{border-color:var(--dsw-alias-border-l1)}
.msd-chip[aria-pressed=true]{color:var(--dsw-alias-label-on-accent);background:var(--dsw-alias-accent-primary);border-color:var(--dsw-alias-accent-primary)}
.msd-actions{box-sizing:border-box;width:100%;flex:none;gap:6px;padding:8px 12px 10px;display:flex;flex-direction:column}
.msd-primary{cursor:pointer;color:var(--dsw-alias-label-on-accent);background:var(--dsw-alias-accent-primary);border:0;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;line-height:18px;white-space:nowrap}
.msd-primary:hover:not(:disabled){filter:brightness(1.06)}
.msd-primary:disabled{cursor:default;opacity:.55}
.msd-searchRoot{box-sizing:border-box;width:100%;gap:6px;padding:8px 12px;display:flex;flex-direction:column;flex:1;min-height:0}
.msd-searchWrap{width:100%;position:relative;display:flex}
.msd-search{box-sizing:border-box;width:100%;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-surface-tertiary);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:6px 10px;font-size:12px;line-height:18px;font-family:inherit}
.msd-search:focus-visible{border-color:var(--dsw-alias-accent-primary);outline:0}
.msd-list{flex:1;min-height:0;overflow-y:auto;gap:2px;display:flex;flex-direction:column}
.msd-groupTitle{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;font-weight:600;padding:6px 4px 2px}
.msd-model{box-sizing:border-box;width:100%;cursor:pointer;color:var(--dsw-alias-label-primary);background:0 0;border:0;border-radius:8px;padding:7px 10px;text-align:left;flex-direction:column;align-items:stretch;gap:4px;display:flex}
.msd-model:hover{background:var(--dsw-alias-surface-tertiary)}
.msd-modelHead{min-width:0;align-items:center;gap:6px;display:flex}
.msd-modelName{flex:1;min-width:0;font-size:12px;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.msd-modelTag{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:1px 7px;flex:none;white-space:nowrap}
.msd-modelFoot{min-width:0;align-items:center;gap:8px;display:flex}
.msd-modelDesc{flex:1;min-width:0;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.msd-modelActions{flex:none;margin-left:auto;align-items:center;gap:6px;display:flex}
.msd-modelActions .msd-pick{flex:none;white-space:nowrap}
.msd-modelActions .msd-primary{flex:none;white-space:nowrap}
.msd-empty{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;text-align:center;padding:18px 8px}
.msd-hint{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}
.msd-loading{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;text-align:center;padding:18px 8px}
.msd-fail{color:var(--dsw-alias-state-warn-label);font-size:12px;line-height:18px;padding:12px 8px;text-align:center}
`

/** Inject the stylesheet once; removes it on teardown. */
export function installStyles(): () => void {
  const exist = document.querySelector('style[data-plugin-css="dsh-model-scheduler"]')
  if (exist !== null) return () => {}
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-model-scheduler'
  tag.dataset.pluginCss = 'dsh-model-scheduler'
  tag.textContent = cssText
  document.head.appendChild(tag)
  return () => { tag.remove() }
}