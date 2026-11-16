import { useState } from 'react'
import type { SortKey } from './taskLogic'

type Props = {
  sort: SortKey
  onSort: (sort: SortKey) => void
  onAdd: () => void
}

const options: [SortKey, string][] = [
  ['deadline', '期限順'],
  ['progress', '進捗順'],
  ['duration', '所要時間順'],
  ['title', 'あいうえお順'],
]

export function AppHeader({ sort, onSort, onAdd }: Props) {
  const [open, setOpen] = useState(false)

  function choose(key: SortKey) {
    onSort(key)
    setOpen(false)
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-main">
          <h1 className="wordmark">TASKBASTER</h1>
          <button className="add-button" type="button" aria-label="タスク追加" onClick={onAdd}>
            <span className="add-cross" aria-hidden="true" />
          </button>
        </div>

        <div className="sort-control">
          <button className="sort-button" type="button" aria-expanded={open} aria-controls="sort-menu" onClick={() => setOpen(!open)}>
            Sort
          </button>
          {open && <div id="sort-menu" className="sort-menu" role="group" aria-label="並び順">
            {options.map(([key, label]) => (
              <button key={key} type="button" aria-pressed={sort === key} onClick={() => choose(key)}>{label}</button>
            ))}
          </div>}
        </div>
      </div>
    </header>
  )
}
