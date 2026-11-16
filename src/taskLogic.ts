import type { Task } from './types'

export type SortKey = 'deadline' | 'progress' | 'duration' | 'title'
export type TaskFilter = 'active' | 'completed' | 'all' | 'starred'
export type WarningLevel = 'none' | 'blue' | 'yellow' | 'red'

export function visibleTasks(tasks: Task[], filter: TaskFilter, sort: SortKey): Task[] {
  const filtered = tasks.filter((task) => {
    if (filter === 'active') return !task.completed
    if (filter === 'completed') return task.completed
    if (filter === 'starred') return task.starred
    return true
  })
  return [...filtered].sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title, 'ja') || a.id - b.id
    if (sort === 'progress') return a.progress - b.progress || a.id - b.id
    if (sort === 'duration') return (a.estimatedMinutes ?? Infinity) - (b.estimatedMinutes ?? Infinity) || a.id - b.id
    return (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity) || a.id - b.id
  })
}

export function warningLevel(task: Task, now = new Date()): WarningLevel {
  if (task.completed || !task.deadline) return 'none'
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const due = Date.UTC(task.deadline.getFullYear(), task.deadline.getMonth(), task.deadline.getDate())
  const daysLeft = Math.round((due - today) / 86_400_000)
  if (daysLeft < 0) return 'red'
  const remainingMinutes = task.estimatedMinutes === null ? null : task.estimatedMinutes * (1 - task.progress / 100)
  const minutesPerDay = remainingMinutes === null ? 0 : remainingMinutes / (daysLeft + 1)
  if (daysLeft === 0 || minutesPerDay > 120) return 'red'
  if (daysLeft <= 2 || minutesPerDay > 60) return 'yellow'
  return 'blue'
}
