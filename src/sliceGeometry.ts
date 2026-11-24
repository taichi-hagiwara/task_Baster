import {
  Brush,
  Evaluator,
  INTERSECTION,
  SUBTRACTION,
  computeMeshVolume,
} from "three-bvh-csg";
import { BoxGeometry, Mesh, Plane, Vector3 } from "three";
import type { Material } from "three";

const evaluator = new Evaluator();
evaluator.useGroups = true;

const MIN_VOLUME = 0.002;
const MAX_TRIANGLES = 400;
const BOX_SIZE = 100;

function triangleCount(mesh: Mesh): number {
  const geometry = mesh.geometry;
  const available =
    geometry.index?.count ?? geometry.getAttribute("position").count;
  return Math.min(available, geometry.drawRange.count) / 3;
}

function makeCutter(plane: Plane, material: Material): Brush {
  const cutter = new Brush(
    new BoxGeometry(BOX_SIZE * 2, BOX_SIZE * 2, BOX_SIZE),
    material,
  );
  const point = plane.coplanarPoint(new Vector3());
  cutter.position.copy(point).addScaledVector(plane.normal, BOX_SIZE / 2);
  cutter.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), plane.normal);
  cutter.updateMatrixWorld(true);
  return cutter;
}

function valid(brush: Brush): boolean {
  if (triangleCount(brush) < 4) return false;
  return Number(computeMeshVolume(brush)) >= MIN_VOLUME;
}

export function sliceGeometry(
  mesh: Mesh,
  plane: Plane,
  cutMaterial: Material,
): [Brush, Brush] | null {
  if (triangleCount(mesh) > MAX_TRIANGLES) return null;

  mesh.updateMatrixWorld(true);
  const target = new Brush(mesh.geometry, mesh.material);
  target.matrix.copy(mesh.matrixWorld);
  target.matrixAutoUpdate = false;
  target.updateMatrixWorld(true);

  const cutter = makeCutter(plane, cutMaterial);
  const front = new Brush();
  const back = new Brush();

  try {
    evaluator.evaluate(
      target,
      cutter,
      [INTERSECTION, SUBTRACTION],
      [front, back],
    );
  } catch {
    front.geometry.dispose();
    back.geometry.dispose();
    return null;
  } finally {
    cutter.geometry.dispose();
  }

  const sourceVolume = Number(computeMeshVolume(target));
  const frontVolume = valid(front) ? Number(computeMeshVolume(front)) : 0;
  const backVolume = valid(back) ? Number(computeMeshVolume(back)) : 0;
  const error = Math.abs(frontVolume + backVolume - sourceVolume);

  if (
    !frontVolume ||
    !backVolume ||
    error > Math.max(0.02, sourceVolume * 0.06)
  ) {
    front.geometry.dispose();
    back.geometry.dispose();
    return null;
  }

  front.geometry.applyMatrix4(mesh.matrixWorld);
  back.geometry.applyMatrix4(mesh.matrixWorld);
  front.geometry.computeBoundingBox();
  back.geometry.computeBoundingBox();
  return [front, back];
}
