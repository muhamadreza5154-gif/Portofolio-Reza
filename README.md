# Portfolio Website Template

Website portfolio modern dengan animasi parallax, dashboard admin, dan komentar realtime.

**Stack:** React 18 · Vite · TailwindCSS · Framer Motion · GSAP · Supabase · Vercel

## 👉 Mulai dari sini

Baca **[PANDUAN.md](./PANDUAN.md)** — panduan langkah demi langkah untuk pemula
(install, setup database, ganti data diri, sampai website online).

## Ringkas (untuk yang sudah terbiasa)

```bash
npm install
cp .env.example .env        # isi kunci Supabase
# jalankan supabase/setup.sql di Supabase SQL Editor
npm run dev
```

Deploy: `npx vercel --prod` (isi `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` di Vercel → Settings → Environment Variables).
