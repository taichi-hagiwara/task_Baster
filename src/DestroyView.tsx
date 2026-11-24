import { useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Task } from "./types";
import { taskTexture } from "./taskTexture";
import "./DestroyView.css";

type Vec3 = [number, number, number];

type Wall = {
  pos: Vec3;
  size: Vec3;
  color: string;
};

const walls: Wall[] = [
  { pos: [0, -2.15, 0], size: [14, 0.25, 14], color: "#292d36" },
  { pos: [0, 2.2, -4], size: [14, 9, 0.3], color: "#20232b" },
  { pos: [-7, 2.2, 0], size: [0.3, 9, 14], color: "#1b1f27" },
  { pos: [7, 2.2, 0], size: [0.3, 9, 14], color: "#1b1f27" },
];

function TaskBoard({ task }: { task: Task }) {
  const texture = useMemo(() => taskTexture(task), [task]);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh
      castShadow
      receiveShadow
      position={[0, 0.2, 0]}
      rotation={[0, -0.12, 0]}
    >
      <boxGeometry args={[4.5, 2.8, 0.24]} />
      {[0, 1, 2, 3, 5].map((i) => (
        <meshStandardMaterial
          key={i}
          attach={`material-${i}`}
          color="#22252c"
          roughness={0.7}
        />
      ))}
      <meshStandardMaterial
        attach="material-4"
        map={texture}
        roughness={0.85}
      />
    </mesh>
  );
}

function Room() {
  return walls.map(({ pos, size, color }, i) => (
    <mesh key={i} receiveShadow position={pos}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  ));
}

function Chamber({ task }: { task: Task }) {
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

      <TaskBoard task={task} />
      <Room />
      <OrbitControls
        target={[0, 0, 0]}
        enablePan={false}
        minDistance={4}
        maxDistance={10}
      />
    </Canvas>
  );
}

export function DestroyView({ task }: { task: Task | null }) {
  return (
    <div className="destroy-view">
      <header className="destroy-header">
        <span>TASKBASTER / 3D</span>
        <a href={import.meta.env.BASE_URL}>タスク一覧へ</a>
      </header>
      {task ? (
        <Chamber task={task} />
      ) : (
        <p className="destroy-empty">完了済みのタスクが見つかりません。</p>
      )}
    </div>
  );
}
