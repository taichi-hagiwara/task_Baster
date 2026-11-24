import type { Task } from "./types";
import { inputDate } from "./taskFormat";

export type TaskValues = Pick<
  Task,
  "title" | "deadline" | "description" | "progress" | "estimatedMinutes"
>;

export type TaskForm = {
  title: string;
  deadline: string;
  description: string;
  progress: number;
  estimatedMinutes: string;
};

export function formFor(task: Task | null): TaskForm {
  if (!task)
    return {
      title: "",
      deadline: "",
      description: "",
      progress: 0,
      estimatedMinutes: "",
    };

  return {
    title: task.title,
    deadline: inputDate(task.deadline),
    description: task.description,
    progress: task.progress,
    estimatedMinutes: task.estimatedMinutes?.toString() ?? "",
  };
}

export function valuesFrom(form: TaskForm): TaskValues {
  return {
    title: form.title.trim(),
    deadline: form.deadline ? new Date(`${form.deadline}T00:00:00`) : null,
    description: form.description.trim(),
    progress: Math.min(100, Math.max(0, form.progress)),
    estimatedMinutes:
      form.estimatedMinutes === ""
        ? null
        : Math.max(0, Number(form.estimatedMinutes) || 0),
  };
}
