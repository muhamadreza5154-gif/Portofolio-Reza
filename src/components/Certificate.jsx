import React, { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Maximize2, X } from "lucide-react"

const Certificate = ({ ImgSertif }) => {
  const [open, setOpen] = useState(false)

  const handleOpen = () => setOpen(true)
  const handleClose = useCallback(() => setOpen(false), [])

  // Tutup modal dengan tombol Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === "Escape") handleClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, handleClose])

  // Cegah scroll saat modal terbuka
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <div className="w-full">
      {/* Thumbnail */}
      <div
        className="relative overflow-hidden rounded-xl bg-zinc-100 cursor-pointer group"
        onClick={handleOpen}
      >
        <div
          className="w-full bg-zinc-100 flex items-center justify-center overflow-hidden"
          style={{ aspectRatio: "4/3" }}
        >
          <div className="w-full h-full transition-transform duration-500 group-hover:scale-105">
            <img
              src={ImgSertif}
              alt="Certificate"
              loading="lazy"
              className="certificate-image w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-[2] flex items-center justify-center">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold shadow-md transition-transform duration-300 translate-y-2 group-hover:translate-y-0"
            style={{ background: "#2c67ed", fontFamily: "var(--font-display)" }}
          >
            <Maximize2 className="w-4 h-4" />
            <span className="text-sm">View Certificate</span>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(5px)" }}
          onClick={handleClose}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2.5 rounded-xl text-white hover:scale-110 transition-transform duration-200 cursor-pointer"
            style={{ background: "#2c67ed" }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image */}
          <img
            src={ImgSertif}
            alt="Certificate Full View"
            className="max-w-full max-h-[90vh] object-contain mx-auto rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </div>
  )
}

export default Certificate
