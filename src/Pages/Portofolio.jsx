"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { supabase } from "../supabase";
import CardProject from "../components/CardProject";
import Certificate from "../components/Certificate";
import { Code, Award, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import GlyphPortal from "../components/ui/glyph-portal";
import TopographyBackground from "../components/ui/backgrounds-topography";

/* ── Fallback Data with Real Working Assets ── */
const FALLBACK_PROJECTS = [
  {
    id: 1,
    title: "Contoh Project 1",
    description: "Ini adalah data contoh. Tambahkan project aslimu lewat halaman Dashboard (/dashboard).",
    link: "#",
    img: "/placeholder-project.svg",
  },
  {
    id: 2,
    title: "Contoh Project 2",
    description: "Ini adalah data contoh. Tambahkan project aslimu lewat halaman Dashboard (/dashboard).",
    link: "#",
    img: "/placeholder-project.svg",
  },
  {
    id: 3,
    title: "Contoh Project 3",
    description: "Ini adalah data contoh. Tambahkan project aslimu lewat halaman Dashboard (/dashboard).",
    link: "#",
    img: "/placeholder-project.svg",
  },
  {
    id: 4,
    title: "Contoh Project 4",
    description: "Ini adalah data contoh. Tambahkan project aslimu lewat halaman Dashboard (/dashboard).",
    link: "#",
    img: "/placeholder-project.svg",
  },
];

const FALLBACK_CERTS = [
  { id: 1, title: "Contoh Sertifikat 1", img: "/placeholder-certificate.svg" },
  { id: 2, title: "Contoh Sertifikat 2", img: "/placeholder-certificate.svg" },
  { id: 3, title: "Contoh Sertifikat 3", img: "/placeholder-certificate.svg" },
  { id: 4, title: "Contoh Sertifikat 4", img: "/placeholder-certificate.svg" },
];

const FALLBACK_AWARDS = [
  { id: 1, title: "Contoh Prestasi 1", img: "/placeholder-certificate.svg" },
  { id: 2, title: "Contoh Prestasi 2", img: "/placeholder-certificate.svg" },
  { id: 3, title: "Contoh Prestasi 3", img: "/placeholder-certificate.svg" },
];

/* ── Tab definitions ── */
const TABS = [
  { label: "Projects",     icon: Code },
  { label: "Certificates", icon: Award },
  { label: "Awards",       icon: Trophy },
];

export default function FullWidthTabs({ children }) {
  const [value, setValue] = useState(0);
  const [projects, setProjects] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [awards, setAwards] = useState([]);
  const [scrollRange, setScrollRange] = useState(0);
  const [portalEntered, setPortalEntered] = useState(false);

  const handlePortalProgress = useCallback((p) => {
    setPortalEntered((prev) => (p >= 0.84 ? true : p < 0.8 ? false : prev));
  }, []);

  const targetRef = useRef(null);
  const trackRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [projectsResponse, certificatesResponse] = await Promise.all([
        supabase.from("projects").select("*").order("id", { ascending: false }),
        supabase.from("certificates").select("*").order("id", { ascending: false }),
      ]);

      const projectData = projectsResponse.data || [];
      const allCertData = certificatesResponse.data || [];
      const certData = allCertData.filter((c) => c.category === "keahlian");
      const awardData = allCertData.filter((c) => c.category === "prestasi");

      if (projectData.length > 0) {
        setProjects(projectData);
        localStorage.setItem("projects", JSON.stringify(projectData));
      }
      if (allCertData.length > 0) {
        setCertificates(certData);
        setAwards(awardData);
        localStorage.setItem("certificates", JSON.stringify(allCertData));
      }
    } catch (error) {
      console.error("Error fetching data from Supabase:", error?.message);
    }
  }, []);

  useEffect(() => {
    const cachedProjects = localStorage.getItem("projects");
    const cachedCertificates = localStorage.getItem("certificates");
    if (cachedProjects) {
      try { setProjects(JSON.parse(cachedProjects)); } catch (e) {}
    }
    if (cachedCertificates) {
      try {
        const allCerts = JSON.parse(cachedCertificates);
        setCertificates(allCerts.filter((c) => c.category === "keahlian"));
        setAwards(allCerts.filter((c) => c.category === "prestasi"));
      } catch (e) {}
    }
    fetchData();
  }, [fetchData]);

  // Active items based on current tab
  const activeProjects = useMemo(() => (projects.length > 0 ? projects : FALLBACK_PROJECTS), [projects]);
  const activeCertificates = useMemo(() => (certificates.length > 0 ? certificates : FALLBACK_CERTS), [certificates]);
  const activeAwards = useMemo(() => (awards.length > 0 ? awards : FALLBACK_AWARDS), [awards]);

  const currentList = useMemo(() => {
    if (value === 0) return activeProjects;
    if (value === 1) return activeCertificates;
    if (value === 2) return activeAwards;
    return [];
  }, [value, activeProjects, activeCertificates, activeAwards]);

  // Recalculate horizontal scroll range dynamically whenever tab or items change
  useEffect(() => {
    if (!trackRef.current) {
      setScrollRange(0);
      return;
    }

    const calculateRange = () => {
      if (trackRef.current) {
        const trackW = trackRef.current.scrollWidth;
        const viewW = window.innerWidth;
        const endMargin = viewW >= 768 ? viewW * 0.1 : viewW * 0.05;
        const range = Math.max(0, trackW - viewW + endMargin);
        setScrollRange(range);
      }
    };

    calculateRange();
    const ro = new ResizeObserver(calculateRange);
    ro.observe(trackRef.current);
    window.addEventListener("resize", calculateRange);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", calculateRange);
    };
  }, [value, currentList.length]);

  // Framer motion scroll tracking inside the pinned container
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    damping: 38,
    stiffness: 320,
    mass: 0.2,
  });

  // Top-level hook declarations (STRICT: Never call hooks conditionally!)
  const x = useTransform(smoothProgress, [0.04, 0.96], [0, -Math.max(1, scrollRange)]);
  const progressScale = useTransform(smoothProgress, [0.04, 0.96], [0, 1]);

  // Instant Reset Function: Resets vertical pin position & horizontal spring to 0
  const resetToStart = useCallback(() => {
    smoothProgress.jump(0);
    if (targetRef.current) {
      const top = targetRef.current.getBoundingClientRect().top + window.scrollY;
      if (window.lenis) {
        window.lenis.scrollTo(top, { immediate: true });
      } else {
        window.scrollTo({ top, behavior: "instant" });
      }
    }
  }, [smoothProgress]);

  // Handle switching tabs
  const handleTabChange = useCallback((index) => {
    setValue(index);
    resetToStart();
  }, [resetToStart]);

  // Listen for custom event to change tab from About.jsx (Folder cards)
  useEffect(() => {
    const handleExternalTabChange = (e) => {
      if (e.detail && typeof e.detail.tabIndex === "number") {
        setValue(e.detail.tabIndex);
        setTimeout(() => {
          resetToStart();
        }, 15);
      }
    };
    window.addEventListener("changeTab", handleExternalTabChange);
    return () => window.removeEventListener("changeTab", handleExternalTabChange);
  }, [resetToStart]);

  // Step card by clicking arrows (Prominent, large buttons: 56px)
  const scrollByCard = (dir) => {
    if (!targetRef.current || scrollRange <= 0) return;
    const cardWidth = window.innerWidth >= 768 ? 470 : 340;
    const totalDistance = Math.round(scrollRange * 1.15);
    const stepY = (cardWidth / scrollRange) * totalDistance;
    if (window.lenis) {
      window.lenis.scrollTo(window.scrollY + dir * stepY, { duration: 0.5 });
    } else {
      window.scrollBy({ top: dir * stepY, behavior: "smooth" });
    }
  };

  // Height of outer container: dictates the vertical scroll distance required to traverse all cards
  const containerHeight =
    scrollRange > 0
      ? `calc(100vh + ${Math.round(scrollRange * 1.05)}px)`
      : "calc(100vh + 1200px)";

  return (
    <GlyphPortal
      id="Portofolio"
      word="PORTOFOLIO"
      scrollLength={1.7}
      fontFamily='"Arial Black", "Arial", sans-serif'
      fontWeight={900}
      interactive={true}
      onProgress={handlePortalProgress}
      backdrop={
        <div className="relative w-full h-full pointer-events-none">
          <TopographyBackground
            className="h-full w-full bg-[#030712]"
            lineColor="#64748b"
            lineOpacity={0.38}
            levels={12}
            speed={0.45}
            paused={portalEntered}
          />
          <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#030712] via-[#030712]/90 to-transparent pointer-events-none" />
        </div>
      }
      style={{
        "--gp-paper": "#030712",
        "--gp-ink": "#ffffff",
        "--gp-field": "#fafafa",
        "--gp-foreground": "#09090b",
      }}
    >
      {/* ── Unified Light Topography Surface (Showcase + Photo Gallery + Contact + Footer) ── */}
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-0 overflow-clip z-0" aria-hidden="true">
          <div className="sticky top-0 h-screen w-full">
            <TopographyBackground
              className="h-full w-full bg-[#fafafa]"
              lineColor="#a1a1aa"
              lineOpacity={0.55}
              levels={14}
              speed={0.8}
            />
          </div>
        </div>

        {/* ── The Velocity Scroll Gallery (Light Topography Theme) ── */}
        <div
          ref={targetRef}
          id="Portofolio-Gallery"
          className="relative z-10 w-full bg-transparent text-zinc-900"
          style={{ height: containerHeight }}
        >
          {/* Pinned Sticky Viewport — overflow-x-clip prevents horizontal overflow without slicing bottom card shadows */}
          <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-x-clip bg-transparent z-10">
            {/* ── Top Header & Tab Bar (Crisp contrast on Light Background) ── */}
          <div className="w-full px-[5%] md:px-[10%] pt-14 sm:pt-18 pb-2 z-20 flex-shrink-0">
            <div className="text-center pb-3">
              <h2
                className="section-label text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "#09090b" }}
              >
                Portofolio
              </h2>
            </div>

            {/* Tab Bar — Floating white surface with multi-layer soft elevation shadow */}
            <div className="relative flex rounded-2xl w-full max-w-3xl mx-auto bg-white p-2 soft-tabbar-shadow">
              {TABS.map(({ label, icon: Icon }, i) => (
                <button
                  key={label}
                  onClick={() => handleTabChange(i)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1.5 px-3 py-3 md:py-3.5 text-xs sm:text-sm md:text-[0.95rem] font-semibold rounded-xl mx-0.5 transition-[transform,background-color,color,box-shadow] duration-200 cursor-pointer
                    ${value === i
                      ? "text-white shadow-[0_8px_18px_rgba(44,103,237,0.28),0_2px_6px_rgba(44,103,237,0.16)]"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80"
                    }`}
                  style={
                    value === i
                      ? { background: "#2c67ed", fontFamily: "var(--font-display)" }
                      : { fontFamily: "var(--font-display)" }
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Center: Horizontal Velocity Scroll Gallery ── */}
          <div className="w-full overflow-visible flex-1 flex items-center relative z-10 my-auto">
            {/* ── PROMINENT ARROW CONTROLS ── */}
            {scrollRange > 0 && (
              <>
                <button
                  onClick={() => scrollByCard(-1)}
                  className="hidden lg:flex absolute left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full items-center justify-center text-white shadow-md hover:bg-[#1d4ed8] transition-[transform,background-color] duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                  style={{ background: "#2c67ed" }}
                  aria-label="Previous card"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
                </button>

                <button
                  onClick={() => scrollByCard(1)}
                  className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full items-center justify-center text-white shadow-md hover:bg-[#1d4ed8] transition-[transform,background-color] duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                  style={{ background: "#2c67ed" }}
                  aria-label="Next card"
                >
                  <ChevronRight className="w-6 h-6 stroke-[2.5]" />
                </button>
              </>
            )}

            {/* ── Tab 0: Projects (Horizontal Velocity Scroll) ── */}
            {value === 0 && (
              <motion.div
                ref={trackRef}
                className="flex items-stretch gap-8 px-[5%] md:px-[10%] py-8 flex-nowrap w-max will-change-transform"
                style={{ x }}
              >
                {activeProjects.map((project, index) => (
                  <div
                    key={project.id || index}
                    className="w-[320px] sm:w-[380px] md:w-[440px] lg:w-[470px] flex-shrink-0 transition-transform duration-300 hover:-translate-y-1"
                  >
                    <CardProject
                      Img={project.img || ""}
                      Title={project.title || ""}
                      Description={project.description || ""}
                      Link={project.link || ""}
                      id={project.id}
                    />
                  </div>
                ))}
              </motion.div>
            )}

            {/* ── Tab 1: Certificates (Horizontal Velocity Scroll) ── */}
            {value === 1 && (
              <motion.div
                ref={trackRef}
                className="flex items-stretch gap-8 px-[5%] md:px-[10%] py-8 flex-nowrap w-max will-change-transform"
                style={{ x }}
              >
                {activeCertificates.map((cert, index) => (
                  <div
                    key={cert.id || index}
                    className="w-[310px] sm:w-[380px] md:w-[440px] lg:w-[470px] flex-shrink-0 flex flex-col justify-between rounded-2xl bg-white p-4 soft-card-shadow hover:-translate-y-1"
                  >
                    <Certificate ImgSertif={cert.img} />
                    {cert.title && (
                      <div className="pt-3.5 pb-1 px-1">
                        <p className="text-sm md:text-base font-bold text-zinc-900 truncate" style={{ fontFamily: "var(--font-display)" }}>
                          {cert.title}
                        </p>
                        <p className="text-xs text-[#2c67ed] mt-0.5 font-semibold">Validated Skill</p>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {/* ── Tab 2: Awards (Horizontal Velocity Scroll) ── */}
            {value === 2 && (
              <motion.div
                ref={trackRef}
                className="flex items-stretch gap-8 px-[5%] md:px-[10%] py-8 flex-nowrap w-max will-change-transform"
                style={{ x }}
              >
                {activeAwards.map((award, index) => (
                  <div
                    key={award.id || index}
                    className="w-[310px] sm:w-[380px] md:w-[440px] lg:w-[470px] flex-shrink-0 flex flex-col justify-between rounded-2xl bg-white p-4 soft-card-shadow hover:-translate-y-1"
                  >
                    <Certificate ImgSertif={award.img} />
                    {award.title && (
                      <div className="pt-3.5 pb-1 px-1">
                        <p className="text-sm md:text-base font-bold text-zinc-900 truncate" style={{ fontFamily: "var(--font-display)" }}>
                          {award.title}
                        </p>
                        <p className="text-xs text-[#2c67ed] mt-0.5 font-semibold">Achievement Award</p>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* ── Bottom: Progress Bar & Hint (Sentence case, high contrast, GPU scaleX) ── */}
          
        </div>
      </div>

        {/* FIX: pointer-events-none supaya pembungkus children (galeri, kontak, footer) tidak menutupi klik pada kartu project.
            Contact & Footer diaktifkan kembali lewat pointer-events-auto di App.jsx. */}
        {children && <div className="relative z-10 pointer-events-none">{children}</div>}
      </div>
    </GlyphPortal>
  );
}