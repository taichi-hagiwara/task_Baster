import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Physics, useRapier } from "@react-three/rapier";
import type { RapierContext, RapierRigidBody } from "@react-three/rapier";
import {
  BufferGeometry,
  BoxGeometry,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  Plane,
  Raycaster,
  Scene,
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
  body: RapierRigidBody | null;
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

function removePiece(
  piece: Piece,
  scene: Scene,
  world: RapierContext["world"],
) {
  if (piece.body) world.removeRigidBody(piece.body);
  scene.remove(piece.mesh);
  piece.mesh.geometry.dispose();
}

function hullPoints(geometry: BufferGeometry): Float32Array {
  const position = geometry.getAttribute("position");
  const count = Math.min(position.count, geometry.drawRange.count);
  const points = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    points[i * 3] = position.getX(i);
    points[i * 3 + 1] = position.getY(i);
    points[i * 3 + 2] = position.getZ(i);
  }

  return points;
}

function makeBody(
  mesh: Mesh,
  velocity: Vector3,
  spin: Vector3,
  world: RapierContext["world"],
  rapier: RapierContext["rapier"],
): RapierRigidBody {
  const body = world.createRigidBody(
    rapier.RigidBodyDesc.dynamic()
      .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z)
      .setLinearDamping(0.5)
      .setAngularDamping(0.9)
      .setCcdEnabled(true),
  );
  const geometry = mesh.geometry;
  geometry.computeBoundingBox();
  const size = geometry.boundingBox!.getSize(new Vector3());
  const collider =
    rapier.ColliderDesc.convexHull(hullPoints(geometry)) ??
    rapier.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2);
  collider.setFriction(0.9).setRestitution(0.12);
  world.createCollider(collider, body);
  body.setLinvel(velocity, true);
  body.setAngvel(spin, true);
  return body;
}

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
  nextRef,
  slowRef,
  onCut,
  onNext,
  onFlash,
}: {
  tasks: Task[];
  reticle: React.RefObject<Reticle>;
  slashRef: React.RefObject<(() => void) | null>;
  nextRef: React.RefObject<(() => void) | null>;
  slowRef: React.RefObject<boolean>;
  onCut: () => void;
  onNext: () => void;
  onFlash: () => void;
}) {
  const { camera, scene } = useThree();
  const { world, rapier, step } = useRapier();
  const pieces = useRef<Piece[]>([]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05) * (slowRef.current ? 0.05 : 1);
    step(dt);
    const kept: Piece[] = [];

    for (const piece of pieces.current) {
      if (piece.fresh) {
        kept.push(piece);
        continue;
      }

      piece.age += dt;
      if (piece.body) {
        const position = piece.body.translation();
        const rotation = piece.body.rotation();
        piece.mesh.position.set(position.x, position.y, position.z);
        piece.mesh.quaternion.set(
          rotation.x,
          rotation.y,
          rotation.z,
          rotation.w,
        );
      }

      if (piece.age < 8) kept.push(piece);
      else removePiece(piece, scene, world);
    }

    pieces.current = kept;
  });

  useEffect(() => {
    const floor = world.createCollider(
      rapier.ColliderDesc.cuboid(7, 0.125, 7)
        .setTranslation(0, -2.15, 0)
        .setFriction(0.9)
        .setRestitution(0.1),
    );
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
    let ready = false;

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
        body: null,
        age: 0,
        fresh: true,
      });
    }

    addTask();

    nextRef.current = () => {
      if (!ready || next >= tasks.length) return;
      ready = false;
      addTask();
      onNext();
    };

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
          const velocity = normal
            .clone()
            .multiplyScalar(direction * 1.5)
            .add(new Vector3(0, 0.5, 0));
          const spin = new Vector3(
            direction * 0.4,
            direction * 0.7,
            direction * 0.5,
          );
          pieces.current.push({
            mesh: fragment,
            body: makeBody(fragment, velocity, spin, world, rapier),
            age: 0,
            fresh: false,
          });
        });
      }

      if (!cutAny) return;
      onFlash();

      if (cutFresh) {
        ready = true;
        onCut();
      }

      if (pieces.current.length > MAX_PIECES) {
        const excess = pieces.current.length - MAX_PIECES;
        const removed = pieces.current.splice(0, excess);
        for (const piece of removed) removePiece(piece, scene, world);
      }
    };

    return () => {
      slashRef.current = null;
      nextRef.current = null;
      for (const piece of pieces.current) removePiece(piece, scene, world);
      pieces.current = [];
      world.removeCollider(floor, true);
      for (const material of materials) material.dispose();
      for (const texture of textures) texture.dispose();
    };
  }, [
    camera,
    scene,
    world,
    rapier,
    tasks,
    reticle,
    slashRef,
    nextRef,
    onCut,
    onNext,
    onFlash,
  ]);

  return null;
}

