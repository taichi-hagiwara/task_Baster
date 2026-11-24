import type { Task } from "./types";
import type { TaskTab, TaskView } from "./taskLogic";
import { TaskCard } from "./TaskCard";

type Props = {
  tasks: Task[];
  view: TaskView;
  tab: TaskTab;
  onTab: (tab: TaskTab) => void;
  onUpdate: (id: number, changes: Partial<Task>) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
};

export function TaskList({
  tasks,
  view,
  tab,
  onTab,
  onUpdate,
  onEdit,
  onDelete,
}: Props) {
  return (
    <section
      className="task-list"
      aria-label={view === "active" ? "未完了タスク" : "完了済みタスク"}
    >
      <div className="list-controls">
        <div className="list-help">
          <button
            type="button"
            aria-describedby="list-help-text"
            aria-label="一覧の説明"
          >
            ?
          </button>
          <span id="list-help-text" role="tooltip">
            {view === "active" ? "未完了" : "完了済み"}
            のタスクを表示中。スターで絞り込めます。
          </span>
        </div>
        <div
          className="list-tabs"
          role="tablist"
          aria-label="タスクの絞り込み"
          data-tab={tab}
        >
          <button
            id="starred-tab"
            type="button"
            role="tab"
            aria-controls="task-panel"
            aria-selected={tab === "starred"}
            onClick={() => onTab("starred")}
          >
            スター
          </button>
          <button
            id="all-tab"
            type="button"
            role="tab"
            aria-controls="task-panel"
            aria-selected={tab === "all"}
            onClick={() => onTab("all")}
          >
            すべて
          </button>
        </div>
      </div>

      <div
        id="task-panel"
        role="tabpanel"
        aria-labelledby={tab === "all" ? "all-tab" : "starred-tab"}
        key={`${view}-${tab}`}
      >
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
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
