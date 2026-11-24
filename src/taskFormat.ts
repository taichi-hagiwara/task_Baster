export function inputDate(d: Date | null): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shortDate(d: Date | null): string {
  if (!d) return "—";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function duration(m: number | null): string {
  if (m === null) return "—";
  const h = Math.floor(m / 60);
  const min = String(m % 60).padStart(2, "0");
  return `${h}h${min}m`;
}
