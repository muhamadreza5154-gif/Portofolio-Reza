import React, { useEffect, useRef, memo } from "react";
import { Helmet } from "react-helmet-async";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

const Home = () => {
  const containerRef = useRef(null);
  const visualsRef = useRef(null);
  const skyRef = useRef(null);
  const mountainRef = useRef(null);
  const titleRef = useRef(null);
  const forestRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis for smooth scrolling with protection for nested scrollable cards
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      prevent: (node) => {
        return (
          node?.hasAttribute?.("data-lenis-prevent") ||
          Boolean(node?.closest?.("[data-lenis-prevent]")) ||
          node?.classList?.contains("overflow-y-auto") ||
          Boolean(node?.closest?.(".overflow-y-auto"))
        );
      },
    });

    window.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tickerCallback = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      // Timeline scrubs across 225vh scroll distance (optimized length: not too long, not too short)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      /* ══════════════════════════════════════════════════════════
         STAGE 1 (Progress 0.0 → 0.22):
         ONLY the forest canopy (hutan.svg) zooms outward & vanishes!
         The mountain, sky, and text stay COMPLETELY STILL.
         Text remains hidden until the forest completely clears.
         ══════════════════════════════════════════════════════════ */

      // The Forest Trees (hutan.svg) zoom outward from center and vanish
      tl.to(
        forestRef.current,
        {
          scale: 4.6,
          opacity: 0,
          ease: "power2.inOut",
          duration: 0.22,
        },
        0
      );
      tl.set(forestRef.current, { display: "none" }, 0.22);

      /* ══════════════════════════════════════════════════════════
         STAGE 2 (Progress 0.22 → 1.0):
         PARALLAX SCROLL
         - Welcome Title reveals smoothly and moves in middle ground
         - Layer 1 (Sky): Drifts up slowly (-15%)
         - Layer 2 (Mountain): Climbs UPWARDS (-32%)
         - Layer 3 (Title): Rises in middle ground in front of mountain (-50%)
         (Layer 4 / person & ground ridge has been removed)
         ══════════════════════════════════════════════════════════ */

      // Title fades in cleanly AFTER the forest has parted
      tl.fromTo(
        titleRef.current,
        {
          opacity: 0,
          scale: 0.94,
          y: 25,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          ease: "power2.out",
          duration: 0.12,
        },
        0.22
      );

      // Layer 1 (Sky & Moon): Gentle deep upward drift
      tl.to(
        skyRef.current,
        {
          yPercent: -15,
          ease: "none",
          duration: 0.78,
        },
        0.22
      );

      // Layer 2 (Mountain): Rises UPWARDS, climbing over the sky & moon
      tl.to(
        mountainRef.current,
        {
          yPercent: -32,
          scale: 1.06,
          ease: "none",
          duration: 0.78,
        },
        0.22
      );

      // Layer 3 (Title Text): Rises upwards in middle ground IN FRONT OF MOUNTAIN
      tl.to(
        titleRef.current,
        {
          yPercent: -50,
          ease: "none",
          duration: 0.78,
        },
        0.22
      );

      // Title fades out as the hero carries over into About Me
      tl.to(
        titleRef.current,
        {
          opacity: 0,
          ease: "power1.in",
          duration: 0.12,
        },
        0.82
      );

      // Hide heavy full-screen SVG layers once Hero is 100% scrolled above viewport
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          if (visualsRef.current) {
            visualsRef.current.style.visibility = self.isActive ? "visible" : "hidden";
          }
        },
      });
    }, containerRef);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      window.lenis = null;
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Muhamad Reza | Portofolio</title>
        <meta
          name="description"
          content="Website resmi Muhamad Reza. Aku berfokus pada pengembangan teknologi yang tidak hanya fungsional, tetapi juga menghadirkan pengalaman digital yang menarik dan berdampak."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://domain-kamu.vercel.app" />
        <meta property="og:title" content="Muhamad Reza | Portofolio" />
        <meta property="og:description" content="Website resmi dan portofolio Nama Kamu." />
        <meta property="og:url" content="https://domain-kamu.vercel.app" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Muhamad Reza",
            "url": "https://domain-kamu.vercel.app",
            "sameAs": [
              "https://github.com/username",
              "https://www.linkedin.com/in/username",
              "https://www.instagram.com/username"
            ]
          }
        `}</script>
      </Helmet>

      {/* ── CINEMATIC OSMO PARALLAX HERO SECTION (Balanced 225vh Scroll) ── */}
      <section
        ref={containerRef}
        className="parallax relative w-full h-[225vh] bg-[#030712]"
        id="Home"
      >
        {/* Sticky 100vh Viewport Window */}
        <div ref={visualsRef} className="parallax__visuals sticky top-0 w-full h-screen overflow-clip select-none">
          
          {/* Multi-depth Parallax Layer Stack */}
          <div data-parallax-layers className="parallax__layers absolute inset-0 w-full h-full overflow-clip">
            
            {/* ── LAYER 1 (Back): img10.svg — Sky, Moon, and Stars ── */}
            <div
              ref={skyRef}
              data-parallax-layer="1"
              className="absolute inset-0 w-full h-full will-change-transform z-[0]"
              style={{ transformOrigin: "center bottom" }}
            >
              <img
                src="/img10.svg"
                alt="Sky and Moon"
                className="w-full h-full object-cover"
                style={{ objectPosition: "center 22%" }}
                loading="eager"
                decoding="async"
              />
            </div>

            {/* ── LAYER 2 (Mid-Back): img20.svg — Snowy Mountain Peak ── */}
            <div
              ref={mountainRef}
              data-parallax-layer="2"
              className="absolute inset-0 w-full h-full will-change-transform z-[10]"
              style={{ transformOrigin: "center bottom" }}
            >
              <img
                src="/img20.svg"
                alt="Mountain Peak"
                className="w-full h-full object-cover"
                style={{ objectPosition: "center 52%" }}
                loading="eager"
                decoding="async"
              />
              <div className="absolute inset-x-0 top-full h-[40vh] bg-[#030712] pointer-events-none" />
            </div>

            {/* ── LAYER 3 (Middle Ground Text): "Welcome To My Portofolio" (Clean sharp typography, NO shadow) ── */}
            <div
              ref={titleRef}
              data-parallax-layer="3"
              className="parallax__layer-title absolute inset-0 flex flex-col items-center justify-center z-[20] pointer-events-none px-4 select-none opacity-0 will-change-[transform,opacity]"
              style={{ transformOrigin: "center center" }}
            >
              <div className="w-full max-w-5xl mx-auto text-center -translate-y-6 sm:-translate-y-12">
                <h1
                  className="parallax__title text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-white uppercase leading-[1.08] select-none"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <span className="block">WELCOME TO MY</span>
                  <span className="block mt-1">PORTOFOLIO</span>
                </h1>
              </div>
            </div>

            {/* LAYER 4 (person on ground ridge, img30.svg) dihapus sesuai permintaan */}

            {/* ── LAYER 5 (Stage 1 Canopy Portal): hutan.svg — Forest Tree Frame ── */}
            <div
              ref={forestRef}
              className="absolute inset-0 w-full h-full will-change-transform z-[40] pointer-events-none"
              style={{ transformOrigin: "center 42%" }}
            >
              <img
                src="/hutan.svg"
                alt="Forest Canopy Frame"
                className="w-full h-full object-cover object-bottom"
                loading="eager"
              />
            </div>

            {/* Seamless Base Blend (.parallax__fade into About Me) */}
            <div className="parallax__fade absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent pointer-events-none z-[35]" />
          </div>
        </div>
      </section>
    </>
  );
};

export default memo(Home);