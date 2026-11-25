import { useEffect } from "react";

const EMBED_URL =
  "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator&theme=0";

export default function SpotifyCard({ className = "" }) {
  useEffect(() => {
    // Dua bug di versi sebelumnya:
    // 1. restoreTo tidak update lastSettledY & tidak cancel settleTimer
    //    → settle timer masih bisa fire 200ms kemudian dan set lastSettledY ke
    //      posisi Spotify (salah), sehingga restore berikutnya ke posisi salah.
    // 2. Setelah restore, window MASIH blurred ke iframe.
    //    → Auto-advance berikutnya tidak trigger blur lagi → tidak ter-catch.
    //
    // Fix:
    // • restoreTo langsung set lastSettledY + clear settleTimer
    // • Setelah restore, panggil document.body.focus() → window regain focus
    //   → setiap track change / auto-advance berikutnya pasti trigger blur lagi

    let lastSettledY = window.scrollY;
    let settleTimer = null;
    let isRestoring = false;
    const timers = [];

    const schedule = (fn, ms) => timers.push(setTimeout(fn, ms));

    const restoreTo = (y) => {
      isRestoring = true;
      lastSettledY = y;           // sync langsung — jangan tunggu settleTimer
      clearTimeout(settleTimer);  // batalkan update stale yang mungkin masih pending
      window.scrollTo({ top: y, left: 0, behavior: "instant" });
      requestAnimationFrame(() => {
        isRestoring = false;
        // Kembalikan fokus ke body → window punya fokus lagi
        // → auto-advance / track-change BERIKUTNYA pasti trigger blur
        try { document.body.focus({ preventScroll: true }); } catch (_) {}
      });
    };

    // Catat posisi scroll setelah 200ms berhenti (debounce)
    const onScroll = () => {
      if (isRestoring) return;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        lastSettledY = window.scrollY;
      }, 200);
    };

    // Blur = window kehilangan fokus ke iframe (klik track / auto-advance)
    const onBlur = () => {
      const y = lastSettledY;
      restoreTo(y);
      schedule(() => restoreTo(y), 80); // retry untuk blur yang fire sebelum scroll
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", onBlur);
      timers.forEach(clearTimeout);
      clearTimeout(settleTimer);
    };
  }, []);

  return (
    <section
      className={`group relative w-full max-w-[470px] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.07)] shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-[rgba(37,99,235,0.35)] hover:shadow-[0_0_30px_rgba(37,99,235,0.12)] ${className}`}
      style={{ background: "rgba(255,255,255,0.03)" }}
      aria-label="Spotify player"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(37,99,235,0.08) 0%, transparent 70%)" }}
      />
      <div className="relative p-6 pb-2 mt-2">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-3">Daily Rotation</h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-4">My Spotify Playlist...</p>
      </div>
      <div className="relative p-2 pt-0">
        <iframe
          title="Spotify Playlist"
          src={EMBED_URL}
          width="100%"
          height="352"
          loading="lazy"
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="relative block overflow-hidden rounded-xl border-0 w-full"
        />
      </div>
    </section>
  );
}

