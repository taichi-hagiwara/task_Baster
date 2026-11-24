import type { TaskForm } from "./taskForm";

type Props = {
  form: TaskForm;
  onChange: (form: TaskForm) => void;
};

export function TaskFields({ form, onChange }: Props) {
  return (
    <>
      <label>
        タイトル
        <input
          required
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
        />
      </label>

      <label>
        期限
        <input
          type="date"
          value={form.deadline}
          onChange={(e) => onChange({ ...form, deadline: e.target.value })}
        />
      </label>

      <label>
        所要時間（分）
        <input
          type="number"
          min="0"
          value={form.estimatedMinutes}
          onChange={(e) =>
            onChange({ ...form, estimatedMinutes: e.target.value })
          }
        />
      </label>

      <label>
        説明
        <textarea
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
        />
      </label>

      <div className="progress-input">
        <label htmlFor="form-progress">進捗</label>
        <input
          id="form-progress"
          type="range"
          min="0"
          max="100"
          value={form.progress}
          onChange={(e) =>
            onChange({ ...form, progress: Number(e.target.value) })
          }
        />
        <label className="progress-number">
          ％
          <input
            type="number"
            min="0"
            max="100"
            value={form.progress}
            onChange={(e) =>
              onChange({
                ...form,
                progress: Math.min(
                  100,
                  Math.max(0, Number(e.target.value) || 0),
                ),
              })
            }
          />
        </label>
      </div>
    </>
  );
}
