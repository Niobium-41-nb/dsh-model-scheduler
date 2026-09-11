/**
 * Searchable model list: filters the shared catalog by query and renders one
 * model row per match, grouped by provider. Rows expose the caller's action
 * buttons (use-now / assign-to-period).
 */

import { useMemo, type ReactNode } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { CatalogRow, ModelRowAction } from './contract.ts'
import { NS } from './locales.ts'

/** Filter the catalog by a lowercase includes match over name, id, and group name. */
export function filterCatalog(
  groups: readonly CatalogRow['group'][],
  query: string,
): readonly CatalogRow[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return groups.flatMap(group => group.models.map(model => ({ group, model })))
  const rows: CatalogRow[] = []
  for (const group of groups) {
    for (const model of group.models) {
      if (model.name.toLowerCase().includes(needle)
        || model.id.toLowerCase().includes(needle)
        || group.name.toLowerCase().includes(needle)) {
        rows.push({ group, model })
      }
    }
  }
  return rows
}

/** Props for the searchable model list. */
export interface ModelSearchListProps {
  readonly groups: readonly CatalogRow['group'][]
  readonly query: string
  readonly current: { readonly provider: string; readonly model: string } | null
  readonly actions: readonly ModelRowAction[]
  readonly t: TranslateNS<typeof NS>
}

/** Render filtered model rows grouped by provider. */
export function ModelSearchList({ groups, query, current, actions, t }: ModelSearchListProps) {
  const rows = useMemo(() => filterCatalog(groups, query), [groups, query])
  if (rows.length === 0) {
    return <div className="msd-empty">{t('search.empty')}</div>
  }
  const rendered: ReactNode[] = []
  let lastGroup: string | null = null
  for (const row of rows) {
    if (row.group.id !== lastGroup) {
      lastGroup = row.group.id
      rendered.push(<div key={`g:${row.group.id}`} className="msd-groupTitle">{row.group.name}</div>)
    }
    const active = current !== null
      && current.provider === row.group.id
      && current.model === row.model.id
    rendered.push(
      <div key={`${row.group.id}/${row.model.id}`} className="msd-model" role="option" aria-selected={active}>
        <div className="msd-modelHead">
          <span className="msd-modelName" title={row.model.name}>{row.model.name}</span>
          {active ? <span className="msd-modelTag">{t('search.current')}</span> : null}
        </div>
        <div className="msd-modelFoot">
          {row.model.description !== undefined
            ? <span className="msd-modelDesc" title={row.model.description}>{row.model.description}</span>
            : null}
          <div className="msd-modelActions">
            {actions.map(action => (
              <button
                key={action.key}
                type="button"
                className={action.primary === true ? 'msd-primary' : 'msd-pick'}
                onClick={() => { action.onPick(row) }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>,
    )
  }
  return <div className="msd-list" role="listbox">{rendered}</div>
}