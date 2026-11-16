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
      <h1>タスク管理</h1>
      <div className="header-actions">
        <div className="sort-control">
          <button type="button" aria-expanded={open} aria-controls="sort-menu" onClick={() => setOpen(!open)}>ソート</button>
          {open && <div id="sort-menu" className="sort-menu" role="group" aria-label="並び順">
            {options.map(([key, label]) => (
              <button key={key} type="button" aria-pressed={sort === key} onClick={() => choose(key)}>{label}</button>
            ))}
          </div>}
        </div>
        <button type="button" onClick={onAdd}>＋ タスク追加</button>
      </div>
    </header>
  )
}
