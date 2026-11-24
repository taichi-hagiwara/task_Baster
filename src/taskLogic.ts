import type { Task } from "./types";

export type SortKey = "deadline" | "progress" | "duration" | "title";
export type TaskView = "active" | "completed";
export type TaskTab = "all" | "starred";
export type WarningLevel = "none" | "blue" | "yellow" | "red";

function compare(a: Task, b: Task, sort: SortKey): number {
  if (sort === "title")
    return a.title.localeCompare(b.title, "ja") || a.id - b.id;
  if (sort === "progress") return a.progress - b.progress || a.id - b.id;
  if (sort === "duration")
    return (
      (a.estimatedMinutes ?? Infinity) - (b.estimatedMinutes ?? Infinity) ||
      a.id - b.id
    );
  return (
    (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity) ||
    a.id - b.id
  );
}

export function visibleTasks(
  tasks: Task[],
  view: TaskView,
  tab: TaskTab,
  sort: SortKey,
): Task[] {
  return tasks
    .filter((t) => t.completed === (view === "completed"))
    .filter((t) => tab === "all" || t.starred)
    .sort((a, b) => compare(a, b, sort));
}

export function warningLevel(task: Task, now = new Date()): WarningLevel {
  if (task.completed || !task.deadline) return "none";

  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const due = Date.UTC(
    task.deadline.getFullYear(),
    task.deadline.getMonth(),
    task.deadline.getDate(),
  );
  const days = Math.round((due - today) / 86_400_000);
  if (days < 0) return "red";

  const remaining =
    task.estimatedMinutes === null
      ? 0
      : task.estimatedMinutes * (1 - task.progress / 100);
  const daily = remaining / (days + 1);
  if (days === 0 || daily > 120) return "red";
  if (days <= 2 || daily > 60) return "yellow";
  return "blue";
}
