import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  BoxGeometry,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import type { Task } from "./types";
import { sliceGeometry } from "./sliceGeometry";
import { taskTexture } from "./taskTexture";
import "./DestroyView.css";

type Vec3 = [number, number, number];
type Wall = { position: Vec3; size: Vec3; color: string };
type Reticle = { x: number; y: number; angle: number };
type Piece = {
  mesh: Mesh;
  velocity: Vector3;
  spin: Vector3;
  age: number;
  fresh: boolean;
};

const walls: Wall[] = [
  { position: [0, -2.15, 0], size: [14, 0.25, 14], color: "#292d36" },
  { position: [0, 2.2, -4], size: [14, 9, 0.3], color: "#20232b" },
  { position: [-7, 2.2, 0], size: [0.3, 9, 14], color: "#1b1f27" },
  { position: [7, 2.2, 0], size: [0.3, 9, 14], color: "#1b1f27" },
];
const MAX_PIECES = 72;

function Room() {
  return walls.map(({ position, size, color }, index) => (
    <mesh key={index} receiveShadow position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  ));
}

function screenPoint(x: number, y: number): Vector2 {
  return new Vector2(
    (x / window.innerWidth) * 2 - 1,
    1 - (y / window.innerHeight) * 2,
  );
}

function lineEnds(reticle: Reticle) {
  const radius = 145;
  const dx = Math.cos(reticle.angle) * radius;
  const dy = Math.sin(reticle.angle) * radius;
  return [
    { x: reticle.x - dx, y: reticle.y - dy },
    { x: reticle.x + dx, y: reticle.y + dy },
  ] as const;
}

function SlashScene({
  tasks,
  reticle,
  slashRef,
  onCut,
  onFlash,
}: {
  tasks: Task[];
  reticle: React.RefObject<Reticle>;
  slashRef: React.RefObject<(() => void) | null>;
  onCut: () => void;
  onFlash: () => void;
}) {
  const { camera, scene } = useThree();
  const pieces = useRef<Piece[]>([]);
  const slowUntil = useRef(0);

  useFrame((_, delta) => {
    const dt =
      Math.min(delta, 0.05) *
      (performance.now() < slowUntil.current ? 0.05 : 1);
    const kept: Piece[] = [];

    for (const piece of pieces.current) {
      if (piece.fresh) {
        kept.push(piece);
        continue;
      }

      piece.age += dt;
      piece.velocity.y -= 5 * dt;
      piece.mesh.position.addScaledVector(piece.velocity, dt);
      piece.mesh.rotation.x += piece.spin.x * dt;
      piece.mesh.rotation.y += piece.spin.y * dt;
      piece.mesh.rotation.z += piece.spin.z * dt;

      if (piece.mesh.position.y < -1.6) {
        piece.mesh.position.y = -1.6;
        piece.velocity.y *= -0.24;
        piece.velocity.x *= 0.92;
      }

      if (piece.age < 8) kept.push(piece);
      else {
        scene.remove(piece.mesh);
        piece.mesh.geometry.dispose();
      }
    }

    pieces.current = kept;
  });

  useEffect(() => {
    const textures = new Set<ReturnType<typeof taskTexture>>();
    const materials = new Set<MeshStandardMaterial>();
    const edge = new MeshStandardMaterial({ color: "#22252c", roughness: 0.7 });
    const cut = new MeshStandardMaterial({
      color: "#ed2024",
      emissive: "#a00008",
      emissiveIntensity: 0.5,
      roughness: 0.45,
      side: DoubleSide,
    });
    materials.add(edge);
    materials.add(cut);
    let next = 0;

    function addTask() {
      const task = tasks[next++];
      if (!task) return;

      const texture = taskTexture(task);
      textures.add(texture);
      const face = new MeshStandardMaterial({ map: texture, roughness: 0.85 });
      materials.add(face);
      const slots = [edge, edge, edge, edge, face, edge, cut];
      const mesh = new Mesh(new BoxGeometry(4.5, 2.8, 0.24), slots);
      mesh.position.set(0, 0.2, 0.6);
      mesh.rotation.y = -0.12;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      pieces.current.push({
        mesh,
        velocity: new Vector3(),
        spin: new Vector3(),
        age: 0,
        fresh: true,
      });
    }

    addTask();

    slashRef.current = () => {
      const [start, end] = lineEnds(reticle.current);
      const startNdc = screenPoint(start.x, start.y);
      const endNdc = screenPoint(end.x, end.y);
      const a = new Vector3(startNdc.x, startNdc.y, 0.5).unproject(camera);
      const b = new Vector3(endNdc.x, endNdc.y, 0.5).unproject(camera);
      const normal = a
        .clone()
        .sub(camera.position)
        .cross(b.clone().sub(camera.position))
        .normalize();
      const plane = new Plane().setFromNormalAndCoplanarPoint(normal, a);
      const raycaster = new Raycaster();
      const targets = new Set<Mesh>();
      const meshes = pieces.current.map((piece) => piece.mesh);

      for (let i = 0; i < 32; i++) {
        const t = i / 31;
        const x = start.x + (end.x - start.x) * t;
        const y = start.y + (end.y - start.y) * t;
        raycaster.setFromCamera(screenPoint(x, y), camera);
        const hit = raycaster.intersectObjects(meshes, false)[0];
        if (hit) targets.add(hit.object as Mesh);
      }

      let cutFresh = false;
      let cutAny = false;

      for (const mesh of targets) {
        const piece = pieces.current.find((item) => item.mesh === mesh);
        if (!piece) continue;

        const halves = sliceGeometry(mesh, plane, cut);
        if (!halves) continue;

        cutAny = true;
        cutFresh ||= piece.fresh;
        scene.remove(mesh);
        mesh.geometry.dispose();
        pieces.current = pieces.current.filter((item) => item !== piece);

        halves.forEach((half, index) => {
          const geometry = half.geometry;
          const center = geometry.boundingBox!.getCenter(new Vector3());
          geometry.translate(-center.x, -center.y, -center.z);
          const fragment = new Mesh(geometry, half.material);
          fragment.position.copy(center);
          fragment.castShadow = true;
          fragment.receiveShadow = true;
          scene.add(fragment);
          const direction = index === 0 ? 1 : -1;
          pieces.current.push({
            mesh: fragment,
            velocity: normal
              .clone()
              .multiplyScalar(direction * 1.5)
              .add(new Vector3(0, 0.5, 0)),
            spin: new Vector3(
              direction * 0.4,
              direction * 0.7,
              direction * 0.5,
            ),
            age: 0,
            fresh: false,
          });
        });
      }

      if (!cutAny) return;
      slowUntil.current = performance.now() + 350;
      onFlash();

      if (cutFresh) {
        for (const piece of pieces.current) {
          if (!piece.fresh) piece.mesh.position.z -= 0.9;
        }
        onCut();
        addTask();
      }

      if (pieces.current.length > MAX_PIECES) {
        const excess = pieces.current.length - MAX_PIECES;
        const removed = pieces.current.splice(0, excess);
        for (const piece of removed) {
          scene.remove(piece.mesh);
          piece.mesh.geometry.dispose();
        }
      }
    };

    return () => {
      slashRef.current = null;
      for (const piece of pieces.current) {
        scene.remove(piece.mesh);
        piece.mesh.geometry.dispose();
      }
      pieces.current = [];
      for (const material of materials) material.dispose();
      for (const texture of textures) texture.dispose();
    };
  }, [camera, scene, tasks, reticle, slashRef, onCut, onFlash]);

  return null;
}

