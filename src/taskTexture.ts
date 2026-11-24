import { CanvasTexture, SRGBColorSpace } from "three";
import type { Task } from "./types";
import { duration, shortDate } from "./taskFormat";

const W = 1024;
const H = 640;
const LEFT = 52;
const TEXT_W = 920;

function titleLines(ctx: CanvasRenderingContext2D, title: string): string[] {
  const lines = [""];

  for (const ch of title) {
    if (ch === "\n") {
      lines.push("");
      continue;
    }

    const i = lines.length - 1;
    const next = lines[i] + ch;
    if (lines[i] && ctx.measureText(next).width > TEXT_W) lines.push(ch);
    else lines[i] = next;
  }

  return lines.slice(0, 3);
}

function drawTitle(ctx: CanvasRenderingContext2D, title: string) {
  ctx.fillStyle = "#080808";
  ctx.font = "italic 900 92px Arial, sans-serif";
  titleLines(ctx, title).forEach((line, i) => {
    ctx.fillText(line, LEFT, 170 + i * 105, TEXT_W);
  });
}

function drawDetails(ctx: CanvasRenderingContext2D, task: Task) {
  ctx.fillStyle = "#0b36f7";
  ctx.font = "italic 900 46px Arial, sans-serif";
  ctx.fillText(`DEADLINE: ${shortDate(task.deadline)}`, LEFT, 455, TEXT_W);
  ctx.fillText(
    `Required Time: ${duration(task.estimatedMinutes)}`,
    LEFT,
    510,
    TEXT_W,
  );

  ctx.fillStyle = "#d0d0d0";
  ctx.fillRect(LEFT, 560, TEXT_W, 12);
  ctx.fillStyle = "#080808";
  ctx.fillRect(LEFT, 560, (TEXT_W * task.progress) / 100, 12);
}

export function taskTexture(task: Task): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable");

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#080808";
  ctx.fillRect(44, 42, 936, 6);
  drawTitle(ctx, task.title);
  drawDetails(ctx, task);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
