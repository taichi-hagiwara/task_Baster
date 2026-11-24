import { useEffect, useState } from "react";
import type { Task } from "./types";
import { loadTasks, saveTasks } from "./taskStorage";
import { visibleTasks } from "./taskLogic";
import type { SortKey, TaskFilter } from "./taskLogic";
import { AppHeader } from "./AppHeader";
import { TaskList } from "./TaskList";
import { TaskSheet } from "./TaskSheet";
import type { TaskValues } from "./taskForm";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [sort, setSort] = useState<SortKey>("deadline");
  const [filter, setFilter] = useState<TaskFilter>("active");
  const [sheet, setSheet] = useState(false);
  const [edit, setEdit] = useState<Task | null>(null);

  useEffect(() => saveTasks(tasks), [tasks]);

  function add() {
    setEdit(null);
    setSheet(true);
  }

  function close() {
    setSheet(false);
    setEdit(null);
  }

  function save(values: TaskValues) {
    const changes = { ...values, completed: values.progress === 100 };

    setTasks((ts) => {
      if (edit)
        return ts.map((t) => (t.id === edit.id ? { ...t, ...changes } : t));

      const id = Math.max(0, ...ts.map((t) => t.id)) + 1;
      return [...ts, { id, ...changes, starred: false }];
    });

    close();
  }

  function update(id: number, changes: Partial<Task>) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  }

  function remove(id: number) {
    setTasks((ts) => ts.filter((t) => t.id !== id));
    if (edit?.id === id) close();
  }

  function open3D(t: Task) {
    saveTasks(tasks);
    const url = new URL(import.meta.env.BASE_URL, window.location.origin);
    url.searchParams.set("mode", "destroy");
    url.searchParams.set("task", String(t.id));
    window.open(url, "_blank");
  }

  return (
    <>
      <AppHeader sort={sort} onSort={setSort} onAdd={add} />

      <main>
        {sheet && <TaskSheet task={edit} onSave={save} onClose={close} />}
        <TaskList
          tasks={visibleTasks(tasks, filter, sort)}
          filter={filter}
          onFilter={setFilter}
          onUpdate={update}
          onEdit={(t) => {
            setEdit(t);
            setSheet(true);
          }}
          onDelete={remove}
          onOpen3D={open3D}
        />
      </main>
    </>
  );
}

export default App;
