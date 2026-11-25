import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { Github, Linkedin, Instagram, ExternalLink, ArrowRight, ChevronDown } from "lucide-react";
import SpotifyCard from "./spotify-card";

/* ── Constants ── */
const TYPING_SPEED = 100;
const ERASING_SPEED = 50;
const PAUSE_DURATION = 2000;

const SOCIAL_LINKS = [
  {
    icon: Github,
    link: "https://github.com/username",
    label: "GitHub",
  },
  {
    icon: Linkedin,
    link: "https://www.linkedin.com/in/username",
    label: "LinkedIn",
  },
  {
    icon: Instagram,
    link: "https://www.instagram.com/username",
    label: "Instagram",
  },
];

/* ── Sub-components ── */

const HeroTitle = memo(() => (
  <div className="space-y-1">
    <div
      className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-none tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
      style={{ fontFamily: "var(--font-display)" }}
    >
      Turning Ideas
    </div>
    <div
      className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-none tracking-tight text-blue-400 drop-shadow-[0_4px_20px_rgba(37,99,235,0.6)]"
      style={{ fontFamily: "var(--font-display)" }}
    >
      Into Reality
    </div>
  </div>
));

const TypeWriter = memo(() => {
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  const handleTyping = useCallback(() => {
    if (isTyping) {
      if (charIndex < WORDS[wordIndex].length) {
        setText((prev) => prev + WORDS[wordIndex][charIndex]);
        setCharIndex((prev) => prev + 1);
      } else {
        setTimeout(() => setIsTyping(false), PAUSE_DURATION);
      }
    } else {
      if (charIndex > 0) {
        setText((prev) => prev.slice(0, -1));
        setCharIndex((prev) => prev - 1);
      } else {
        setWordIndex((prev) => (prev + 1) % WORDS.length);
        setIsTyping(true);
      }
    }
  }, [charIndex, isTyping, wordIndex]);

  useEffect(() => {
    const timeout = setTimeout(
      handleTyping,
      isTyping ? TYPING_SPEED : ERASING_SPEED
    );
    return () => clearTimeout(timeout);
  }, [handleTyping]);

  return (
    <div className="h-8 flex items-center">
      <span className="text-lg md:text-xl text-blue-200 font-light tracking-wide drop-shadow-md">
        {text}
      </span>
      <span
        className="w-[2px] h-5 ml-1 rounded-full bg-[#2c67ed]"
        style={{ animation: "blink 1s step-end infinite" }}
      />
    </div>
  );
});

