import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Task } from './types'

export type TaskValues = Pick<Task, 'title' | 'deadline' | 'description' | 'progress' | 'estimatedMinutes'>

const empty = { title: '', deadline: '', description: '', progress: 0, estimatedMinutes: '' }

function dateText(date: Date | null) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

type Props = {
  task: Task | null
  onSave: (values: TaskValues) => void
  onClose: () => void
}

export function TaskSheet({ task, onSave, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState(() => task ? {
    title: task.title,
    deadline: dateText(task.deadline),
    description: task.description,
    progress: task.progress,
    estimatedMinutes: task.estimatedMinutes?.toString() ?? '',
  } : empty)

  useEffect(() => {
    const el = ref.current
    if (el && !el.open) el.showModal()
  }, [])

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const title = form.title.trim()
    if (!title) return

    onSave({
      title,
      deadline: form.deadline ? new Date(`${form.deadline}T00:00:00`) : null,
      description: form.description.trim(),
      progress: Math.min(100, Math.max(0, form.progress)),
      estimatedMinutes: form.estimatedMinutes === '' ? null : Math.max(0, Number(form.estimatedMinutes) || 0),
    })
  }

  return (
    <dialog ref={ref} className="task-sheet" aria-label={task ? 'タスクを編集' : 'タスクを追加'} onClose={onClose}>
      <form onSubmit={submit}>
        <h2>{task ? 'タスクを編集' : 'タスクを追加'}</h2>

        <label>タイトル
          <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </label>

        <label>期限
          <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
        </label>

        <label>所要時間（分）
          <input type="number" min="0" value={form.estimatedMinutes} onChange={e => setForm({ ...form, estimatedMinutes: e.target.value })} />
        </label>

        <label>説明
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </label>

        <div className="progress-input">
          <label htmlFor="form-progress">進捗</label>
          <input id="form-progress" type="range" min="0" max="100" value={form.progress} onChange={e => setForm({ ...form, progress: Number(e.target.value) })} />
          <label className="progress-number">％
            <input type="number" min="0" max="100" value={form.progress} onChange={e => setForm({ ...form, progress: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} />
          </label>
        </div>

        <div className="actions">
          <button type="submit">{task ? '保存' : '追加'}</button>
          <button type="button" onClick={onClose}>キャンセル</button>
        </div>
      </form>
    </dialog>
  )
}
