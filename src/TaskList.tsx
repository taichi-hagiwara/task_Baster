import type { CSSProperties } from 'react'
import type { Task } from './types'
import type { TaskFilter } from './taskLogic'
import { warningLevel } from './taskLogic'

type Props = {
  tasks: Task[]
  filter: TaskFilter
  onFilter: (filter: TaskFilter) => void
  onUpdate: (id: number, changes: Partial<Task>) => void
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
}

function dateText(date: Date | null) {
  if (!date) return '—'
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function timeText(minutes: number | null) {
  if (minutes === null) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${String(m).padStart(2, '0')}m`
}

function TaskCard({ task: t, onUpdate, onEdit, onDelete }: Pick<Props, 'onUpdate' | 'onEdit' | 'onDelete'> & { task: Task }) {
  const level = warningLevel(t)
  const chars = Array.from(t.title)
  const count = chars.filter(ch => ch !== '\n').length
  let pos = 0

  const title = chars.map((ch, i) => {
    if (ch === '\n') return <br key={i} />

    const ink = Math.max(0, Math.min(100, ((1 - t.progress / 100) * count - pos++) * 100))
    const style = { '--ink': `${ink}%` } as CSSProperties
    return <span className="task-glyph" style={style} key={i}>{ch === ' ' ? '\u00a0' : ch}</span>
  })

  function setProgress(progress: number) {
    onUpdate(t.id, { progress, completed: progress === 100 })
  }

  function toggleDone() {
    onUpdate(t.id, { completed: !t.completed, progress: t.completed ? 0 : 100 })
  }

  return (
    <li className={`task-row signal-${level}`}>
      <div className="task-primary">
        <h3 className="task-title">{title}</h3>
        <label className="task-progress">
          <span className="sr-only">{t.title}の進捗</span>
          <input type="range" min="0" max="100" value={t.progress} onChange={e => setProgress(Number(e.target.value))} />
          <span>{t.progress}%</span>
        </label>
      </div>

      <div className="task-details">
        <div className="task-meta">
          <p>DEADLINE: {dateText(t.deadline)}</p>
          <p>Required Time: {timeText(t.estimatedMinutes)}</p>
        </div>

        <div className="task-actions">
          <button type="button" className="star-button" aria-label={t.starred ? 'スターを外す' : 'スターを付ける'} aria-pressed={t.starred} onClick={() => onUpdate(t.id, { starred: !t.starred })}>
            {t.starred ? '★' : '☆'}
          </button>
          <button type="button" onClick={toggleDone}>{t.completed ? '未完了に戻す' : '完了'}</button>
          <button type="button" onClick={() => onEdit(t)}>編集</button>
          <button type="button" onClick={() => onDelete(t.id)}>削除</button>
        </div>
      </div>

      {t.description && <p className="task-description">{t.description}</p>}
    </li>
  )
}

export function TaskList({ tasks, filter, onFilter, onUpdate, onEdit, onDelete }: Props) {
  return (
    <section className="task-list" aria-label="タスク一覧">
      <div className="list-controls">
        <label>
          <span className="sr-only">表示</span>
          <select value={filter} onChange={e => onFilter(e.target.value as TaskFilter)}>
            <option value="active">未完了</option>
            <option value="completed">完了済み</option>
            <option value="starred">スター</option>
            <option value="all">すべて</option>
          </select>
        </label>
      </div>

      {tasks.length === 0 && <p className="empty-state">タスクはありません。</p>}
      {tasks.length > 0 && <ul>
        {tasks.map(t => <TaskCard key={t.id} task={t} onUpdate={onUpdate} onEdit={onEdit} onDelete={onDelete} />)}
      </ul>}
    </section>
  )
}