function Chamber({
  tasks,
  reticle,
  slashRef,
  nextRef,
  slowRef,
  onCut,
  onNext,
  onFlash,
}: {
  tasks: Task[];
  reticle: React.RefObject<Reticle>;
  slashRef: React.RefObject<(() => void) | null>;
  nextRef: React.RefObject<(() => void) | null>;
  slowRef: React.RefObject<boolean>;
  onCut: () => void;
  onNext: () => void;
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
      <Suspense fallback={null}>
        <Physics
          gravity={[0, -5, 0]}
          timeStep={1 / 120}
          paused
          interpolate={false}
        >
          <SlashScene
            tasks={tasks}
            reticle={reticle}
            slashRef={slashRef}
            nextRef={nextRef}
            slowRef={slowRef}
            onCut={onCut}
            onNext={onNext}
            onFlash={onFlash}
          />
        </Physics>
      </Suspense>
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
  const [pending, setPending] = useState(false);
  const [slow, setSlow] = useState(false);
  const reticle = useRef(point);
  const slashRef = useRef<(() => void) | null>(null);
  const nextRef = useRef<(() => void) | null>(null);
  const slowRef = useRef(false);
  const flashTimer = useRef<number | null>(null);

  function move(event: { clientX: number; clientY: number }) {
    const next = { ...reticle.current, x: event.clientX, y: event.clientY };
    reticle.current = next;
    setPoint(next);
  }

  function rotate(delta: number) {
    const next = { ...reticle.current, angle: reticle.current.angle + delta };
    reticle.current = next;
    setPoint(next);
  }

  const onCut = useCallback(() => {
    setCutCount((count) => count + 1);
    setPending(true);
  }, []);
  const onNext = useCallback(() => setPending(false), []);
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
      if (event.key.toLowerCase() === "r") nextRef.current?.();
    };
    const release = (event: MouseEvent) => {
      if (event.button !== 2) return;
      slowRef.current = false;
      setSlow(false);
    };
    const blur = () => {
      slowRef.current = false;
      setSlow(false);
    };

    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", key);
    window.addEventListener("mouseup", release);
    window.addEventListener("pointercancel", blur);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", key);
      window.removeEventListener("mouseup", release);
      window.removeEventListener("pointercancel", blur);
      window.removeEventListener("blur", blur);
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const [start, end] = lineEnds(point);

  return (
    <div
      className="destroy-view"
      onPointerMove={move}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if ((event.target as Element).closest(".destroy-header")) return;
        if (event.button !== 2) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        slowRef.current = true;
        setSlow(true);
      }}
      onMouseDown={(event) => {
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
          nextRef={nextRef}
          slowRef={slowRef}
          onCut={onCut}
          onNext={onNext}
          onFlash={onFlash}
        />
      ) : (
        <p className="destroy-empty">完了済みのタスクが見つかりません。</p>
      )}

      <svg
        className={flash ? "slash-reticle is-flashing" : "slash-reticle"}
        aria-hidden="true"
      >
        <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
      </svg>
      <p className="destroy-hint">
        {cutCount === tasks.length && tasks.length > 0
          ? "すべて斬りました"
          : pending
            ? "R で次のタスク"
            : slow
              ? "SLOW"
              : "Q・E / ホイールで回転　左クリックで斬る　右クリック長押しでスロー"}
      </p>
    </div>
  );
}
