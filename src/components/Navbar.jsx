import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Home, User, Briefcase, Mail } from "lucide-react"

function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

const navItems = [
  { name: "Home",      url: "#Home",       icon: Home },
  { name: "About",     url: "#About",      icon: User },
  { name: "Portofolio", url: "#Portofolio", icon: Briefcase },
  { name: "Contact",   url: "#Contact",    icon: Mail },
]

export default function Navbar({ defaultActive = "Home" }) {
  const [mounted, setMounted]           = useState(false)
  const [hoveredTab, setHoveredTab]     = useState(null)
  const [activeTab, setActiveTab]       = useState(defaultActive)
  const [isLightTheme, setIsLightTheme] = useState(false)
  const isScrolling                     = React.useRef(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    let rafId = 0

    const updateNavState = () => {
      rafId = 0

      // 1. Detect whether the surface directly behind the navbar is Dark or Light
      const galleryShowcase = document.getElementById("Portofolio-Gallery")
      const portalSection = document.getElementById("Portofolio")
      let light = false
      if (galleryShowcase) {
        const showcaseRect = galleryShowcase.getBoundingClientRect()
        const gpProgress = portalSection
          ? parseFloat(portalSection.dataset.gpProgress || "0")
          : 0
        light = gpProgress >= 0.72 || showcaseRect.top <= 120
      }
      setIsLightTheme((prev) => (prev !== light ? light : prev))

      // 2. Detect active section unless smooth-scroll click is in progress
      if (isScrolling.current) return
      const triggerLine = window.innerHeight * 0.38
      let currentActive = navItems[0].name
      for (const item of navItems) {
        const el = document.querySelector(item.url)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.top <= triggerLine) {
          currentActive = item.name
        }
      }
      setActiveTab((prev) => (prev !== currentActive ? currentActive : prev))
    }

    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(updateNavState)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    updateNavState()

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  const scrollToSection = (e, url, name) => {
    e.preventDefault()
    const section = document.querySelector(url)
    if (section) {
      isScrolling.current = true
      setActiveTab(name)
      // For pinned full-viewport portals (#Portofolio) and top of page (#Home), align at exact top (offset 0)
      const offset = (url === "#Portofolio" || url === "#Home") ? 0 : 60
      const targetTop = Math.max(0, section.getBoundingClientRect().top + window.scrollY - offset)
      if (window.lenis) {
        window.lenis.scrollTo(targetTop, { duration: 0.9 })
      } else {
        window.scrollTo({ top: targetTop, behavior: "smooth" })
      }
      setTimeout(() => { isScrolling.current = false }, 1000)
    }
  }

  if (!mounted) return null

  return (
    <div className="fixed top-3 md:top-5 left-0 right-0 z-[9999] pointer-events-none">
      <div className="flex justify-center pt-6">
        <motion.div
          className={cn(
            "pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 py-2 px-2.5 rounded-full relative backdrop-blur-[1.5px] transition-[background-color,box-shadow] duration-300",
            isLightTheme
              ? "bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_12px_28px_rgba(15,23,42,0.10),0_2px_8px_rgba(15,23,42,0.05)]"
              : "bg-slate-950/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.20),0_8px_24px_rgba(0,0,0,0.22)]"
          )}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {navItems.map((item) => {
            const isActive  = activeTab === item.name
            const isHovered = hoveredTab === item.name
            return (
              <a
                key={item.name}
                href={item.url}
                onClick={(e) => scrollToSection(e, item.url, item.name)}
                onMouseEnter={() => setHoveredTab(item.name)}
                onMouseLeave={() => setHoveredTab(null)}
                className={cn(
                  "relative cursor-pointer text-xs md:text-sm font-semibold px-4 py-2 md:px-6 md:py-2.5 rounded-full transition-colors duration-200",
                  isActive
                    ? "text-white"
                    : isLightTheme
                      ? "text-zinc-800 hover:text-zinc-950"
                      : "text-white/95 hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 rounded-full -z-10 bg-[#2c67ed] shadow-[0_6px_16px_rgba(44,103,237,0.32)]"
                    transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  />
                )}

                <span className="relative z-10">
                  {item.name}
                </span>

                <AnimatePresence>
                  {isHovered && !isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "absolute inset-0 rounded-full -z-10",
                        isLightTheme ? "bg-zinc-900/[0.06]" : "bg-white/15"
                      )}
                    />
                  )}
                </AnimatePresence>

                {isActive && (
                  <motion.div
                    layoutId="anime-mascot"
                    className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none"
                    style={{ filter: "drop-shadow(0 3px 6px rgba(15, 23, 42, 0.18))" }}
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <div className="relative w-12 h-12">
                      <motion.div
                        className="absolute w-10 h-10 bg-white rounded-full left-1/2 -translate-x-1/2"
                        animate={
                          hoveredTab
                            ? { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0], transition: { duration: 0.5, ease: "easeInOut" } }
                            : { y: [0, -3, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }
                        }
                      >
                        <motion.div
                          className="absolute w-2 h-2 bg-black rounded-full"
                          animate={hoveredTab ? { scaleY: [1, 0.2, 1], transition: { duration: 0.2, times: [0, 0.5, 1] } } : {}}
                          style={{ left: "25%", top: "40%" }}
                        />
                        <motion.div
                          className="absolute w-2 h-2 bg-black rounded-full"
                          animate={hoveredTab ? { scaleY: [1, 0.2, 1], transition: { duration: 0.2, times: [0, 0.5, 1] } } : {}}
                          style={{ right: "25%", top: "40%" }}
                        />
                        <motion.div
                          className="absolute w-2 h-1.5 bg-pink-300 rounded-full"
                          animate={{ opacity: hoveredTab ? 0.8 : 0.6 }}
                          style={{ left: "15%", top: "55%" }}
                        />
                        <motion.div
                          className="absolute w-2 h-1.5 bg-pink-300 rounded-full"
                          animate={{ opacity: hoveredTab ? 0.8 : 0.6 }}
                          style={{ right: "15%", top: "55%" }}
                        />
                        <motion.div
                          className="absolute w-4 h-2 border-b-2 border-black rounded-full"
                          animate={hoveredTab ? { scaleY: 1.5, y: -1 } : { scaleY: 1, y: 0 }}
                          style={{ left: "30%", top: "60%" }}
                        />
                      </motion.div>
                      <motion.div
                        className="absolute -bottom-1 left-1/2 w-4 h-4 -translate-x-1/2"
                        animate={
                          hoveredTab
                            ? { y: [0, -4, 0], transition: { duration: 0.3, repeat: Infinity, repeatType: "reverse" } }
                            : { y: [0, 2, 0], transition: { duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.5 } }
                        }
                      >
                        <div className="w-full h-full bg-white rotate-45 transform origin-center" />
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </a>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
