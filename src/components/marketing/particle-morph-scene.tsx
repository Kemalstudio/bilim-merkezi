"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Written by the section from its ScrollTrigger; read by the scene every frame.
 * It is passed as a ref object, so the value is only ever read inside the render loop —
 * never during React's render.
 */
export type MorphState = { progress: number; velocity: number };

const COUNT = 3500;
const SHAPES = 3;

/** Fibonacci sphere — even coverage, no clumping at the poles. */
function sphereTarget(i: number, out: Float32Array) {
  const y = 1 - (i / (COUNT - 1)) * 2;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = i * Math.PI * (3 - Math.sqrt(5));
  const jitter = 0.86 + ((i * 37) % 100) / 420;
  out[i * 3] = Math.cos(theta) * radius * 2.7 * jitter;
  out[i * 3 + 1] = y * 2.7 * jitter;
  out[i * 3 + 2] = Math.sin(theta) * radius * 2.7 * jitter;
}

/** A torus: the same points, now threaded onto one continuous loop. */
function torusTarget(i: number, out: Float32Array) {
  const u = (i / COUNT) * Math.PI * 2 * 7;
  const v = ((i * 17) % COUNT) / COUNT * Math.PI * 2;
  const R = 2.25;
  const r = 0.78;
  out[i * 3] = (R + r * Math.cos(v)) * Math.cos(u);
  out[i * 3 + 1] = r * Math.sin(v);
  out[i * 3 + 2] = (R + r * Math.cos(v)) * Math.sin(u);
}

/** A wave surface: the whole subject seen at once. */
function waveTarget(i: number, out: Float32Array) {
  const side = Math.ceil(Math.sqrt(COUNT));
  const x = (i % side) / (side - 1) - 0.5;
  const z = Math.floor(i / side) / (side - 1) - 0.5;
  out[i * 3] = x * 6.4;
  out[i * 3 + 1] = Math.sin(x * 7) * Math.cos(z * 6) * 0.62;
  out[i * 3 + 2] = z * 6.4;
}

/**
 * A cloud of particles that flows between three shapes as the page scrolls: a scattered
 * sphere, a threaded torus, then an even wave surface. Scroll speed drives the spin and the
 * particle size, and the cloud leans toward the pointer.
 *
 * three.js is imported lazily so it never lands in the initial bundle, and the scene pauses
 * whenever it is off screen or the tab is hidden. If WebGL is unavailable it renders nothing
 * and the section's SVG fallback stays visible.
 */
export function ParticleMorphScene({ state, onReady }: { state: RefObject<MorphState>; onReady?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
      renderer.domElement.setAttribute("aria-hidden", "true");

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 100);
      camera.position.set(0, 0.6, 7.4);
      camera.lookAt(0, 0, 0);

      const group = new THREE.Group();
      scene.add(group);

      // Every shape is precomputed once; each frame only blends between two of them.
      const targets = [new Float32Array(COUNT * 3), new Float32Array(COUNT * 3), new Float32Array(COUNT * 3)];
      for (let i = 0; i < COUNT; i += 1) {
        sphereTarget(i, targets[0]);
        torusTarget(i, targets[1]);
        waveTarget(i, targets[2]);
      }

      const positions = new Float32Array(targets[0]);
      const colors = new Float32Array(COUNT * 3);
      const brand = new THREE.Color("#2fc0b0");
      const accent = new THREE.Color("#f4a83a");
      const tint = new THREE.Color();
      for (let i = 0; i < COUNT; i += 1) {
        tint.copy(brand).lerp(accent, (i % 97) / 97);
        colors[i * 3] = tint.r;
        colors[i * 3 + 1] = tint.g;
        colors[i * 3 + 2] = tint.b;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.05,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      });
      group.add(new THREE.Points(geometry, material));

      const pointer = { x: 0, y: 0 };
      const eased = { x: 0, y: 0 };
      function handlePointerMove(event: PointerEvent) {
        const bounds = container!.getBoundingClientRect();
        pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      }
      window.addEventListener("pointermove", handlePointerMove, { passive: true });

      let frame = 0;
      let morph = 0;
      let drawnMorph = -1;
      let spin = 0;
      const clock = new THREE.Clock();
      const attribute = geometry.getAttribute("position") as InstanceType<typeof THREE.BufferAttribute>;

      function renderFrame() {
        const elapsed = clock.getElapsedTime();

        // Ease toward the scroll position instead of snapping to it.
        const wanted = gsapLikeClamp(state.current.progress) * (SHAPES - 1);
        morph += (wanted - morph) * 0.08;

        if (Math.abs(wanted - morph) < 0.0005) morph = wanted;

        // Blending 10 500 coordinates and re-uploading them is the expensive part, so it runs
        // only while the shape is actually changing; at rest the cloud just rotates.
        if (morph !== drawnMorph) {
          const from = Math.min(SHAPES - 1, Math.floor(morph));
          const to = Math.min(SHAPES - 1, from + 1);
          const blend = morph - from;
          const a = targets[from];
          const b = targets[to];

          for (let i = 0; i < COUNT * 3; i += 1) {
            positions[i] = a[i] + (b[i] - a[i]) * blend;
          }
          attribute.needsUpdate = true;
          drawnMorph = morph;
        }

        // Scroll speed spins the cloud and stretches the points a little.
        const speed = Math.min(Math.abs(state.current.velocity) / 1400, 1);
        spin += 0.0016 + speed * 0.012;
        eased.x += (pointer.x - eased.x) * 0.04;
        eased.y += (pointer.y - eased.y) * 0.04;

        group.rotation.y = spin + eased.x * 0.34;
        group.rotation.x = Math.sin(elapsed * 0.18) * 0.08 + eased.y * 0.2;
        material.size = 0.05 + speed * 0.035;

        renderer.render(scene, camera);
      }

      // Exactly one frame chain at a time. The observer fires once on connect and again on
      // every tab switch, and each of those used to start another chain on top of the running
      // one — the scene then rendered two or three times per frame.
      let onScreen = false;
      function loop() {
        renderFrame();
        frame = requestAnimationFrame(loop);
      }
      function sync() {
        const shouldRun = onScreen && !document.hidden;
        if (shouldRun && frame === 0) {
          frame = requestAnimationFrame(loop);
        } else if (!shouldRun && frame !== 0) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          onScreen = entry.isIntersecting;
          sync();
        },
        { threshold: 0 }
      );
      observer.observe(container!);

      const handleVisibility = () => sync();
      document.addEventListener("visibilitychange", handleVisibility);

      const resizeObserver = new ResizeObserver(([entry]) => {
        const { width: nextWidth, height: nextHeight } = entry.contentRect;
        if (nextWidth === 0 || nextHeight === 0) return;
        camera.aspect = nextWidth / nextHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(nextWidth, nextHeight);
        renderFrame();
      });
      resizeObserver.observe(container!);

      renderFrame();
      onReady?.();

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        resizeObserver.disconnect();
        window.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("visibilitychange", handleVisibility);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch(() => {
      // WebGL can be blocked or unavailable; the SVG fallback is already on screen.
      if (!disposed) setFailed(true);
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [state, onReady]);

  if (failed) return null;

  return <div ref={containerRef} className="absolute inset-0" />;
}

/** Keeps the scroll progress inside 0–1 without pulling GSAP into this module. */
function gsapLikeClamp(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}
