import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, SoftShadows, ContactShadows, useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';
import { GameState } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  onPourUpdate: (fill: number, isSpilling: boolean) => void;
  onFinish: (stats: { fillPercentage: number; spilled: boolean; timeTaken: number }) => void;
}

// --- 3D Components ---

const Cup = ({ fillLevel }: { fillLevel: number }) => {
  // Lathe geometry for a nice cup shape
  const points = useMemo(() => {
    const p = [];
    for (let i = 0; i < 10; i++) {
      p.push(new THREE.Vector2(Math.sin(i * 0.2) * 0.5 + 1, (i - 5) * 0.2));
    }
    // Add thickness
    p.push(new THREE.Vector2(1.2, 1));
    p.push(new THREE.Vector2(1.2, -1.2));
    p.push(new THREE.Vector2(0, -1.2));
    return p;
  }, []);

  return (
    <group position={[0, -1, 0]}>
      {/* Cup Body */}
      <mesh receiveShadow castShadow>
        <latheGeometry args={[points, 32]} />
        <meshStandardMaterial color="#fdfbf7" roughness={0.1} metalness={0.1} />
      </mesh>
      
      {/* Coffee Liquid inside Cup */}
      <mesh position={[0, -1.1 + (fillLevel / 100) * 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.9 + (fillLevel/200)*0.2, 0.8, (fillLevel / 100) * 2.2, 32]} />
        <meshStandardMaterial color="#3b2f2f" roughness={0.2} />
      </mesh>

      {/* Target Line Ring */}
      <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.15, 0.02, 16, 100]} />
        <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

const Pot = ({ 
  pouring, 
  tilt, 
  setTilt 
}: { 
  pouring: boolean; 
  tilt: number; 
  setTilt: (v: number) => void 
}) => {
  useFrame((state, delta) => {
    // Animate tilt
    const targetTilt = pouring ? Math.PI / 3 : 0;
    const step = delta * 4;
    
    // Smooth dampening
    const newTilt = THREE.MathUtils.lerp(tilt, targetTilt, step);
    setTilt(newTilt);
  });

  return (
    <group position={[1.8, 1.5, 0]} rotation={[0, 0, tilt]}>
      {/* Pot Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.8, 1, 2, 32]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Handle */}
      <mesh position={[0.8, 0, 0]} rotation={[0, 0, -Math.PI/4]}>
        <torusGeometry args={[0.6, 0.1, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Spout */}
      <group position={[-0.8, 0.8, 0]} rotation={[0, 0, Math.PI / 4]}>
        <mesh>
            <cylinderGeometry args={[0.2, 0.4, 0.8, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
};

const Stream = ({ isPouring, tilt }: { isPouring: boolean, tilt: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  const particleRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!ref.current) return;
    
    // Stream logic
    // Calculate spout position in world based on Pot rotation logic
    // Simplified: Spout is roughly moving down and left as pot tilts
    
    const showStream = tilt > 0.5; // Roughly 30 degrees

    if (showStream) {
        ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, 1, 0.2);
        ref.current.visible = true;
    } else {
        ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, 0, 0.2);
        if (ref.current.scale.y < 0.01) ref.current.visible = false;
    }
  });

  return (
    <group position={[-0.2, 0.8, 0]}> {/* Approximate spout world position when tilted */}
        <mesh ref={ref} position={[0, -1.5, 0]} visible={false}>
            <cylinderGeometry args={[0.08, 0.05, 3, 8]} />
            <meshStandardMaterial color="#3b2f2f" transparent opacity={0.9} />
        </mesh>
        {/* Steam */}
        {isPouring && (
             <Sparkles count={20} scale={2} size={2} speed={0.4} opacity={0.2} color="#ffffff" position={[0, -2, 0]} />
        )}
    </group>
  );
};

// Simplified Sparkles (Custom implementation to avoid heavy drei dependency if needed, but drei Sparkles is standard)
import { Sparkles } from '@react-three/drei';

const SceneContent = ({ 
  gameState, 
  onPourUpdate, 
  onFinish 
}: GameCanvasProps) => {
  const [pouring, setPouring] = useState(false);
  const [fillLevel, setFillLevel] = useState(0); // 0 to 100+
  const [tilt, setTilt] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [spilled, setSpilled] = useState(false);

  // Reset when game restarts
  useEffect(() => {
    if (gameState === GameState.MENU) {
      setFillLevel(0);
      setSpilled(false);
      setStartTime(null);
      setTilt(0);
    }
  }, [gameState]);

  // Game Loop
  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING) return;

    // Physics logic
    const isActuallyPouring = tilt > 0.5; // Threshold angle
    
    if (isActuallyPouring) {
        // Increase fill level
        // Rate depends on tilt angle? Let's keep it steady for gameplay feel
        const pourRate = 25 * delta; // % per second
        
        let newFill = fillLevel + pourRate;
        
        // Spill logic
        if (newFill > 100) { // 100 is rim
             if (!spilled) setSpilled(true);
        }
        
        setFillLevel(newFill);
        onPourUpdate(newFill, newFill > 100);
    }
  });

  const handlePointerDown = () => {
    if (gameState === GameState.PLAYING) {
      setPouring(true);
      if (startTime === null) setStartTime(Date.now());
    }
  };

  const handlePointerUp = () => {
    setPouring(false);
    if (gameState === GameState.PLAYING && startTime !== null) {
      // End game logic if user stops pouring and has filled enough?
      // Or we wait for them to click "Serve"? 
      // Let's make it: Hold to pour, Release to stop. Click "Done" UI button to finish.
      // But for better game feel: If they release and it's > 0, we can enable the finish button in UI.
    }
  };
  
  // Expose finish stats helper
  useEffect(() => {
      // This effect just monitors "game over" state if we wanted auto-end
      // But we will let user click "Finish" in UI.
  }, []);

  return (
    <>
      <ambientLight intensity={0.6} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      <group 
        onPointerDown={handlePointerDown} 
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp} // Safety
      >
        <Cup fillLevel={Math.min(fillLevel, 100)} /> {/* Visual cap at 100 inside, but logic tracks overflow */}
        <Pot pouring={pouring} tilt={tilt} setTilt={setTilt} />
        <Stream isPouring={pouring && tilt > 0.5} tilt={tilt} />
        
        {/* Spill puddle */}
        {spilled && (
             <mesh position={[0, -2.2, 0]} rotation={[-Math.PI/2, 0, 0]}>
                 <circleGeometry args={[1.5, 32]} />
                 <meshStandardMaterial color="#3b2f2f" opacity={0.8} transparent depthWrite={false} />
             </mesh>
        )}
      </group>

      <ContactShadows position={[0, -2.2, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
      <Environment preset="city" />
    </>
  );
};

export const GameCanvas = (props: GameCanvasProps) => {
  return (
    <div className="w-full h-full absolute inset-0 bg-[#e3d5ca]">
      <Canvas shadows camera={{ position: [0, 1, 6], fov: 45 }}>
        <SoftShadows />
        <SceneContent {...props} />
      </Canvas>
      
      {/* Instruction Overlay when Playing */}
      {props.gameState === GameState.PLAYING && (
         <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
            <p className="text-gray-700 font-bold text-lg animate-pulse">
               Hold Click/Touch to Pour
            </p>
         </div>
      )}
    </div>
  );
};