function Chamber({
  tasks,
  reticle,
  slashRef,
  onCut,
  onFlash,
}: {
  tasks: Task[];
  reticle: React.RefObject<Reticle>;
  slashRef: React.RefObject<(() => void) | null>;
  onCut: () => void;
  onFlash: () => void;
}) {
  return (
    <Canvas shadows camera={{ position: [0, 1.4, 7.5], fov: 48 }}>
      <color attach="background" args={["#11141b"]} />
      <fog attach="fog" args={["#11141b", 9, 20]} />
      <ambientLight intensity={1.2} />
      <directionalLight
        position={[-3, 7, 6]}
        intensity={3}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[4, 1, -2]} intensity={20} color="#7291ff" />
      <Room />
      <SlashScene
        tasks={tasks}
        reticle={reticle}
        slashRef={slashRef}
        onCut={onCut}
        onFlash={onFlash}
      />
    </Canvas>
  );
}

export function DestroyView({ tasks }: { tasks: Task[] }) {
  const [point, setPoint] = useState<Reticle>(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    angle: 0,
  }));
  const [cutCount, setCutCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const reticle = useRef(point);
  const slashRef = useRef<(() => void) | null>(null);
  const flashTimer = useRef<number | null>(null);

  function move(event: ReactPointerEvent<HTMLDivElement>) {
    const next = { ...reticle.current, x: event.clientX, y: event.clientY };
    reticle.current = next;
    setPoint(next);
  }

  function rotate(delta: number) {
    const next = { ...reticle.current, angle: reticle.current.angle + delta };
    reticle.current = next;
    setPoint(next);
  }

  const onCut = useCallback(() => setCutCount((count) => count + 1), []);
  const onFlash = useCallback(() => {
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    setFlash(true);
    flashTimer.current = window.setTimeout(() => setFlash(false), 100);
  }, []);

  useEffect(() => {
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      rotate((Math.sign(event.deltaY) * Math.PI) / 18);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "q") rotate(-Math.PI / 18);
      if (event.key.toLowerCase() === "e") rotate(Math.PI / 18);
    };

    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", key);
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const [start, end] = lineEnds(point);

  return (
    <div
      className="destroy-view"
      onPointerMove={move}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        if ((event.target as Element).closest(".destroy-header")) return;
        move(event);
        slashRef.current?.();
      }}
    >
      <header className="destroy-header">
        <span>
          TASKBASTER / {cutCount} / {tasks.length}
        </span>
        <a href={import.meta.env.BASE_URL}>タスク一覧へ</a>
      </header>

      {tasks.length > 0 ? (
        <Chamber
          tasks={tasks}
          reticle={reticle}
          slashRef={slashRef}
          onCut={onCut}
          onFlash={onFlash}
        />
      ) : (
        <p className="destroy-empty">完了済みのタスクが見つかりません。</p>
      )}

      <svg
        className={`slash-reticle${flash ? "is-flashing" : ""}`}
        aria-hidden="true"
      >
        <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
      </svg>
      <p className="destroy-hint">
        {cutCount === tasks.length && tasks.length > 0
          ? "すべて斬りました"
          : "ホイール / Q・E で回転　クリックで斬る"}
      </p>
    </div>
  );
}
