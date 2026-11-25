import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useScroll,
  useInView,
} from "framer-motion";

const DEFAULT_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
    title: "",
  },
  {
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    title: "",
  },
  {
    src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
    title: "",
  },
  {
    src: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
    title: "",
  },
  {
    src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
    title: "",
  },
  {
    src: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
    title: "",
  },
  {
    src: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
    title: "",
  },
  {
    src: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80",
    title: "",
  },
  {
    src: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    title: "",
  },
];

const SPRING_CONFIG = { stiffness: 60, damping: 25, mass: 0.5 };

function buildTunnelCards(sourceList) {
  return sourceList.map((item, i) => {
    const goldenAngle = i * 137.5 * (Math.PI / 180);
    const radiusFactorX = 0.28 + (i % 3) * 0.08;
    const radiusFactorY = 0.26 + (i % 2) * 0.09;

    return {
      item,
      angleCos: Math.cos(goldenAngle),
      angleSin: Math.sin(goldenAngle),
      radiusFactorX,
      radiusFactorY,
      rotationZ: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2),
      index: i,
    };
  });
}

function useCameraParallax(enabled) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING_CONFIG);
  const y = useSpring(rawY, SPRING_CONFIG);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e) => {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, rawX, rawY]);

  return { x, y };
}

function TunnelCard({ card, progress, pointer, total, stage }) {
  const staggerSpan = 0.55;
  const start = (card.index / total) * (1 - staggerSpan);
  const end = start + staggerSpan;

  const localProgress = useTransform(progress, [start, end], [0, 1]);

  const farZ = stage.isMobile ? -1200 : -1700;
  const nearZ = stage.isMobile ? 350 : 500;
  const z = useTransform(localProgress, [0, 1], [farZ, nearZ]);

  const opacity = useTransform(localProgress, [0, 0.18, 0.82, 0.98], [0, 1, 1, 0]);
  const pointerEvents = useTransform(localProgress, (v) =>
    v > 0.06 && v < 0.86 ? "auto" : "none"
  );

  const cardWidth = stage.isMobile
    ? Math.max(135, Math.min(185, stage.width * 0.38))
    : Math.max(195, Math.min(285, stage.width * 0.19));

  const baseX = card.angleCos * (stage.width * card.radiusFactorX);
  const baseY = card.angleSin * (stage.height * card.radiusFactorY);
  const panStrength = stage.isMobile ? 20 : 45;

  const transform = useTransform([z, pointer.x, pointer.y], ([currZ, px, py]) => {
    const offsetX = baseX - px * panStrength;
    const offsetY = baseY - py * panStrength;
    return `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), ${currZ}px) rotateZ(${card.rotationZ}deg)`;
  });

  return (
    <motion.div
      style={{
        width: cardWidth,
        transform,
        opacity,
        pointerEvents,
        zIndex: card.index + 1,
      }}
      className="absolute left-1/2 top-1/2 aspect-[4/5] will-change-transform select-none cursor-pointer"
    >
      <div className="group relative h-full w-full overflow-hidden rounded-2xl bg-zinc-100 shadow-[0_8px_20px_rgba(15,23,42,0.14),0_2px_6px_rgba(15,23,42,0.08)] hover:shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition-shadow duration-300">
        <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-105">
          <img
            src={card.item.src}
            alt={card.item.title || "Gallery photo"}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-full w-full object-cover"
          />
        </div>
        {card.item.title ? (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-end p-4 sm:p-5">
            <span className="text-xs sm:text-sm font-medium text-white drop-shadow-sm">
              {card.item.title}
            </span>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

export function PerspectiveTunnelHero({
  images,
  loading = false,
  id = "Gallery",
  scrollHeight = "220vh",
}) {
  const sectionRef = useRef(null);
  const reduce = useReducedMotion();

  const [stage, setStage] = useState({
    width: 1440,
    height: 900,
    isMobile: false,
  });

  useEffect(() => {
    const updateDimensions = () => {
      setStage({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const tunnelCards = useMemo(() => {
    if (loading) return [];
    const normalized =
      Array.isArray(images) && images.length > 0
        ? images.map((img) => ({
            src: img.src || img.image_url || "",
            title: img.title || "",
          }))
        : DEFAULT_IMAGES;

    let list = normalized;
    if (list.length > 0 && list.length < 6) {
      const expanded = [];
      while (expanded.length < 8) {
        expanded.push(...list);
      }
      list = expanded.slice(0, 9);
    }
    return buildTunnelCards(list);
  }, [images, loading]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 30%", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 30,
    restDelta: 0.0001,
  });

  // Start inside corridor (0.14) so photos are visible immediately below Portofolio
  const tunnelProgress = useTransform(smoothProgress, [0, 1], [0.14, 1.02]);

  // Only track mouse movement when gallery is in/near viewport (eliminates idle CPU/GPU load)
  const inView = useInView(sectionRef, { margin: "250px" });
  const pointer = useCameraParallax(inView && !reduce);
  const promptOpacity = useTransform(smoothProgress, [0, 0.16], [1, 0]);

  return (
    <section
      id={id}
      ref={sectionRef}
      // FIX: pointer-events-none supaya section galeri tidak menutupi klik pada kartu project di atasnya
      className="relative z-10 w-full bg-transparent select-none pointer-events-none"
      style={{ height: scrollHeight }}
    >
      <div
        // FIX: pointer-events-none juga di div sticky (100svh) yang menempel di viewport
        className="sticky top-0 h-[100svh] w-full overflow-hidden bg-transparent text-zinc-900 flex items-center justify-center pointer-events-none"
        style={{
          perspective: stage.isMobile ? "900px" : "1200px",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Subtle Scroll Prompt (Sentence case, accessible contrast) */}
        <motion.div
          style={{ opacity: promptOpacity }}
          className="pointer-events-none absolute bottom-8 z-20 flex flex-col items-center gap-2 text-xs font-medium text-zinc-600"
        >
          <span>Scroll to explore</span>
          <div className="h-5 w-px bg-zinc-300" />
        </motion.div>

        {/* 3D Z-Space Plane */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ transformStyle: "preserve-3d" }}
        >
          {tunnelCards.map((card, i) => (
            <TunnelCard
              key={card.item.src ? `${card.item.src}-${i}` : i}
              card={card}
              progress={tunnelProgress}
              pointer={pointer}
              total={tunnelCards.length}
              stage={stage}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default PerspectiveTunnelHero;