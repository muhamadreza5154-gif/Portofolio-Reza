  "use client";

  /**
   * Glyph Portal © 2026 Christian Katzmann. MIT.
   * Origin: UsefulPortal.astro on https://ktzm.dk → UsefulPortal.tsx → ClarityPortal.tsx.
   * A scroll-driven camera through live type. Keep this notice with copies.
   */
  import React, { useId, useLayoutEffect, useRef } from "react";

  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const smooth = (a, b, n) => {
    const t = clamp((n - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const DEFAULT_FONT = '"Arial Black", "Arial", sans-serif';

  /** Largest opaque square, in linear time. Unlike a stem guess, it works in O, S and Ø. */
  function interior(context, char, font) {
    try {
      const canvas = context.canvas;
      context.font = font;
      const m = context.measureText(char);
      const pad = 8;
      const left = Math.ceil(m.actualBoundingBoxLeft || 0);
      const ascent = Math.ceil(m.actualBoundingBoxAscent || 80);
      canvas.width = Math.max(
        1,
        Math.ceil((m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || m.width || 60)) + pad * 2
      );
      canvas.height = Math.max(
        1,
        Math.ceil((m.actualBoundingBoxAscent || 80) + (m.actualBoundingBoxDescent || 20)) + pad * 2
      );
      context.font = font;
      context.fontKerning = "none";
      context.fillText(char, pad + left, pad + ascent);
      const { width, height } = canvas;
      const pixels = context.getImageData(0, 0, width, height).data;
      const rows = new Uint16Array(width + 1);
      let size = 0, bx = 0, by = 0;
      for (let y = 0; y < height; y++) {
        let diagonal = 0;
        for (let x = 0; x < width; x++) {
          const above = rows[x + 1];
          rows[x + 1] = pixels[(y * width + x) * 4 + 3] > 245
            ? Math.min(above, rows[x], diagonal) + 1 : 0;
          diagonal = above;
          if (rows[x + 1] > size) { size = rows[x + 1]; bx = x; by = y; }
        }
      }
      if (size < 3) return null;
      // Scan at 3× SVG size. Inscribe a disk in the square, with room for raster disagreement.
      return {
        x: (bx + 1 - size / 2 - pad - left) / 3,
        y: (by + 1 - size / 2 - pad - ascent) / 3,
        radius: (size / 2 - 1) / 3,
      };
    } catch (e) {
      return null;
    }
  }

  function scrollParent(element) {
    for (let p = element?.parentElement; p; p = p.parentElement) {
      if (
        /(auto|scroll|hidden)/.test(getComputedStyle(p).overflowY) &&
        p !== document.body &&
        p !== document.documentElement
      ) {
        return p;
      }
    }
    return null;
  }

  export default function GlyphPortal({
    id,
    word = "PORTOFOLIO",
    focusChar,
    interactive = true,
    backdrop,
    front,
    children,
    scrollLength = 1.7,
    fontFamily = DEFAULT_FONT,
    fontWeight = 900,
    annotations = false,
    enterLabel = "",
    className = "",
    style = {},
    onProgress,
  }) {
    const reactUid = `gp-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
    const uid = id || reactUid;
    const clipId = `${reactUid}-clip`;

    const sectionRef = useRef(null);
    const pinRef = useRef(null);
    const artRef = useRef(null);
    const clipRef = useRef(null);
    const glyphRef = useRef(null);
    const fieldRectRef = useRef(null);
    const marksRef = useRef(null);
    const choicesRef = useRef(null);
    const pickerRef = useRef(null);
    const contentRef = useRef(null);

    const progressRef = useRef(onProgress);
    useLayoutEffect(() => {
      progressRef.current = onProgress;
    }, [onProgress]);

    const text = (word || "PORTOFOLIO").trim().normalize("NFC") || "PORTOFOLIO";
    let characterOffset = 0;
    const characters = Array.from(text, (char) => {
      const index = characterOffset;
      characterOffset += char.length;
      return { char, index };
    });
    const length = Number.isFinite(scrollLength) ? clamp(scrollLength, 1.2, 8) : 1.7;
    const weight = Number.isFinite(fontWeight) ? clamp(fontWeight, 1, 1000) : 900;
    const hasFront = front != null;
    const q = `:where(#${uid})`;

    useLayoutEffect(() => {
      const section = sectionRef.current;
      const pin = pinRef.current;
      const art = artRef.current;
      const clip = clipRef.current;
      const glyph = glyphRef.current;
      const fieldRect = fieldRectRef.current;
      const marks = marksRef.current;
      const choices = choicesRef.current;
      const picker = pickerRef.current;
      const content = contentRef.current;

      if (!section || !pin || !art || !clip || !glyph || !fieldRect) return;

      const buttons = choices ? Array.from(choices.querySelectorAll("button")) : [];
      const root = scrollParent(section);
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });

      let disposed = false;
      let raf = 0;
      let dirty = true;
      let ready = false;
      let W = 1, H = 1, travel = 1, startScale = 1, endScale = 1;
      let center = { x: 0, y: 0 };
      let target = null;
      let lastProgress = -1;
      let candidates = [];
      let letters = [];
      let choosing = false;
      let bounds = { x: 0, y: 0, width: 1, height: 1 };
      let fontDirty = true;

      glyph.style.fontFamily = fontFamily || DEFAULT_FONT;

      const readInk = () => {
        if (!context) return false;
        const font = getComputedStyle(glyph);
        const activeFamily = font.fontFamily || DEFAULT_FONT;
        const activeWeight = font.fontWeight || String(weight);
        const scanFont = `${activeWeight} 300px ${activeFamily}`;
        context.font = `${activeWeight} 100px ${activeFamily}`;
        context.fontKerning = "none";
        const metrics = context.measureText(text);
        const advances = Array.from({ length: text.length }, (_, i) =>
          context.measureText(text.slice(0, i)).width
        );
        const bw = (metrics.actualBoundingBoxLeft || 0) + (metrics.actualBoundingBoxRight || metrics.width || 0);
        const bh = (metrics.actualBoundingBoxAscent || 75) + (metrics.actualBoundingBoxDescent || 20);
        if (!bw || !bh) return false;

        bounds = {
          x: -(metrics.actualBoundingBoxLeft || 0),
          y: -(metrics.actualBoundingBoxAscent || 75),
          width: bw,
          height: bh,
        };
        center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };

        const requested = focusChar ? text.indexOf(focusChar.normalize("NFC")) : -1;
        let offset = 0;
        candidates = [];
        letters = [];
        for (const char of Array.from(text)) {
          context.font = `${activeWeight} 100px ${activeFamily}`;
          const m = context.measureText(char);
          letters.push({
            index: offset,
            x: advances[offset] - (m.actualBoundingBoxLeft || 0),
            y: -(m.actualBoundingBoxAscent || 75),
            width: (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || m.width || 50),
            height: (m.actualBoundingBoxAscent || 75) + (m.actualBoundingBoxDescent || 20),
          });
          const found = interior(context, char, scanFont);
          if (found) candidates.push({ ...found, x: found.x + advances[offset], index: offset });
          offset += char.length;
        }
        target =
          candidates.find((candidate) => candidate.index === requested) ??
          [...candidates].sort(
            (a, b) => b.radius - a.radius || Math.abs(a.x - center.x) - Math.abs(b.x - center.x)
          )[0] ??
          null;
        return target != null;
      };

      const select = (next) => {
        target = next;
        endScale = target ? Math.max(startScale, Math.hypot(W, H) / (target.radius * 1.35)) : startScale;
        section.dataset.gpFocus = target ? Array.from(text.slice(target.index))[0] : "";
        section.dataset.gpFocusIndex = String(target?.index ?? -1);
        for (const button of buttons) {
          const selected = Number(button.dataset.gpLetter) === target?.index;
          button.disabled = !candidates.some((candidate) => candidate.index === Number(button.dataset.gpLetter));
          button.setAttribute("aria-checked", String(selected));
          button.tabIndex = selected ? 0 : -1;
        }
        if (picker) {
          if (picker.value !== "") picker.value = String(target?.index ?? -1);
          for (const option of Array.from(picker.options)) {
            option.disabled =
              option.value === "" || !candidates.some((candidate) => candidate.index === Number(option.value));
          }
        }
        if (marks && startScale > 0) {
          const u = 1 / startScale;
          const y = bounds.y + bounds.height + 25 * u;
          const x = bounds.x;
          const right = x + bounds.width;
          const cross = target
            ? `M${target.x - 9 * u} ${target.y}h${18 * u}M${target.x} ${target.y - 9 * u}v${18 * u}`
            : "";
          const annotationPath = marks.querySelector("path");
          if (annotationPath) {
            annotationPath.setAttribute("d", `M${x} ${y}H${right}M${x} ${y - 5 * u}v${10 * u}M${right} ${y - 5 * u}v${10 * u}${cross}`);
            annotationPath.setAttribute("stroke-width", String(u));
          }
        }
      };

      const position = () => {
        const origin = root ? root.getBoundingClientRect().top + root.clientTop : 0;
        return clamp((origin - section.getBoundingClientRect().top) / travel);
      };

      const paint = (progress) => {
        const isStatic = motion.matches || !target;
        const p = isStatic ? 0 : progress;
        const t = clamp(p / 0.78);
        const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
        const scale = Math.exp(Math.log(startScale) + Math.log(endScale / startScale) * eased);
        const blend =
          endScale === startScale ? 0 : (1 / scale - 1 / startScale) / (1 / endScale - 1 / startScale);
        const cx = center.x + ((target?.x ?? center.x) - center.x) * blend;
        const cy = center.y + ((target?.y ?? center.y) - center.y) * blend;
        const roll = -4 * smooth(0.06, 0.5, t) * (1 - smooth(0.62, 0.92, t));
        const transform = `translate(${W / 2} ${H * 0.46 + H * 0.04 * eased}) scale(${scale}) rotate(${roll}) translate(${-cx} ${-cy})`;

        const radians = (roll * Math.PI) / 180;
        const dx = W / 2 / scale;
        const dy = (H * 0.46 + H * 0.04 * eased) / scale;
        clip.setAttribute("transform", `scale(${scale}) rotate(${roll})`);
        glyph.setAttribute(
          "transform",
          `translate(${Math.cos(radians) * dx + Math.sin(radians) * dy - cx} ${-Math.sin(radians) * dx + Math.cos(radians) * dy - cy})`
        );

        // Native SVG clipping: drop clip only after white ink already fills 100% of viewport,
        // and immediately restore clip on reverse scroll (t < 1) with zero focus-within interference.
        if (t >= 1) {
          fieldRect.removeAttribute("clip-path");
          fieldRect.style.clipPath = "none";
        } else {
          const refUrl = `url(#${clipId})`;
          fieldRect.setAttribute("clip-path", refUrl);
          fieldRect.style.clipPath = refUrl;
        }

        if (marks) {
          marks.setAttribute("transform", transform);
          marks.style.opacity = String(1 - smooth(0.015, 0.17, p));
        }

        choosing = interactive && !isStatic && p < 0.04;
        if (choices) choices.inert = !choosing;
        section.dataset.gpChoosing = String(choosing);

        // Clear focus inside gallery when scrolling back out so keyboard state stays clean
        if (p < 0.8 && content && document.activeElement && content.contains(document.activeElement)) {
          try { document.activeElement.blur(); } catch (e) {}
        }

        section.style.setProperty("--gp-caption", String(1 - smooth(0.01, 0.24, p)));
        section.style.setProperty("--gp-reveal", String(isStatic ? 1 : smooth(0.78, 0.92, p)));
        section.style.setProperty("--gp-caption-hit", p < 0.08 ? "auto" : "none");
        section.dataset.gpEntered = String(p >= 0.88);
        section.dataset.gpProgress = p.toFixed(5);
        if (p !== lastProgress) {
          lastProgress = p;
          progressRef.current?.(p);
        }
      };

      const layout = () => {
        if (!section.clientWidth) return;
        W = Math.max(1, pin.clientWidth);
        const probe = section.querySelector("[data-gp-viewport]");
        const smallViewport = probe ? probe.offsetHeight : window.innerHeight;
        const viewportHeight = Math.max(1, Math.min(root?.clientHeight ?? smallViewport, smallViewport || window.innerHeight));
        H = motion.matches ? Math.min(viewportHeight * 0.75, 480) : viewportHeight;
        section.style.setProperty("--gp-height", `${H}px`);
        travel = Math.max(1, H * length);
        art.setAttribute("viewBox", `0 0 ${W} ${H}`);
        fieldRect.setAttribute("width", String(W));
        fieldRect.setAttribute("height", String(H));

        if (fontDirty) {
          ready = readInk();
          fontDirty = false;
        }
        if (!ready) return;

        const wordHeight = hasFront && H < 480 ? Math.min(H * 0.38, Math.max(24, H - 264)) : H * 0.38;
        startScale = Math.max(0.1, Math.min((W * 0.84) / bounds.width, wordHeight / bounds.height));
        select(target);

        for (const button of buttons) {
          const letter = letters.find((item) => item.index === Number(button.dataset.gpLetter));
          if (letter) {
            Object.assign(button.style, {
              left: `${W / 2 + (letter.x - center.x) * startScale}px`,
              top: `${H * 0.46 + (letter.y - center.y) * startScale - Math.max(0, 44 - letter.height * startScale) / 2}px`,
              width: `${Math.max(1, letter.width * startScale)}px`,
              height: `${Math.max(44, letter.height * startScale)}px`,
            });
          }
        }
        section.style.setProperty("--gp-word-top", `${H * 0.46 - (bounds.height * startScale) / 2}px`);
        section.style.setProperty("--gp-word-bottom", `${H * 0.46 + (bounds.height * startScale) / 2}px`);
        section.dataset.gpReady = "true";
        section.dataset.gpMotion = !motion.matches && target ? "on" : "off";
      };

      const frame = () => {
        raf = 0;
        if (disposed) return;
        if (dirty) {
          dirty = false;
          layout();
        }
        if (ready) paint(position());
      };

      const schedule = () => {
        if (!raf) raf = requestAnimationFrame(frame);
      };
      const resize = () => {
        cancelAnimationFrame(raf);
        raf = 0;
        dirty = true;
        frame();
      };
      const scroll = () => schedule();

      const choose = (event) => {
        if (!choosing || position() >= 0.04) return;
        const button = event.target?.closest?.("[data-gp-letter]");
        const next = candidates.find((candidate) => candidate.index === Number(button?.dataset.gpLetter));
        if (!next || next === target) return;
        select(next);
        paint(position());
      };

      const navigate = (event) => {
        if (!choosing || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const current = candidates.indexOf(target);
        const index =
          event.key === "Home"
            ? 0
            : event.key === "End"
            ? candidates.length - 1
            : (current + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) + candidates.length) %
              candidates.length;
        buttons.find((button) => Number(button.dataset.gpLetter) === candidates[index]?.index)?.focus({ preventScroll: true });
      };

      const pick = () => {
        if (!choosing || position() >= 0.04) return;
        const next = candidates.find((candidate) => candidate.index === Number(picker?.value));
        if (next) {
          select(next);
          paint(position());
        }
      };

      if (choices) {
        choices.addEventListener("pointerover", choose);
        choices.addEventListener("click", choose);
        choices.addEventListener("focusin", choose);
        choices.addEventListener("keydown", navigate);
      }
      if (picker) picker.addEventListener("change", pick);

      const observer = new ResizeObserver(resize);
      observer.observe(pin);
      if (root) observer.observe(root);

      const scrollTarget = root ?? window;
      scrollTarget.addEventListener("scroll", scroll, { passive: true });
      window.addEventListener("resize", resize);
      window.visualViewport?.addEventListener("resize", resize);
      motion.addEventListener("change", resize);

      if (window.lenis) {
        window.lenis.on("scroll", scroll);
      }
      const lenisTimer = setInterval(() => {
        if (window.lenis) {
          window.lenis.on("scroll", scroll);
          clearInterval(lenisTimer);
        }
      }, 200);

      frame();
      schedule();

      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        clearInterval(lenisTimer);
        observer.disconnect();
        scrollTarget.removeEventListener("scroll", scroll);
        window.removeEventListener("resize", resize);
        window.visualViewport?.removeEventListener("resize", resize);
        motion.removeEventListener("change", resize);
        if (window.lenis) {
          try { window.lenis.off("scroll", scroll); } catch (e) {}
        }
        if (choices) {
          choices.removeEventListener("pointerover", choose);
          choices.removeEventListener("click", choose);
          choices.removeEventListener("focusin", choose);
          choices.removeEventListener("keydown", navigate);
        }
        if (picker) picker.removeEventListener("change", pick);
      };
    }, [text, focusChar, interactive, fontFamily, weight, length, clipId, hasFront]);

    return (
      <section
        ref={sectionRef}
        id={uid}
        className={className}
        aria-label={text}
        style={{ "--gp-length": length, "--gp-characters": Array.from(text).length, ...style }}
      >
        <style>{`
          ${q}{--gp-paper:#050510;--gp-ink:#ffffff;--gp-field:#ffffff;--gp-foreground:#09090b;position:relative;isolation:isolate;background:var(--gp-paper);color:var(--gp-ink);font-family:Arial,sans-serif;}
          ${q}>[data-gp-viewport]{position:absolute;inset:0 auto auto 0;height:100vh;height:100svh;width:0;pointer-events:none;visibility:hidden;}
          ${q} [data-gp-pin]{position:relative;height:var(--gp-height,100svh);overflow:clip;isolation:isolate;container-type:size;z-index:1;}
          ${q} [data-gp-backdrop]{position:absolute;inset:0;z-index:0;pointer-events:none;}
          ${q} [data-gp-art]{position:absolute;inset:0;z-index:1;width:100%;height:100%;overflow:hidden;pointer-events:none;}
          ${q} [data-gp-field-rect]{opacity:0;}
          ${q}[data-gp-ready] [data-gp-field-rect]{opacity:1;}
          ${q} [data-gp-marks]{fill:none;stroke:var(--gp-ink);opacity:.6;}
          ${q} [data-gp-choices]{position:absolute;inset:0;z-index:2;visibility:hidden;pointer-events:none;}
          ${q}[data-gp-choosing=true] [data-gp-choices]{visibility:visible;}
          ${q} [data-gp-letter]{box-sizing:border-box;position:absolute;border:0;padding:0;margin:0;background:transparent;cursor:pointer;pointer-events:auto;touch-action:pan-y;}
          ${q} [data-gp-letter]:disabled{pointer-events:none;}
          ${q} [data-gp-letter]:focus-visible{outline:2px solid var(--gp-field);outline-offset:5px;}
          ${q} [data-gp-touch-picker]{display:none;position:absolute;z-index:2;top:calc(var(--gp-word-bottom,50%) + 42px);left:50%;transform:translateX(-50%);font:12px/1.4 Arial,sans-serif;align-items:center;gap:12px;visibility:hidden;}
          ${q}[data-gp-choosing=true] [data-gp-touch-picker]{visibility:visible;}
          ${q} [data-gp-select]{min-height:44px;min-width:90px;border:1px solid #d8deda;border-radius:4px;background:var(--gp-paper);color:var(--gp-ink);padding:0 10px;font:inherit;}
          ${q} [data-gp-select]:focus-visible{outline:2px solid var(--gp-field);outline-offset:4px;}
          @media(any-pointer:coarse){${q} [data-gp-touch-picker]{display:flex;}}
          ${q} [data-gp-fallback]{position:absolute;inset:0;z-index:2;display:none;place-items:center;font-size:min(calc(100cqw / var(--gp-characters)),38cqh);line-height:1;color:var(--gp-field);}
          ${q}[data-gp-ready] [data-gp-fallback]{visibility:hidden;}
          ${q} [data-gp-caption]{position:absolute;z-index:2;inset:auto 8% 9%;display:${hasFront ? "none" : "flex"};align-items:center;justify-content:center;gap:1rem;font:700 14px/1.4 Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;opacity:var(--gp-caption,1);pointer-events:var(--gp-caption-hit,auto);}
          ${q} [data-gp-caption]{font-family:inherit;}
          ${q} [data-gp-front]{position:absolute;inset:0;z-index:2;opacity:var(--gp-caption,1);pointer-events:none;}
          ${q} [data-gp-front] a,${q} [data-gp-front] button{pointer-events:var(--gp-caption-hit,auto);}
          ${q} [data-gp-hint]{max-width:30ch;color:var(--gp-ink);}
          ${q} [data-gp-enter]{display:inline-flex;align-items:center;gap:16px;min-height:44px;padding:0 20px;border:1px solid rgba(255,255,255,.35);border-radius:999px;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);color:inherit;font:inherit;text-decoration:none;letter-spacing:inherit;}
          ${q} [data-gp-content]{box-sizing:border-box;position:relative;z-index:2;min-height:var(--gp-height,100svh);padding:0;color:var(--gp-foreground);background:var(--gp-field);overflow-wrap:anywhere;}
          ${q}[data-gp-motion=on] [data-gp-pin]{position:sticky;top:0;}
          ${q}[data-gp-motion=off] [data-gp-hint]{display:none;}
          ${q}[data-gp-motion=on] [data-gp-content]{margin-top:calc((var(--gp-length) - 1) * var(--gp-height));background:transparent;opacity:var(--gp-reveal,0);pointer-events:none;}
          ${q}[data-gp-motion=on][data-gp-entered=true] [data-gp-content]{pointer-events:auto;}
          @media(prefers-reduced-motion:reduce){${q} [data-gp-pin]{position:relative!important;} ${q} [data-gp-content]{margin-top:0!important;opacity:1!important;background:var(--gp-field)!important;min-height:0;padding-block:64px;} ${q} [data-gp-caption]{opacity:1!important;}}
          @media(prefers-reduced-motion:reduce){${q} [data-gp-hint]{display:none;}}
        `}</style>
        <noscript>
          <style>{`${q} [data-gp-fallback]{display:grid}${q} [data-gp-hint]{display:none}`}</style>
        </noscript>
        <div data-gp-viewport aria-hidden="true" />
        <div ref={pinRef} data-gp-pin>
          {backdrop && <div data-gp-backdrop aria-hidden="true">{backdrop}</div>}
          <svg ref={artRef} data-gp-art aria-hidden="true" focusable="false">
            <defs>
              <clipPath ref={clipRef} id={clipId} clipPathUnits="userSpaceOnUse">
                <text
                  ref={glyphRef}
                  data-gp-glyph
                  x="0"
                  y="0"
                  style={{
                    fontFamily,
                    fontWeight: weight,
                    fontSize: 100,
                    fontKerning: "none",
                    fontVariantLigatures: "none",
                    letterSpacing: 0,
                  }}
                >
                  {text}
                </text>
              </clipPath>
            </defs>
            <rect
              ref={fieldRectRef}
              data-gp-field-rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="var(--gp-field, #ffffff)"
              clipPath={`url(#${clipId})`}
            />
            <g ref={marksRef} data-gp-marks style={{ visibility: annotations ? "visible" : "hidden" }}>
              <path />
            </g>
          </svg>
          <div ref={choicesRef} data-gp-choices role="radiogroup" aria-label="Choose the letter to enter through">
            {characters.map(({ char, index }, i) => (
              <button
                type="button"
                role="radio"
                aria-checked="false"
                tabIndex={-1}
                data-gp-letter={index}
                key={index}
                aria-label={`${char}, letter ${i + 1} of ${characters.length}`}
              />
            ))}
          </div>
          <label data-gp-touch-picker>
            <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
              Entry letter
            </span>
            <select ref={pickerRef} data-gp-select defaultValue="">
              <option value="" disabled>
                Choose a letter
              </option>
              {characters.map(({ char, index }, i) => (
                <option key={index} value={index}>
                  {i + 1} · {char}
                </option>
              ))}
            </select>
          </label>
          {front && <div data-gp-front>{front}</div>}
          <span data-gp-fallback aria-hidden="true" style={{ fontFamily, fontWeight: weight }}>
            {text}
          </span>
          <div data-gp-caption>
            <a data-gp-enter href={`#${uid}-content`}>
              {enterLabel}
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <div ref={contentRef} data-gp-content id={`${uid}-content`}>
          {children}
        </div>
      </section>
    );
  }
