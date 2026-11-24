import { lazy, Suspense } from "react";
import { loadTasks } from "./taskStorage";

const View = lazy(() =>
  import("./DestroyView").then((m) => ({ default: m.DestroyView })),
);

export function DestroyRoute() {
  const id = Number(new URLSearchParams(window.location.search).get("task"));
  const task = Number.isSafeInteger(id)
    ? (loadTasks().find((t) => t.id === id && t.completed) ?? null)
    : null;

  return (
    <Suspense fallback={null}>
      <View task={task} />
    </Suspense>
  );
}
