import type { Task } from "./types";
import type { TaskFilter } from "./taskLogic";
import { TaskCard } from "./TaskCard";

type Props = {
  tasks: Task[];
  filter: TaskFilter;
  onFilter: (filter: TaskFilter) => void;
  onUpdate: (id: number, changes: Partial<Task>) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onOpen3D: (task: Task) => void;
};

export function TaskList({
  tasks,
  filter,
  onFilter,
  onUpdate,
  onEdit,
  onDelete,
  onOpen3D,
}: Props) {
  return (
    <section className="task-list" aria-label="タスク一覧">
      <div className="list-controls">
        <label>
          <span className="sr-only">表示</span>
          <select
            value={filter}
            onChange={(e) => onFilter(e.target.value as TaskFilter)}
          >
            <option value="active">未完了</option>
            <option value="completed">完了済み</option>
            <option value="starred">スター</option>
            <option value="all">すべて</option>
          </select>
        </label>
      </div>

      {tasks.length === 0 && (
        <p className="empty-state">タスクはありません。</p>
      )}
      {tasks.length > 0 && (
        <ul>
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onUpdate={onUpdate}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpen3D={onOpen3D}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
