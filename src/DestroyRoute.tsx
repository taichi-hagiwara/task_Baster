import { lazy, Suspense } from "react";
import { loadTasks } from "./taskStorage";

const View = lazy(() =>
  import("./DestroyView").then((m) => ({ default: m.DestroyView })),
);

export function DestroyRoute() {
  const idParam = new URLSearchParams(window.location.search).get("task");
  const id = idParam === null ? null : Number(idParam);
  const tasks = loadTasks().filter(
    (task) => task.completed && (id === null || task.id === id),
  );

  return (
    <Suspense fallback={null}>
      <View tasks={tasks} />
    </Suspense>
  );
}
