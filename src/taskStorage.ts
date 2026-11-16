import type { Task } from './types'

const storageKey = 'tasks'

export function loadTasks(): Task[] {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as unknown
    if (!Array.isArray(stored)) return []
    return stored.flatMap((item): Task[] => {
      if (!item || typeof item !== 'object') return []
      const value = item as Record<string, unknown>
      if (typeof value.id !== 'number' || !Number.isSafeInteger(value.id) ||
          typeof value.title !== 'string' || typeof value.description !== 'string' ||
          typeof value.progress !== 'number' || !Number.isFinite(value.progress)) return []
      const deadline = typeof value.deadline === 'string' ? new Date(value.deadline) : null
      return [{
        id: value.id,
        title: value.title,
        description: value.description,
        progress: Math.min(100, Math.max(0, value.progress)),
        deadline: deadline && !Number.isNaN(deadline.getTime()) ? deadline : null,
        estimatedMinutes: typeof value.estimatedMinutes === 'number' && Number.isFinite(value.estimatedMinutes) && value.estimatedMinutes >= 0 ? value.estimatedMinutes : null,
        starred: value.starred === true,
        completed: value.completed === true || (value.completed === undefined && value.progress >= 100),
      }]
    })
  } catch {
    return []
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(tasks))
  } catch {
    // Storage may be disabled or full. Tasks remain usable until the page is closed.
  }
}
