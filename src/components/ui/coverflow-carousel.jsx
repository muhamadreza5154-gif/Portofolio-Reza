import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function CoverflowCarousel({
  slides = [],
  rotate = 44,
  depth = 0.6,
  perspective = 3,
  falloff = 0.56,
  fade = 0.1,
  cardWidth = "clamp(148px, 22vw, 260px)",
  gap = 0.05,
  loop = true,
  showCaption = false,
  showPagination = false,
  showNavigation = false,
  label = "Cover carousel",
  className,
  cardClassName,
}) {
  const count = slides.length;

  const frameRef = React.useRef(null);
  const cardRefs = React.useRef([]);
  
  // Fractional card index at the centre. The single source of truth.
  const posRef = React.useRef(0);
  
  // Where the current settle is headed. Stepping off `pos` instead would
  // swallow a keypress that lands mid-flight, before the round-off moves.
  const targetRef = React.useRef(0);
  const widthRef = React.useRef(0);
  const rafRef = React.useRef(null);
  const dragRef = React.useRef(null);

  const [selected, setSelected] = React.useState(0);

  // Nearest whole card, folded back into 0..count-1.
  const indexAt = React.useCallback(
    (pos) => {
      if (count === 0) return 0;
      return ((Math.round(pos) % count) + count) % count;
    },
    [count]
  );

  // Paint straight to the DOM.
  const paint = React.useCallback(() => {
    const width = widthRef.current;
    if (!width || count === 0) return;
    const pitch = width * (1 + gap);
    const pos = posRef.current;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      let offset = index - pos;
      if (loop) {
        offset = ((offset % count) + count) % count;
        if (offset > count / 2) offset -= count;
      }

      const distance = Math.abs(offset);
      const ramp = Math.pow(distance, falloff);
      const tilt = Math.min(rotate * ramp, 82) * Math.sign(offset);

      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg)`;

      const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
      card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge);
      card.style.zIndex = String(100 - Math.round(distance));
    });
  }, [count, depth, fade, falloff, gap, loop, rotate]);

  const settle = React.useCallback(
    (target) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      targetRef.current = target;
      setSelected(indexAt(target));

      const step = () => {
        const remaining = target - posRef.current;
        if (Math.abs(remaining) < 0.0004) {
          posRef.current = target;
          paint();
          rafRef.current = null;
          return;
        }
        
        posRef.current += remaining * 0.16;
        paint();
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [indexAt, paint]
  );

  const clamp = React.useCallback(
    (pos) => {
      if (count === 0) return 0;
      return loop ? pos : Math.max(0, Math.min(count - 1, pos));
    },
    [count, loop]
  );

  const goTo = React.useCallback(
    (index) => {
      if (count === 0) return;
      const target = loop
        ? index + Math.round((targetRef.current - index) / count) * count
        : index;
      settle(clamp(target));
    },
    [clamp, count, loop, settle]
  );

  const nudge = React.useCallback(
    (by) => settle(clamp(Math.round(targetRef.current) + by)),
    [clamp, settle]
  );

  const isDragging = React.useRef(false);
  const startX = React.useRef(0);
  const startTarget = React.useRef(null);

  const onPointerDown = (event) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    targetRef.current = posRef.current;
    
    isDragging.current = false;
    startX.current = event.clientX;
    startTarget.current = event.target;
    
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      pos: posRef.current,
      v: 0,
      t: performance.now(),
    };
  };

  const onPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    if (Math.abs(event.clientX - startX.current) > 5) {
      isDragging.current = true;
    }

    const pitch = widthRef.current * (1 + gap);
    if (!pitch) return;

    const now = performance.now();
    const previous = posRef.current;
    posRef.current = clamp(drag.pos - (event.clientX - drag.x) / pitch);
    
    drag.v = ((posRef.current - previous) / Math.max(now - drag.t, 1)) * 1000;
    drag.t = now;

    const index = indexAt(posRef.current);
    if (index !== selected) setSelected(index);
    paint();
  };

  const endDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    
    // Jika tidak sedang di-drag (artinya ini adalah klik)
    if (!isDragging.current && startTarget.current) {
      // Cari slide index yang diklik
      const clickedCard = startTarget.current.closest('[role="group"]');
      if (clickedCard) {
        const index = cardRefs.current.indexOf(clickedCard);
        if (index !== -1 && count > 0) {
          const currentRounded = Math.round(posRef.current);
          const currentMod = ((currentRounded % count) + count) % count;
          let diff = index - currentMod;
          
          if (loop) {
            if (diff > count / 2) diff -= count;
            else if (diff < -count / 2) diff += count;
          }
          
          if (diff !== 0) {
            settle(clamp(currentRounded + diff));
            return;
          }
        }
      }
    }

    const carried = Math.max(-2, Math.min(2, drag.v * 0.18));
    settle(clamp(Math.round(posRef.current + carried)));
  };

  const wheelTimeout = React.useRef(null);

  const onWheel = (event) => {
    // Abaikan jika user menggunakan scroll wheel vertikal (atas/bawah)
    // agar halaman tetap bisa di-scroll ke bawah seperti biasa.
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      return;
    }
    
    // Hanya tangkap event jika user melakukan scroll horizontal (swipe trackpad kiri/kanan)
    const pitch = widthRef.current * (1 + gap);
    if (!pitch) return;
    
    const delta = event.deltaX;
    if (Math.abs(delta) < 5) return;

    // Prevent default agar halaman tidak 'back/forward' saat swipe di Mac
    event.preventDefault();

    posRef.current = clamp(posRef.current + (delta / pitch) * 2);
    
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    const index = indexAt(posRef.current);
    if (index !== selected) setSelected(index);
    paint();
    
    clearTimeout(wheelTimeout.current);
    wheelTimeout.current = setTimeout(() => {
      settle(clamp(Math.round(posRef.current)));
    }, 150);
  };

  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      if (count === 0) return;
      const card = cardRefs.current[0];
      if (!card) return;
      widthRef.current = card.offsetWidth;
      paint();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [paint, count]);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (wheelTimeout.current !== null) clearTimeout(wheelTimeout.current);
    },
    []
  );

  // If there are no slides, render nothing or a placeholder
  if (count === 0) return null;

  return (
    <div
      className={cn("w-full relative flex flex-col items-center overflow-hidden", className)}
      style={{ ["--cf-card"]: cardWidth }}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className="relative">
        <div
          ref={frameRef}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={onWheel}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              nudge(-1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              nudge(1);
            }
          }}
          className="cursor-grab py-10 outline-none ring-ring focus-visible:ring-2 active:cursor-grabbing w-full"
          style={{
            perspective: `calc(var(--cf-card) * ${perspective})`,
            touchAction: "pan-y",
          }}
        >
          <div
            className="relative select-none w-full"
            style={{
              height: "var(--cf-card)",
              transformStyle: "preserve-3d",
            }}
          >
            {slides.map((slide, index) => (
              <div
                key={slide.id || index}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${count}`}
                className={cn(
                  "absolute left-1/2 top-0 aspect-square overflow-hidden rounded-2xl bg-muted shadow-xl will-change-transform",
                  cardClassName
                )}
                style={{ width: "var(--cf-card)" }}
              >
                <img
                  src={slide.src || slide.image_url}
                  alt={slide.alt || "Carousel image"}
                  draggable={false}
                  className="h-full w-full select-none object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {showNavigation && count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => nudge(-1)}
              className="absolute left-3 top-1/2 z-[200] -translate-y-1/2 rounded-full bg-background/70 p-2 text-foreground backdrop-blur transition hover:bg-background"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => nudge(1)}
              className="absolute right-3 top-1/2 z-[200] -translate-y-1/2 rounded-full bg-background/70 p-2 text-foreground backdrop-blur transition hover:bg-background"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
