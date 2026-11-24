import type { CSSProperties } from "react";
import type { Task } from "./types";
import { warningLevel } from "./taskLogic";
import { duration, shortDate } from "./taskFormat";

type Props = {
  task: Task;
  onUpdate: (id: number, changes: Partial<Task>) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onOpen3D: (task: Task) => void;
};

function TaskTitle({ task }: { task: Task }) {
  const chars = Array.from(task.title);
  const count = chars.filter((ch) => ch !== "\n").length;
  let pos = 0;

  const glyphs = chars.map((ch, i) => {
    if (ch === "\n") return <br key={i} />;

    const ink = Math.max(
      0,
      Math.min(100, ((1 - task.progress / 100) * count - pos++) * 100),
    );
    const style = { "--ink": `${ink}%` } as CSSProperties;
    return (
      <span className="task-glyph" style={style} key={i}>
        {ch === " " ? "\u00a0" : ch}
      </span>
    );
  });

  return <h3 className="task-title">{glyphs}</h3>;
}

export function TaskCard({
  task: t,
  onUpdate,
  onEdit,
  onDelete,
  onOpen3D,
}: Props) {
  const level = warningLevel(t);

  function setProgress(progress: number) {
    onUpdate(t.id, { progress, completed: progress === 100 });
  }

  function toggleDone() {
    onUpdate(t.id, {
      completed: !t.completed,
      progress: t.completed ? 0 : 100,
    });
  }

  return (
    <li className={`task-row signal-${level}`}>
      <div className="task-primary">
        <TaskTitle task={t} />
        <label className="task-progress">
          <span className="sr-only">{t.title}の進捗</span>
          <input
            type="range"
            min="0"
            max="100"
            value={t.progress}
            onChange={(e) => setProgress(Number(e.target.value))}
          />
          <span>{t.progress}%</span>
        </label>
      </div>

      <div className="task-details">
        <div className="task-meta">
          <p>DEADLINE: {shortDate(t.deadline)}</p>
          <p>Required Time: {duration(t.estimatedMinutes)}</p>
        </div>

        <div className="task-actions">
          <button
            type="button"
            className="star-button"
            aria-label={t.starred ? "スターを外す" : "スターを付ける"}
            aria-pressed={t.starred}
            onClick={() => onUpdate(t.id, { starred: !t.starred })}
          >
            {t.starred ? "★" : "☆"}
          </button>
          <button type="button" onClick={toggleDone}>
            {t.completed ? "未完了に戻す" : "完了"}
          </button>
          <button type="button" onClick={() => onEdit(t)}>
            編集
          </button>
          {t.completed && (
            <button type="button" onClick={() => onOpen3D(t)}>
              3Dで見る
            </button>
          )}
          <button type="button" onClick={() => onDelete(t.id)}>
            削除
          </button>
        </div>
      </div>

      {t.description && <p className="task-description">{t.description}</p>}
    </li>
  );
}
