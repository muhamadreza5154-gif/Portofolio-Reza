"use client";

import React, { useRef, useState, useMemo } from "react";
import {
  motion,
  useScroll,
  useVelocity,
  useTransform,
  useSpring,
  useAnimationFrame,
  useMotionValue,
  wrap,
} from "framer-motion";

/**
 * VelocityScrollRow
 * Renders an infinite, seamless horizontal row of elements that moves continuously
 * and accelerates or reverses direction based on the user's vertical scroll velocity.
 */
export function VelocityScrollRow({
  children,
  baseVelocity = -1.2, // Base continuous drift speed (% of track width per second, negative = leftwards)
  pauseOnHover = true,
  className = "",
  gap = "gap-6",
}) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  // Smooth the scroll velocity with spring physics for natural momentum and decay
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });

  // Map scroll velocity to an animation speed multiplier
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  const [isHovered, setIsHovered] = useState(false);
  const directionRef = useRef(baseVelocity < 0 ? -1 : 1);

  // Calculate number of copies needed so track always exceeds screen width on wide monitors
  const childCount = React.Children.count(children);
  const copies = useMemo(() => {
    return Math.max(4, Math.ceil(16 / Math.max(childCount, 1)));
  }, [childCount]);

  // One full seamless cycle length in percentage
  const step = 100 / copies;
  const x = useTransform(baseX, (v) => `${wrap(-step, 0, v)}%`);

  useAnimationFrame((time, delta) => {
    const vf = velocityFactor.get();

    // Adjust direction based on vertical scroll direction
    if (vf > 0.25) {
      directionRef.current = -1; // Scrolling down -> move left
    } else if (vf < -0.25) {
      directionRef.current = 1;  // Scrolling up -> move right
    } else {
      // Return to default drift direction when not scrolling
      directionRef.current = baseVelocity < 0 ? -1 : 1;
    }

    // Base drift speed (pause if hovered)
    const baseSpeed = isHovered && pauseOnHover ? 0 : Math.abs(baseVelocity);

    // Boost speed proportionally to page scroll velocity
    const scrollBoost = Math.abs(vf) * 5.5;
    const totalSpeed = baseSpeed + scrollBoost;

    // Movement increment for current frame
    const moveBy = directionRef.current * totalSpeed * (delta / 1000);

    baseX.set(baseX.get() + moveBy);
  });

  const copyArray = useMemo(() => Array.from({ length: copies }), [copies]);

  return (
    <div
      className={`relative overflow-hidden w-full select-none py-3 ${className}`}
      onMouseEnter={() => pauseOnHover && setIsHovered(true)}
      onMouseLeave={() => pauseOnHover && setIsHovered(false)}
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
      }}
    >
      <motion.div
        className="flex flex-nowrap items-stretch w-max cursor-grab active:cursor-grabbing"
        style={{ x }}
      >
        {copyArray.map((_, copyIndex) => (
          <div
            key={copyIndex}
            className={`flex flex-nowrap items-stretch ${gap} pr-6 flex-shrink-0`}
          >
            {children}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default VelocityScrollRow;
