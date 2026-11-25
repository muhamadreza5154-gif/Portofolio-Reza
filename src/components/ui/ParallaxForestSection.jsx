import React, { useEffect, useRef, memo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { Sparkles, Compass } from "lucide-react";

function ParallaxForestSection() {
  const containerRef = useRef(null);
  const skyRef = useRef(null);
  const mountainRef = useRef(null);
  const personRef = useRef(null);
  const forestRef = useRef(null);
  const introHintRef = useRef(null);
  const textRevealRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);
    const tickerCallback = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=180%", // 1.8x viewport scroll distance
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      // 1. Initial scroll prompt fades away quickly
      tl.to(
        introHintRef.current,
        {
          opacity: 0,
          y: -25,
          duration: 0.15,
          ease: "power1.out",
        },
        0
      );

      // 2. The Forest Trees (hutan.svg) Zoom in outward and upward (flying through)
      tl.to(
        forestRef.current,
        {
          scale: 4.8,
          opacity: 0,
          ease: "power2.inOut",
          duration: 0.7,
        },
        0
      );

      // 3. Person (img30.svg) parallax
      tl.to(
        personRef.current,
        {
          scale: 1.15,
          yPercent: 3,
          ease: "none",
          duration: 1,
        },
        0
      );

      // 4. Mountain (img20.svg) parallax
      tl.to(
        mountainRef.current,
        {
          scale: 1.06,
          yPercent: -6,
          ease: "none",
          duration: 1,
        },
        0
      );

      // 5. Sky & Moon (img10.svg) distant parallax
      tl.to(
        skyRef.current,
        {
          scale: 1.02,
          yPercent: -10,
          ease: "none",
          duration: 1,
        },
        0
      );

      // 6. Cinematic quote & title appears as trees part open
      tl.fromTo(
        textRevealRef.current,
        {
          opacity: 0,
          y: 45,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.35,
          ease: "power2.out",
        },
        0.42
      );
    }, containerRef);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden select-none bg-[#030712] z-20"
      id="Journey"
    >
      {/* ── PARALLAX LAYERS CONTAINER ── */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        
        {/* Layer 1 (Back): img10.svg — Sky, Moon, and Stars */}
        <div
          ref={skyRef}
          className="absolute inset-0 w-full h-full will-change-transform"
        >
          <img
            src="/img10.svg"
            alt="Sky and Moon"
            className="w-full h-full object-cover object-top translate-y-[6vh] sm:translate-y-[8vh] scale-[1.05]"
            loading="eager"
          />
        </div>

        {/* Layer 2 (Mid-Back): img20.svg — Snowy Mountain Peak */}
        <div
          ref={mountainRef}
          className="absolute inset-0 w-full h-full will-change-transform z-10"
        >
          <img
            src="/img20.svg"
            alt="Mountain"
            className="w-full h-full object-cover object-top translate-y-[6vh] sm:translate-y-[8vh] scale-[1.05]"
            loading="eager"
          />
        </div>

        {/* Layer 3 (Mid-Front): img30.svg — Person on Ground Ridge (Lowered to match Image 2) */}
        <div
          ref={personRef}
          className="absolute inset-0 w-full h-full will-change-transform z-20"
        >
          <img
            src="/img30.svg"
            alt="Character standing on ridge"
            className="w-full h-full object-cover object-top translate-y-[6vh] sm:translate-y-[8vh] scale-[1.05]"
            loading="eager"
          />
        </div>

        {/* Layer 4 (Front Canopy): hutan.svg — Forest Tree Frame */}
        <div
          ref={forestRef}
          className="absolute inset-0 w-full h-full will-change-transform z-40 origin-[50%_65%] pointer-events-none"
        >
          <img
            src="/hutan.svg"
            alt="Forest Canopy Frame"
            className="w-full h-full object-cover object-top translate-y-[2vh] sm:translate-y-[3vh] scale-[1.02]"
            loading="eager"
          />
        </div>

        {/* Top subtle shadow for navbar contrast */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-30" />

        {/* Bottom Vignette Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#050510] via-[#050510]/60 to-transparent pointer-events-none z-30" />
      </div>

      {/* ── INITIAL HINT: Scroll To Explore (Positioned comfortably at bottom) ── */}

      {/* ── CINEMATIC REVEAL TITLE (Appears as trees part open) ── */}
      <div
        ref={textRevealRef}
        className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none text-center px-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 backdrop-blur-md text-blue-200 text-xs font-mono tracking-widest uppercase mb-4 shadow-xl">
          <Compass className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />
          <span>The Journey</span>
        </div>

        <h2
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] uppercase"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Nama Kamu
        </h2>

        <p className="mt-3 text-sm sm:text-base md:text-lg text-blue-100/90 font-light max-w-lg drop-shadow-md">
          A world where logic meets creativity under the boundless mountain sky.
        </p>
      </div>
    </section>
  );
}

export default memo(ParallaxForestSection);
