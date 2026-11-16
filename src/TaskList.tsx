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
  if (!date) return 'なし'
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function TaskCard({ task: t, onUpdate, onEdit, onDelete }: Pick<Props, 'onUpdate' | 'onEdit' | 'onDelete'> & { task: Task }) {
  const level = warningLevel(t)
  const signal = { none: '', blue: '青', yellow: '黄', red: '赤' }[level]

  function setProgress(progress: number) {
    onUpdate(t.id, { progress, completed: progress === 100 })
  }

  function toggleDone() {
    onUpdate(t.id, { completed: !t.completed, progress: t.completed ? 0 : 100 })
  }

  return (
    <li>
      <div className="task-heading">
        <h3>{t.title}</h3>
        <button type="button" aria-label={t.starred ? 'スターを外す' : 'スターを付ける'} aria-pressed={t.starred} onClick={() => onUpdate(t.id, { starred: !t.starred })}>
          {t.starred ? '★' : '☆'}
        </button>
      </div>

      {t.description && <p>{t.description}</p>}
      <p>期限: {dateText(t.deadline)} / 所要時間: {t.estimatedMinutes === null ? '未設定' : `${t.estimatedMinutes}分`}</p>
      {signal && <p className={`warning warning-${level}`}>警告: {signal}</p>}

      <label>進捗: {t.progress}%
        <input type="range" min="0" max="100" value={t.progress} onChange={e => setProgress(Number(e.target.value))} />
      </label>

      <div className="actions">
        <button type="button" onClick={toggleDone}>{t.completed ? '未完了に戻す' : '完了'}</button>
        <button type="button" onClick={() => onEdit(t)}>編集</button>
        <button type="button" onClick={() => onDelete(t.id)}>削除</button>
      </div>
    </li>
  )
}

export function TaskList({ tasks, filter, onFilter, onUpdate, onEdit, onDelete }: Props) {
  return (
    <section aria-label="タスク一覧">
      <div className="toolbar">
        <h2>タスク一覧</h2>
        <label>表示
          <select value={filter} onChange={e => onFilter(e.target.value as TaskFilter)}>
            <option value="active">未完了</option>
            <option value="completed">完了済み</option>
            <option value="starred">スター</option>
            <option value="all">すべて</option>
          </select>
        </label>
      </div>

      {tasks.length === 0 && <p>タスクはありません。</p>}
      {tasks.length > 0 && <ul>
        {tasks.map(t => <TaskCard key={t.id} task={t} onUpdate={onUpdate} onEdit={onEdit} onDelete={onDelete} />)}
      </ul>}
    </section>
  )
}
