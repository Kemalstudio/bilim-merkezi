"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The hero's 3D constellation.
 *
 * This is the volumetric version of the flat SVG constellation used elsewhere on
 * the site — same metaphor (points of knowledge, connected), given depth. It
 * exists to make the hero feel considered, not to perform: the scene drifts
 * slowly, leans a few degrees toward the pointer, and does nothing else.
 *
 * three.js is imported lazily inside the effect so its ~600 KB never lands in
 * the initial bundle, and the whole component is skipped on small screens and
 * under `prefers-reduced-motion`, where the SVG fallback renders instead.
 */
export function HeroScene({ onReady }: { onReady?: () => void }) {
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

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      renderer.setSize(width, height);
      // Capped at 2: beyond that the extra pixels cost more than they show.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
      renderer.domElement.setAttribute("aria-hidden", "true");

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      camera.position.z = 7.5;

      const group = new THREE.Group();
      scene.add(group);

      // Nodes sit on a lightly jittered sphere so the cluster reads as a shape
      // rather than a random cloud, and lines only join genuinely close pairs.
      const NODE_COUNT = 26;
      const positions: InstanceType<typeof THREE.Vector3>[] = [];
      for (let index = 0; index < NODE_COUNT; index += 1) {
        // Fibonacci sphere — even coverage without clumping at the poles.
        const y = 1 - (index / (NODE_COUNT - 1)) * 2;
        const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = index * Math.PI * (3 - Math.sqrt(5));
        const jitter = 0.82 + Math.random() * 0.36;
        positions.push(
          new THREE.Vector3(
            Math.cos(theta) * radiusAtY * 2.6 * jitter,
            y * 2.6 * jitter,
            Math.sin(theta) * radiusAtY * 2.6 * jitter
          )
        );
      }

      const brandColor = new THREE.Color("#56d6c6");
      const accentColor = new THREE.Color("#f4a83a");

      const nodeGeometry = new THREE.SphereGeometry(1, 16, 16);
      const nodeMaterials = [
        new THREE.MeshBasicMaterial({ color: brandColor, transparent: true, opacity: 0.9 }),
        new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.95 }),
      ];

      positions.forEach((position, index) => {
        // Every fifth node is gold, so the accent reads as punctuation.
        const mesh = new THREE.Mesh(nodeGeometry, nodeMaterials[index % 5 === 0 ? 1 : 0]);
        mesh.position.copy(position);
        const scale = index % 5 === 0 ? 0.11 : 0.062;
        mesh.scale.setScalar(scale);
        group.add(mesh);
      });

      const linePoints: number[] = [];
      const LINK_DISTANCE = 2.15;
      for (let a = 0; a < positions.length; a += 1) {
        for (let b = a + 1; b < positions.length; b += 1) {
          if (positions[a].distanceTo(positions[b]) < LINK_DISTANCE) {
            linePoints.push(
              positions[a].x, positions[a].y, positions[a].z,
              positions[b].x, positions[b].y, positions[b].z
            );
          }
        }
      }

      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(linePoints, 3)
      );
      const lineMaterial = new THREE.LineBasicMaterial({
        color: brandColor,
        transparent: true,
        opacity: 0.26,
      });
      group.add(new THREE.LineSegments(lineGeometry, lineMaterial));

      // Pointer parallax is a target the group eases toward, never a direct
      // binding — a fast flick nudges the scene instead of snapping it.
      const pointer = { x: 0, y: 0 };
      const eased = { x: 0, y: 0 };

      function handlePointerMove(event: PointerEvent) {
        const bounds = container!.getBoundingClientRect();
        pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      }
      window.addEventListener("pointermove", handlePointerMove, { passive: true });

      let frame = 0;
      let running = true;
      const clock = new THREE.Clock();

      function renderFrame() {
        const elapsed = clock.getElapsedTime();
        eased.x += (pointer.x - eased.x) * 0.04;
        eased.y += (pointer.y - eased.y) * 0.04;

        group.rotation.y = elapsed * 0.08 + eased.x * 0.28;
        group.rotation.x = Math.sin(elapsed * 0.16) * 0.06 + eased.y * 0.18;

        renderer.render(scene, camera);
      }

      function loop() {
        if (!running) return;
        renderFrame();
        frame = requestAnimationFrame(loop);
      }

      // Nothing renders while the hero is scrolled away or the tab is hidden.
      const observer = new IntersectionObserver(
        ([entry]) => {
          running = entry.isIntersecting && !document.hidden;
          if (running) {
            clock.getDelta();
            loop();
          } else {
            cancelAnimationFrame(frame);
          }
        },
        { threshold: 0 }
      );
      observer.observe(container!);

      function handleVisibility() {
        running = !document.hidden;
        if (running) loop();
        else cancelAnimationFrame(frame);
      }
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

      loop();
      onReady?.();

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        resizeObserver.disconnect();
        window.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("visibilitychange", handleVisibility);
        nodeGeometry.dispose();
        nodeMaterials.forEach((material) => material.dispose());
        lineGeometry.dispose();
        lineMaterial.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch(() => {
      // WebGL can be unavailable (blocked, software-rendering disabled). The
      // SVG fallback is already on screen, so there is nothing to recover.
      if (!disposed) setFailed(true);
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [onReady]);

  if (failed) return null;

  return <div ref={containerRef} className="absolute inset-0" />;
}
