import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Task } from "./types";
import { TaskFields } from "./TaskFields";
import { formFor, valuesFrom } from "./taskForm";
import type { TaskValues } from "./taskForm";

type Props = {
  task: Task | null;
  onSave: (values: TaskValues) => void;
  onClose: () => void;
};

export function TaskSheet({ task, onSave, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState(() => formFor(task));

  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = valuesFrom(form);
    if (!values.title) return;
    onSave(values);
  }

  return (
    <dialog
      ref={ref}
      className="task-sheet"
      aria-label={task ? "タスクを編集" : "タスクを追加"}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <h2>{task ? "タスクを編集" : "タスクを追加"}</h2>
        <TaskFields form={form} onChange={setForm} />
        <div className="actions">
          <button type="submit">{task ? "保存" : "追加"}</button>
          <button type="button" onClick={onClose}>
            キャンセル
          </button>
        </div>
      </form>
    </dialog>
  );
}
