"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

export function ImmersiveBackground() {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 50, damping: 22, mass: 0.8 });
  const springY = useSpring(y, { stiffness: 50, damping: 22, mass: 0.8 });
  const layerOneX = useTransform(springX, [-1, 1], [-14, 14]);
  const layerOneY = useTransform(springY, [-1, 1], [-10, 10]);
  const layerTwoX = useTransform(springX, [-1, 1], [18, -18]);
  const layerTwoY = useTransform(springY, [-1, 1], [12, -12]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      onPointerMove={(event) => {
        if (reduceMotion) return;
        x.set((event.clientX / window.innerWidth - 0.5) * 2);
        y.set((event.clientY / window.innerHeight - 0.5) * 2);
      }}
      style={{ pointerEvents: reduceMotion ? "none" : "auto" }}
    >
      <div className="absolute inset-0" style={{ background: "var(--night)" }} />
      <motion.div
        className="absolute -left-32 top-0 h-[32rem] w-[32rem] rounded-full blur-3xl"
        style={{ background: "var(--floodlight-dim)", x: reduceMotion ? 0 : layerOneX, y: reduceMotion ? 0 : layerOneY }}
      />
      <motion.div
        className="absolute -right-32 top-10 h-[36rem] w-[36rem] rounded-full blur-3xl"
        style={{ background: "var(--cap-gold-dim)", x: reduceMotion ? 0 : layerTwoX, y: reduceMotion ? 0 : layerTwoY }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.6 0.11 155 / 0.06) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.6 0.11 155 / 0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(to bottom, black, transparent 75%)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent 75%)",
        }}
      />
    </div>
  );
}
