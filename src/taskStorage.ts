import type { Task } from "./types";

const KEY = "tasks";

function parseTask(raw: unknown): Task | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;

  if (typeof t.id !== "number" || !Number.isSafeInteger(t.id)) return null;
  if (typeof t.title !== "string" || typeof t.description !== "string")
    return null;
  if (typeof t.progress !== "number" || !Number.isFinite(t.progress))
    return null;

  const date = typeof t.deadline === "string" ? new Date(t.deadline) : null;
  const deadline = date && !Number.isNaN(date.getTime()) ? date : null;
  const estimatedMinutes =
    typeof t.estimatedMinutes === "number" &&
    Number.isFinite(t.estimatedMinutes) &&
    t.estimatedMinutes >= 0
      ? t.estimatedMinutes
      : null;

  return {
    id: t.id,
    title: t.title,
    description: t.description,
    progress: Math.min(100, Math.max(0, t.progress)),
    deadline,
    estimatedMinutes,
    starred: t.starred === true,
    completed:
      t.completed === true || (t.completed === undefined && t.progress >= 100),
  };
}

export function loadTasks(): Task[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];

    const tasks: Task[] = [];
    for (const item of raw) {
      const task = parseTask(item);
      if (task) tasks.push(task);
    }
    return tasks;
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(tasks));
  } catch {
    // Storage may be disabled or full. Tasks remain usable until the page is closed.
  }
}