const CTAButton = memo(({ href, text, icon: Icon, variant = "primary" }) => {
  const isPrimary = variant === "primary";
  return (
    <a href={href}>
      <button
        className={`group relative flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 backdrop-blur-md shadow-lg ${
          isPrimary
            ? "bg-[#2c67ed] text-white hover:bg-[#1d4ed8] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:scale-[1.03]"
            : "border border-white/20 bg-black/40 text-blue-100 hover:border-blue-400 hover:bg-blue-500/10 hover:scale-[1.03]"
        }`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        <span>{text}</span>
        <Icon
          className={`w-4 h-4 transition-transform duration-300 ${
            isPrimary
              ? "group-hover:translate-x-0.5"
              : "group-hover:rotate-45"
          }`}
        />
      </button>
    </a>
  );
});

const SocialLink = memo(({ icon: Icon, link, label }) => (
  <a href={link} target="_blank" rel="noopener noreferrer" aria-label={label}>
    <button
      className="group p-2.5 rounded-xl border border-white/15 bg-black/40 backdrop-blur-md hover:border-blue-500/50 hover:bg-blue-600/20 transition-all duration-300 shadow-md"
      aria-label={label}
    >
      <Icon className="w-5 h-5 text-blue-300 group-hover:text-white transition-colors" />
    </button>
  </a>
));

export default function ParallaxForestHero() {
  const containerRef = useRef(null);
  const skyRef = useRef(null);
  const mountainRef = useRef(null);
  const personRef = useRef(null);
  const forestRef = useRef(null);
  const introHintRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis for buttery-smooth momentum scroll
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
      // Pinned timeline for the parallax zoom experience
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=220%", // 2.2x scroll distance for smooth cinematic pacing
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      // 1. Initial hint ("Scroll to Explore") fades out immediately
      tl.to(
        introHintRef.current,
        {
          opacity: 0,
          y: -30,
          ease: "power1.out",
          duration: 0.2,
        },
        0
      );

      // 2. The Forest Canopy (hutan.svg) Zooms in dramatically to reveal the inner landscape
      tl.to(
        forestRef.current,
        {
          scale: 4.8,
          opacity: 0,
          ease: "power2.inOut",
          duration: 0.65,
        },
        0
      );

      // 3. Person (img30.svg) parallax movement & scale
      tl.to(
        personRef.current,
        {
          scale: 1.15,
          yPercent: -6,
          ease: "none",
          duration: 1,
        },
        0
      );

      // 4. Mountain (img20.svg) parallax
      tl.to(
        mountainRef.current,
        {
          scale: 1.08,
          yPercent: -12,
          ease: "none",
          duration: 1,
        },
        0
      );

      // 5. Sky & Moon (img10.svg) distant parallax
      tl.to(
        skyRef.current,
        {
          scale: 1.04,
          yPercent: -16,
          ease: "none",
          duration: 1,
        },
        0
      );

      // 6. Home content (HeroTitle, Typewriter, CTA, Spotify) reveals as forest opens
      tl.fromTo(
        contentRef.current,
        {
          opacity: 0,
          y: 60,
          pointerEvents: "none",
        },
        {
          opacity: 1,
          y: 0,
          pointerEvents: "auto",
          ease: "power2.out",
          duration: 0.45,
        },
        0.35 // starts appearing at 35% of the scroll timeline
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
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden select-none bg-[#030712]"
      id="Home"
    >
      {/* ── PARALLAX LAYERS CONTAINER ── */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        
        {/* Layer 1 (Back): img10.svg — Sky, Moon, and Stars */}
        <div
          ref={skyRef}
          className="absolute inset-0 w-full h-full will-change-transform"
        >
          <img
            src={`${import.meta.env.BASE_URL}img10.svg`}
            alt="Sky and Moon"
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
        </div>

        {/* Layer 2 (Mid-Back): img20.svg — Snowy Mountain Peak */}
        <div
          ref={mountainRef}
          className="absolute inset-0 w-full h-full will-change-transform z-10"
        >
          <img
            src={`${import.meta.env.BASE_URL}img20.svg`}
            alt="Mountain"
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
        </div>

        {/* Layer 3 (Mid-Front): img30.svg — Person on Ground Ridge */}
        <div
          ref={personRef}
          className="absolute inset-0 w-full h-full will-change-transform z-20"
        >
          <img
            src={`${import.meta.env.BASE_URL}img30.svg`}
            alt="Character standing on ridge"
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
        </div>

        {/* Layer 4 (Front Canopy): hutan.svg — Forest Tree Frame */}
        <div
          ref={forestRef}
          className="absolute inset-0 w-full h-full will-change-transform z-40 origin-[50%_50%] pointer-events-none"
        >
          <img
            src={`${import.meta.env.BASE_URL}hutan.svg`}
            alt="Forest Canopy Frame"
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
        </div>

        {/* Subtle Bottom Vignette Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050510] via-[#050510]/60 to-transparent pointer-events-none z-30" />
      </div>

      {/* ── INITIAL HINT: Scroll To Explore (Visible at start) ── */}
      <div
        ref={introHintRef}
        className="absolute bottom-10 inset-x-0 flex flex-col items-center justify-center z-50 pointer-events-none text-white/80"
      >
        <span className="text-xs uppercase tracking-[0.3em] font-medium mb-2 drop-shadow-md">
          Scroll To Enter
        </span>
        <div className="w-6 h-10 rounded-full border-2 border-white/40 flex justify-center pt-2">
          <div className="w-1.5 h-2.5 bg-white rounded-full animate-bounce" />
        </div>
      </div>

      {/* ── HOME SECTION CONTENT OVERLAY (Reveals as forest opens) ── */}
      <div
        ref={contentRef}
        className="absolute inset-0 z-30 flex items-center justify-center px-[5%] sm:px-[5%] lg:px-[10%] pt-20"
      >
        <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 w-full">
          
          {/* Left Column: Hero Text */}
          <div className="w-full lg:w-1/2 space-y-6 text-left p-6 sm:p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
            <HeroTitle />
            <TypeWriter />

            <p
              className="text-sm sm:text-base md:text-lg max-w-xl leading-relaxed font-light text-zinc-300 drop-shadow-sm"
            >
              Dimulai dari rasa penasaran, berkembang menjadi passion.
              Aku membangun pengalaman digital yang tidak hanya terlihat bagus,
              tapi juga terasa bermakna bagi penggunanya.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <CTAButton
                href="#Portofolio"
                text="Explore Project"
                icon={ExternalLink}
                variant="primary"
              />
              <CTAButton
                href="#Contact"
                text="Contact Me"
                icon={ArrowRight}
                variant="secondary"
              />
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-blue-400 font-mono tracking-widest uppercase mr-1">
                Find me:
              </span>
              {SOCIAL_LINKS.map((s, i) => (
                <SocialLink key={i} {...s} />
              ))}
            </div>
          </div>

          {/* Right Column: Spotify Player */}
          <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-end">
            <SpotifyCard className="relative z-10 shadow-2xl" />
          </div>

        </div>
      </div>
    </div>
  );
}
