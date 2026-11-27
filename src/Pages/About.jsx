import React, { useEffect, memo, useMemo, useState, useCallback, useRef } from "react"
import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion"
import { FileText, Code } from "lucide-react"
import AOS from "aos"
import GlassFolder from "../components/ui/glass-folder-cards"
import TopographyBackground from "../components/ui/backgrounds-topography"
import { supabase } from "../supabase"

const Header = memo(() => (
  <div className="text-center lg:mb-10 mb-8 px-[5%]">
    <div data-aos="fade-up" data-aos-duration="600">
      <h2
        className="section-label mx-auto"
        style={{ fontFamily: "var(--font-display)" }}
      >
        About Me
      </h2>
    </div>
  </div>
))

const ProfileImage = memo(() => {
  const [isHoveringImg, setIsHoveringImg] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const [hintDone, setHintDone] = useState(false)
  const containerRef = useRef(null)
  const rectRef = useRef(null)
  const cursorX = useMotionValue(-1000)
  const cursorY = useMotionValue(-1000)
  const springConfig = { damping: 25, stiffness: 250, mass: 0.5 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)
  const maskImage = useMotionTemplate`radial-gradient(circle 115px at ${cursorXSpring}px ${cursorYSpring}px, black 58%, transparent 100%)`

  const handleMouseEnter = useCallback((e) => {
    rectRef.current = e.currentTarget.getBoundingClientRect()
    setIsHoveringImg(true)
    setHintDone(true)
  }, [])

  const handleMouseMove = useCallback((e) => {
    const rect = rectRef.current || (rectRef.current = e.currentTarget.getBoundingClientRect())
    cursorX.set(e.clientX - rect.left)
    cursorY.set(e.clientY - rect.top)
  }, [cursorX, cursorY])

  const handleMouseLeave = useCallback(() => {
    rectRef.current = null
    setIsHoveringImg(false)
    cursorX.set(-1000)
    cursorY.set(-1000)
  }, [cursorX, cursorY])

  // Detect touch device — hide cursor dot on touch screens
  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(hover: none)').matches)
  }, [])

  // Trigger a single lightweight CSS hint once on first view, and reset hover off-screen
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true)
        } else {
          rectRef.current = null
          setIsHoveringImg(false)
          cursorX.set(-1000)
          cursorY.set(-1000)
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [cursorX, cursorY])

  return (
    <div ref={containerRef} className="flex justify-center items-center w-full max-w-md mx-auto lg:max-w-none">
      <div className="relative group flex-shrink-0" data-aos="fade-up" data-aos-duration="1000">
        <div
          className="relative z-10"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, black 75%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, black 75%, transparent 100%)",
            isolation: "isolate",
          }}
        >
          <div
            className="w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] lg:w-[700px] lg:h-[700px] cursor-none relative"
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={`${import.meta.env.BASE_URL}foto saya.png`}
              alt="Profile"
              decoding="async"
              className="absolute inset-0 w-full h-full object-contain object-bottom pointer-events-none"
              loading="lazy"
            />

            {hasEntered && !hintDone && !isHoveringImg && (
              <div
                className="absolute inset-0 pointer-events-none z-10 animate-spiderman-hint"
                onAnimationEnd={() => setHintDone(true)}
              >
                <img src={`${import.meta.env.BASE_URL}saya spiderman.webp`} alt="Hint" decoding="async" className="w-full h-full object-contain object-bottom" />
              </div>
            )}

            {isHoveringImg && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-10"
                style={{ WebkitMaskImage: maskImage, maskImage, WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" }}
              >
                <img src={`${import.meta.env.BASE_URL}saya spiderman.webp`} alt="Reveal" decoding="async" className="w-full h-full object-contain object-bottom" />
              </motion.div>
            )}

            {!isTouchDevice && isHoveringImg && (
              <motion.div
                className="absolute left-0 top-0 w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-full pointer-events-none z-50 bg-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.55)]"
                style={{ x: cursorXSpring, y: cursorYSpring }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

// Data CONTOH - tampil otomatis selama database Supabase kamu masih kosong.
// Setelah kamu menambah data lewat Dashboard (/dashboard), data ini tidak dipakai lagi.
const FALLBACK_PROJECTS = [
  { title: "Contoh Project 1", category: "Web App", img: "/placeholder-project.svg" },
  { title: "Contoh Project 2", category: "Full Stack", img: "/placeholder-project.svg" },
  { title: "Contoh Project 3", category: "UI / UX", img: "/placeholder-project.svg" },
  { title: "Contoh Project 4", category: "Mobile & Web", img: "/placeholder-project.svg" },
];

const FALLBACK_CERTS = [
  { title: "Contoh Sertifikat 1", category: "keahlian", img: "/placeholder-certificate.svg" },
  { title: "Contoh Sertifikat 2", category: "keahlian", img: "/placeholder-certificate.svg" },
  { title: "Contoh Sertifikat 3", category: "keahlian", img: "/placeholder-certificate.svg" },
  { title: "Contoh Sertifikat 4", category: "keahlian", img: "/placeholder-certificate.svg" },
];

const FALLBACK_AWARDS = [
  { title: "Contoh Prestasi 1", category: "prestasi", img: "/placeholder-certificate.svg" },
  { title: "Contoh Prestasi 2", category: "prestasi", img: "/placeholder-certificate.svg" },
  { title: "Contoh Prestasi 3", category: "prestasi", img: "/placeholder-certificate.svg" },
  { title: "Contoh Prestasi 4", category: "prestasi", img: "/placeholder-certificate.svg" },
];

// GANTI dengan riwayat pendidikanmu. "logo" boleh dikosongkan ("") atau isi
// path gambar di folder public, contoh: "/logo-kampus.png"
const EDUCATION_DATA = [
  {
    id: "edu-1",
    school: "Bina Sarana Informatika",
    degree: "Sistem Informasi",
    faculty: "Teknik Informatika",
    year: "2023 - Sekarang",
    tag: "S1",
    logo: "/logo-bsi.png",
  },
  {
    id: "edu-2",
    school: "Man 8 Jakarta",
    degree: "IPS",
    faculty: "Sekolah Menengah",
    year: "2020 - 2023",
    tag: "SMA",
    logo: "/man 8 jakarta.png",
  },
];

// Data CONTOH pengalaman - tampil selama tabel "experiences" masih kosong.
const FALLBACK_EXPERIENCES = [
  {
    id: "exp-1",
    company: "Suku Dinas KOMINFOTIK KABUPATEN ADMINISTRASI KEPUALAUN SERIBU",
    role: "Front-End Developer",
    year: "2026",
    subtitle: "Kota",
    tag: "Internship",
    logo:"/logo-kominfotik.png",
  },
  {
    id: "exp-2",
    company: "UI/UX Design for a Septic Tank Pumping Service App",
    role: "Web Full Stack Developer",
    year: "2024",
    subtitle: "Kampus",
    tag: "Community",
    logo: "/figma.png",
  },
  {
    id: "exp-3",
    company: "Web-Based Payroll System",
    role: "Web Full Stack Developer",
    year: "2024",
    subtitle: "Kampus",
    tag: "Community",
    logo: "/logo-bsi.png",
  },
];



const CompanyLogoBadge = memo(({ logo, name }) => {
  if (logo) {
    const logoUrl = /^https?:\/\//i.test(logo)
      ? logo
      : `${import.meta.env.BASE_URL}${logo.replace(/^\/+/, "")}`

    return (
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <img
          src={logoUrl}
          alt={name || "Logo"}
          width={40}
          height={40}
          loading="lazy"
          className="w-full h-full object-contain rounded-lg"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  const lower = (name || "").toLowerCase();
  if (lower.includes("google")) {
    return (
      <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center flex-shrink-0 text-sm">
        G
      </div>
    );
  }

  const initials = (name || "EX")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/15 text-zinc-300 font-bold font-mono flex items-center justify-center flex-shrink-0 text-xs tracking-tight">
      {initials}
    </div>
  );
});

const getExpMeta = (exp) => {
  if (exp.subtitle || exp.tag || exp.location || exp.type) {
    return {
      subtitle: exp.subtitle || exp.location || "",
      tag: exp.tag || exp.type || "",
    };
  }
  const r = (exp.role || "").toLowerCase();

  if (r.includes("intern")) {
    return { subtitle: "Company", tag: "Internship" };
  }
  return { subtitle: "", tag: "Experience" };
};

const AboutPage = () => {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true
  )
  const [stats, setStats] = useState({ totalProjects: 0, totalCertificates: 0, totalAwards: 0 })
  const [projectsList, setProjectsList] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("projects") || "[]")
      return stored.length > 0 ? stored : FALLBACK_PROJECTS
    } catch {
      return FALLBACK_PROJECTS
    }
  })
  const [certsList, setCertsList] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("certificates") || "[]")
      const filtered = stored.filter(c => c.category === 'keahlian')
      return filtered.length > 0 ? filtered : FALLBACK_CERTS
    } catch {
      return FALLBACK_CERTS
    }
  })
  const [awardsList, setAwardsList] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("certificates") || "[]")
      const filtered = stored.filter(c => c.category === 'prestasi')
      return filtered.length > 0 ? filtered : FALLBACK_AWARDS
    } catch {
      return FALLBACK_AWARDS
    }
  })

  useEffect(() => {
    const fetchFreshData = async () => {
      try {
        const [projRes, certRes] = await Promise.all([
          supabase.from("projects").select("*").order("id", { ascending: false }),
          supabase.from("certificates").select("*").order("id", { ascending: false }),
        ])

        const sameImgs = (a, b) =>
          a.length === b.length && a.every((item, idx) => item?.img === b[idx]?.img)

        if (projRes.data && projRes.data.length > 0) {
          setProjectsList((prev) => (sameImgs(prev, projRes.data) ? prev : projRes.data))
          localStorage.setItem("projects", JSON.stringify(projRes.data))
        }

        if (certRes.data && certRes.data.length > 0) {
          const allCerts = certRes.data
          const keahlian = allCerts.filter(c => c.category === 'keahlian')
          const prestasi = allCerts.filter(c => c.category === 'prestasi')
          setCertsList((prev) => (sameImgs(prev, keahlian) ? prev : keahlian))
          setAwardsList((prev) => (sameImgs(prev, prestasi) ? prev : prestasi))
          localStorage.setItem("certificates", JSON.stringify(allCerts))
        }

        const totalP = projRes.data?.length || projectsList.length
        const totalC = certRes.data?.filter(c => c.category === 'keahlian').length || certsList.length
        const totalA = certRes.data?.filter(c => c.category === 'prestasi').length || awardsList.length

        setStats({
          totalProjects: totalP,
          totalCertificates: totalC,
          totalAwards: totalA,
        })
      } catch (error) {
        console.error("Error fetching stats data:", error)
      }
    }

    fetchFreshData()
  }, [])

  const [experiences, setExperiences] = useState([])
  const [loadingExp, setLoadingExp] = useState(true)
  const [hoveredEduIndex, setHoveredEduIndex] = useState(null)
  const [hoveredExpIndex, setHoveredExpIndex] = useState(null)
  const experienceScrollRef = useRef(null)

  // Default active is always nomor 1 (index 0). Hovering temporarily activates another item, but leaving always returns to 0.
  const activeEduIndex = hoveredEduIndex !== null ? hoveredEduIndex : 0
  const activeExpIndex = hoveredExpIndex !== null ? hoveredExpIndex : 0

  const displayExperiences = useMemo(() => {
    return experiences && experiences.length > 0 ? experiences : FALLBACK_EXPERIENCES
  }, [experiences])


  const scrollExperienceDown = useCallback(() => {
    if (experienceScrollRef.current) {
      const el = experienceScrollRef.current
      const itemHeight = 110
      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 25
      if (isAtBottom) {
        el.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        el.scrollTo({ top: el.scrollTop + itemHeight, behavior: "smooth" })
      }
    }
  }, [])

  useEffect(() => {
    // AOS sudah diinisialisasi di App.jsx
    const fetchExperiences = async () => {
      let { data, error } = await supabase
        .from('experiences')
        .select('*')
        .order('order_index', { ascending: true, nullsFirst: false })

      if (error || !data) {
        const fallback = await supabase
          .from('experiences')
          .select('*')
          .order('created_at', { ascending: false })
        data = fallback.data || []
      }
      setExperiences(data || [])
      setLoadingExp(false)
    }

    fetchExperiences()

    const channel = supabase
      .channel('public:experiences')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'experiences' },
        () => {
          fetchExperiences()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Real Image Files for Projects, Certificates, and Awards (Clean card sheets without text overlay)
  const projectFiles = useMemo(() => {
    const list = projectsList.length > 0 ? projectsList : FALLBACK_PROJECTS
    return list.slice(0, 4).map((p, i) => ({
      name: "",
      meta: "",
      image: p.img || FALLBACK_PROJECTS[i % FALLBACK_PROJECTS.length].img,
    }))
  }, [projectsList])

  const certificateFiles = useMemo(() => {
    const list = certsList.length > 0 ? certsList : FALLBACK_CERTS
    return list.slice(0, 4).map((c, i) => ({
      name: "",
      meta: "",
      image: c.img || FALLBACK_CERTS[i % FALLBACK_CERTS.length].img,
    }))
  }, [certsList])

  const awardFiles = useMemo(() => {
    const list = awardsList.length > 0 ? awardsList : FALLBACK_AWARDS
    return list.slice(0, 4).map((a, i) => ({
      name: "",
      meta: "",
      image: a.img || FALLBACK_AWARDS[i % FALLBACK_AWARDS.length].img,
    }))
  }, [awardsList])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const onChange = (e) => setIsDesktop(e.matches)
    setIsDesktop(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      AOS.refreshHard()
    })
    return () => cancelAnimationFrame(rafId)
  }, [isDesktop])

  const scrollToPortfolio = useCallback((tabIndex) => {
    if (typeof tabIndex === "number") {
      window.dispatchEvent(new CustomEvent("changeTab", { detail: { tabIndex } }))
    }
    const el = document.getElementById("Portofolio")
    if (!el) return
    const targetTop = Math.max(0, el.getBoundingClientRect().top + window.scrollY)
    if (window.lenis) {
      window.lenis.scrollTo(targetTop, { duration: 0.9 })
    } else {
      window.scrollTo({ top: targetTop, behavior: "smooth" })
    }
  }, [])

  return (
    <div
      className="h-auto pb-[10%] text-white px-[5%] sm:px-[5%] lg:px-[10%] pt-12 sm:pt-16 bg-[#030712] relative z-10"
      id="About"
      itemScope
      itemType="https://schema.org/Person"
    >
      {/* Dark Theme Topography Background (Sticky 100vh for lightweight GPU footprint) */}
      <div className="pointer-events-none absolute inset-0 overflow-clip z-0" aria-hidden="true">
        <div className="sticky top-0 h-screen w-full">
          <TopographyBackground
            className="h-full w-full bg-[#030712]"
            lineColor="#64748b"
            lineOpacity={0.38}
            levels={12}
            speed={0.45}
            interactive={false}
          />
        </div>
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#030712] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10">
        <Header />

        <div className="w-full mx-auto pt-8 sm:pt-12 relative">
        {isDesktop ? (
          /* ── Desktop Layout (lg+) — Exact original 2.5fr_3fr_2fr proportions, single-mounted ── */
          <div className="grid grid-cols-[2.5fr_3fr_2fr] gap-6 items-center">

            {/* Left: Name + View CV */}
            <div className="min-w-0 space-y-6 text-left" data-aos="fade-right" data-aos-duration="1000">
              <h3
                className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                <span className="grad-vi block">Hi, I&apos;m</span>
                <span className="block text-white mt-1 whitespace-nowrap">Muhamad</span>
                <span className="block text-white whitespace-nowrap">Reza</span>
              </h3>
              <div className="mt-8">
                <a
                  href="https://drive.google.com/file/d/1zQe7Xma-FNPxyJpl5QVgiGJWmdXQrLe1/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button
                    className="px-6 py-3 rounded-xl font-semibold bg-[#2c67ed] hover:bg-[#1d4ed8] transition-[transform,background-color] duration-200 hover:scale-[1.03] flex items-center gap-2 text-white whitespace-nowrap"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    <FileText className="w-4 h-4" /> View CV
                  </button>
                </a>
              </div>
            </div>

            {/* Center: Image */}
            <div className="min-w-0 flex justify-center items-end">
              <ProfileImage />
            </div>

            {/* Right: Description + View Projects */}
            <div className="min-w-0 space-y-6 text-left" data-aos="fade-left" data-aos-duration="1000">
              <div className="text-base sm:text-lg leading-relaxed" style={{ color: "var(--col-muted)" }}>
                <p>Fullstack Developer.</p>
              </div>
              <div className="mt-8">
                <a
                  href="#Portofolio"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToPortfolio()
                  }}
                >
                  <button
                    className="px-6 py-3 rounded-xl font-semibold bg-[#2c67ed] hover:bg-[#1d4ed8] transition-[transform,background-color] duration-200 hover:scale-[1.03] flex items-center gap-2 text-white whitespace-nowrap"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    <Code className="w-4 h-4" /> View Projects
                  </button>
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* ── Mobile Layout (below lg) — Exact original stacked structure, single-mounted ── */
          <div className="flex flex-col items-start gap-6">
            {/* Photo */}
            <div className="flex justify-center w-full">
              <ProfileImage />
            </div>
            {/* Name */}
            <h3
              className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-left w-full"
              style={{ fontFamily: "var(--font-display)" }}
              data-aos="fade-up"
              data-aos-duration="1000"
            >
              <span className="grad-vi block">Hi, I&apos;m</span>
              <span className="block text-white mt-1">Muhamad Reza</span>
            </h3>
            {/* Description */}
            <div className="text-base sm:text-lg leading-relaxed text-left w-full" style={{ color: "var(--col-muted)" }}>
              <p>Fullstack Developer.</p>
            </div>
            {/* Buttons — full width, stacked */}
            <div className="flex flex-col gap-3 w-full">
              <a
                href="https://drive.google.com/file/d/1zQe7Xma-FNPxyJpl5QVgiGJWmdXQrLe1/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <button
                  className="w-full px-6 py-3 rounded-xl font-semibold bg-[#2c67ed] hover:bg-[#1d4ed8] transition-colors duration-200 flex items-center justify-center gap-2 text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <FileText className="w-4 h-4" /> View CV
                </button>
              </a>
              <a
                href="#Portofolio"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToPortfolio()
                }}
                className="w-full"
              >
                <button
                  className="w-full px-6 py-3 rounded-xl font-semibold bg-[#2c67ed] hover:bg-[#1d4ed8] transition-colors duration-200 flex items-center justify-center gap-2 text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <Code className="w-4 h-4" /> View Projects
                </button>
              </a>
            </div>
          </div>
        )}

        {/* ── Education & Experience Stepped Timeline (Side-by-side 2-column layout) ── */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mt-14"
          data-aos="fade-up"
          data-aos-duration="900"
        >
          {/* Education Column */}
          <div
            className="flex flex-col justify-between"
            onMouseLeave={() => setHoveredEduIndex(null)}
          >
            <div>
              <h4
                className="text-xl font-bold text-white mb-6"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Education
              </h4>
              <div className="relative pt-2 pb-2 px-2">
                <div>
                  {EDUCATION_DATA.map((edu, idx) => {
                    const isActive = activeEduIndex === idx
                    const isLast = idx === EDUCATION_DATA.length - 1
                    return (
                      <div
                        key={edu.id}
                        onMouseEnter={() => setHoveredEduIndex(idx)}
                        className={`relative flex items-start group transition-all duration-300 cursor-pointer ${
                          isLast ? "pb-1" : "pb-6 sm:pb-7"
                        } ${isActive ? "opacity-100" : "opacity-45 hover:opacity-90"}`}
                      >
                        {/* Continuous vertical line to next item */}
                        {!isLast && (
                          <div
                            className="absolute left-[17px] top-9 bottom-0 w-[2px] bg-white/15 z-0"
                            aria-hidden="true"
                          />
                        )}

                        {/* Stepped Number Node */}
                        <div className="relative z-10 flex-shrink-0 mr-4 sm:mr-5">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 ${
                              isActive
                                ? "bg-white text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.35)] ring-4 ring-white/15 scale-105"
                                : "bg-zinc-900/90 text-zinc-400 border border-white/20 group-hover:border-white/40 group-hover:text-zinc-200"
                            }`}
                          >
                            {idx + 1}
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          {/* Row 1: Logo + School + Year */}
                          <div className="flex items-center gap-3">
                            <CompanyLogoBadge logo={edu.logo} name={edu.school} />
                            <span className="text-sm sm:text-base font-semibold text-zinc-200 truncate">
                              {edu.school}
                            </span>
                            <span className="ml-auto flex-shrink-0 text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-medium">
                              {edu.year}
                            </span>
                          </div>

                          {/* Row 2: Degree */}
                          <div className="mt-2 flex items-center">
                            <h5 className="text-base sm:text-lg font-bold text-white tracking-tight">
                              {edu.degree}
                            </h5>
                          </div>

                          {/* Row 3: Faculty + Tag */}
                          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                            <span>{edu.faculty}</span>
                            <span className="text-zinc-600">•</span>
                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-medium">
                              {edu.tag}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Bottom subtle dashed indicator matching Experience */}

          </div>

          {/* Experience Column */}
          <div
            className="flex flex-col justify-between"
            onMouseLeave={() => setHoveredExpIndex(null)}
          >
            <div>
              <h4
                className="text-xl font-bold text-white mb-6"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Experience
              </h4>

              <div
                ref={experienceScrollRef}
                data-lenis-prevent
                onWheel={(e) => e.stopPropagation()}
                className="relative overflow-y-auto px-2 pt-3.5 pb-2 overscroll-contain"
                style={{
                  maxHeight: "360px",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {displayExperiences.map((exp, idx) => {
                  const isActive = activeExpIndex === idx
                  const isLast = idx === displayExperiences.length - 1
                  const meta = getExpMeta(exp)
                  return (
                    <div
                      key={exp.id || idx}
                      onMouseEnter={() => setHoveredExpIndex(idx)}
                      className={`relative flex items-start group transition-all duration-300 cursor-pointer ${
                        isLast ? "pb-2" : "pb-6 sm:pb-7"
                      } ${isActive ? "opacity-100" : "opacity-45 hover:opacity-90"}`}
                    >
                      {/* Continuous vertical line to next item */}
                      {!isLast && (
                        <div
                          className="absolute left-[17px] top-9 bottom-0 w-[2px] bg-white/15 z-0"
                          aria-hidden="true"
                        />
                      )}

                      {/* Stepped Number Node */}
                      <div className="relative z-10 flex-shrink-0 mr-4 sm:mr-5">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 ${
                            isActive
                              ? "bg-white text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.35)] ring-4 ring-white/15 scale-105"
                              : "bg-zinc-900/90 text-zinc-400 border border-white/20 group-hover:border-white/40 group-hover:text-zinc-200"
                          }`}
                        >
                          {idx + 1}
                        </div>
                      </div>

                      {/* Card Info */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        {/* Row 1: Logo + Company + Year */}
                        <div className="flex items-center gap-3">
                          <CompanyLogoBadge logo={exp.logo} name={exp.company} />
                          <span className="text-sm sm:text-base font-semibold text-zinc-200 truncate">
                            {exp.company}
                          </span>
                          <span className="ml-auto flex-shrink-0 text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-medium">
                            {exp.year}
                          </span>
                        </div>

                        {/* Row 2: Role */}
                        <div className="mt-2 flex items-center">
                          <h5 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            {exp.role}
                          </h5>
                        </div>

                        {/* Row 3: Meta & Subtitle */}
                        {(meta.subtitle || meta.tag) && (
                          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                            {meta.subtitle && <span>{meta.subtitle}</span>}
                            {meta.subtitle && meta.tag && <span className="text-zinc-600">•</span>}
                            {meta.tag && (
                              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-medium">
                                {meta.tag}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Dashed line and Scroll indicator */}
            <div className="relative border-t border-dashed border-white/15 pt-3 mt-4 flex items-center justify-center">
              <button
                type="button"
                onClick={scrollExperienceDown}
                className="text-xs font-mono text-zinc-400 tracking-wider flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group"
              >

              </button>
            </div>
          </div>
        </div>

        {/* ── Glass Folder Cards (Projects, Certificates, Awards with REAL IMAGES) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-y-12 gap-x-8 mt-16 justify-items-center">
          
          {/* Folder 1: Projects */}
          <div data-aos="fade-right" data-aos-duration="800" className="flex flex-col items-center">
            <GlassFolder
              label="Projects"
              meta={stats.totalProjects || projectFiles.length}
              tone="dark"
              art="none"
              action="more"
              appearDelay={0}
              files={projectFiles}
              width={320}
              menu={[
                {
                  label: "Explore All Projects",
                  onSelect: () => scrollToPortfolio(0),
                }
              ]}
              onFileSelect={() => scrollToPortfolio(0)}
            />
          </div>

          {/* Folder 2: Certificates */}
          <div data-aos="fade-up" data-aos-duration="900" className="flex flex-col items-center">
            <GlassFolder
              label="Certificates"
              meta={stats.totalCertificates || certificateFiles.length}
              tone="dark"
              art="none"
              action="more"
              appearDelay={120}
              files={certificateFiles}
              width={320}
              menu={[
                {
                  label: "Explore All Certificates",
                  onSelect: () => scrollToPortfolio(1),
                }
              ]}
              onFileSelect={() => scrollToPortfolio(1)}
            />
          </div>

          {/* Folder 3: Awards */}
          <div data-aos="fade-left" data-aos-duration="800" className="flex flex-col items-center md:col-span-2 xl:col-span-1">
            <GlassFolder
              label="Awards"
              meta={stats.totalAwards || awardFiles.length}
              tone="dark"
              art="none"
              action="more"
              appearDelay={240}
              files={awardFiles}
              width={320}
              menu={[
                {
                  label: "Explore All Awards",
                  onSelect: () => scrollToPortfolio(2),
                }
              ]}
              onFileSelect={() => scrollToPortfolio(2)}
            />
          </div>

        </div>

      </div>
      </div>
    </div>
  )
}

export default memo(AboutPage)
