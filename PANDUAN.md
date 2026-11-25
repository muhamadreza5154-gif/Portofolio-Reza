# 🚀 PANDUAN LENGKAP — Portfolio Website Template

Terima kasih sudah membeli template ini! 🙏
Panduan ini ditulis untuk **pemula total** — kamu tidak perlu paham coding.
Ikuti langkahnya **berurutan** dan jangan ada yang dilewati.

> ⏱️ Estimasi waktu: **45–60 menit** (pertama kali).

---

## 📋 Daftar Isi

1. [Isi Paket](#1-isi-paket)
2. [Install Software yang Dibutuhkan](#2-install-software-yang-dibutuhkan)
3. [Ekstrak & Buka Project](#3-ekstrak--buka-project)
4. [Install Library (npm install)](#4-install-library-npm-install)
5. [Siapkan Database Supabase](#5-siapkan-database-supabase)
6. [Buat File .env](#6-buat-file-env)
7. [Jalankan Website di Komputer](#7-jalankan-website-di-komputer)
8. [Buat Akun Admin & Masuk Dashboard](#8-buat-akun-admin--masuk-dashboard)
9. [Ganti Data Diri](#9-ganti-data-diri)
10. [Ganti Foto & Gambar](#10-ganti-foto--gambar)
11. [Aktifkan Form Kontak](#11-aktifkan-form-kontak)
12. [Online-kan Website (Deploy ke Vercel)](#12-online-kan-website-deploy-ke-vercel)
13. [Troubleshooting](#13-troubleshooting)
14. [Ringkasan Perintah](#14-ringkasan-perintah)

---

## 1. Isi Paket

| File / Folder | Fungsi |
|---|---|
| `src/` | Kode tampilan website |
| `public/` | Foto, ikon, dan gambar |
| `api/comment.js` | Server kecil untuk menyimpan komentar (anti-spam & filter kata kasar) |
| `supabase/setup.sql` | Script untuk membuat database otomatis |
| `supabase/jadikan_admin.sql` | Script untuk menjadikan akunmu admin |
| `.env.example` | Contoh file pengaturan kunci database |
| `PANDUAN.md` | Panduan ini |

**Fitur:** halaman Home dengan animasi parallax, About, Portfolio (Project / Sertifikat / Prestasi), Galeri Foto, Komentar realtime, Form Kontak, dan **Dashboard Admin** untuk menambah/menghapus konten tanpa coding.

**Teknologi:** React + Vite, TailwindCSS, Framer Motion, GSAP, Supabase (database), Vercel (hosting).

---

## 2. Install Software yang Dibutuhkan

Semua gratis. Install **satu per satu**, biarkan semua pilihan default (cukup klik *Next*).

| Software | Link | Catatan |
|---|---|---|
| **Node.js** | https://nodejs.org | Pilih versi **LTS** |
| **VS Code** | https://code.visualstudio.com | Aplikasi untuk membuka kode |

Kamu juga perlu membuat akun (gratis) di:

| Layanan | Link | Fungsi |
|---|---|---|
| **Supabase** | https://supabase.com | Database & penyimpanan gambar |
| **Vercel** | https://vercel.com | Hosting agar website bisa diakses online |

> 💡 Daftar Supabase & Vercel paling mudah pakai tombol **"Continue with GitHub"** atau **Google**.

### ✅ Cek Node.js sudah terinstall

1. Tekan **Windows + R**, ketik `cmd`, tekan **Enter**
2. Ketik perintah ini lalu **Enter**:
   ```
   node -v
   ```
3. Jika muncul angka seperti `v22.x.x` → **berhasil** ✅
4. Jika muncul *"'node' is not recognized"* → **restart komputer**, lalu coba lagi.

---

## 3. Ekstrak & Buka Project

1. Klik kanan file ZIP → **Extract All...** → **Extract**
2. Pindahkan folder `Portfolio-Template` ke tempat yang mudah, misalnya `Documents`
   > ⚠️ Hindari menaruh project di dalam folder OneDrive / Google Drive (sering bikin error).
3. Buka **VS Code** → menu **File → Open Folder...** → pilih folder `Portfolio-Template` → **Select Folder**
4. Jika muncul pertanyaan *"Do you trust the authors?"* → klik **Yes, I trust the authors**

---

## 4. Install Library (npm install)

1. Di VS Code, buka terminal: menu **Terminal → New Terminal**
2. Di panel bawah akan muncul terminal. Ketik:
   ```
   npm install
   ```
3. Tunggu 1–5 menit sampai selesai (banyak teks bergerak itu **normal**).
4. Selesai jika muncul folder baru `node_modules` di panel kiri ✅

> ❌ Jika muncul error *"running scripts is disabled on this system"*:
> ketik `cmd` di terminal lalu Enter, kemudian ulangi `npm install`.

---

## 5. Siapkan Database Supabase

### 5a. Buat project baru
1. Buka https://supabase.com/dashboard → klik **New project**
2. Isi:
   - **Name:** bebas, misal `portfolio`
   - **Database Password:** klik *Generate* lalu **simpan** password-nya
   - **Region:** pilih **Southeast Asia (Singapore)**
3. Klik **Create new project**, tunggu ±2 menit sampai selesai.

### 5b. Buat tabel otomatis
1. Menu kiri → **SQL Editor** → **New query**
2. Di VS Code, buka file `supabase/setup.sql` → tekan **Ctrl + A** lalu **Ctrl + C**
3. Kembali ke Supabase, **paste** (Ctrl + V) → klik **Run**
4. Jika muncul **"Success. No rows returned"** → berhasil ✅

### 5c. Ambil 3 kunci (simpan di Notepad dulu)
Klik ikon ⚙️ **Project Settings** di menu kiri bawah:

| Yang dicari | Lokasi | Contoh bentuknya |
|---|---|---|
| **Project URL** | *Data API* (atau tombol **Connect** di bagian atas) | `https://abcdxyz.supabase.co` |
| **Publishable key** (dulu: *anon key*) | *API Keys* | `sb_publishable_...` |
| **Secret key** (dulu: *service_role*) | *API Keys* → klik **Reveal** | `sb_secret_...` |

> 🔒 **Secret key itu RAHASIA.** Jangan dikirim ke siapa pun & jangan dipasang di kode.

---

## 6. Buat File .env

File `.env` berisi kunci untuk menghubungkan website ke database kamu.

1. Di panel kiri VS Code, klik kanan file **`.env.example`** → **Copy**, lalu klik kanan area kosong → **Paste**
2. Klik kanan file hasil copy → **Rename** → ubah namanya menjadi persis **`.env`**
3. Buka file `.env`, lalu ganti isinya dengan kunci dari langkah 5c:
   ```
   VITE_SUPABASE_URL=https://abcdxyz.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxx
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxxxxxxxxx
   ```
4. Tekan **Ctrl + S** untuk menyimpan.

> ⚠️ Pastikan: tidak ada spasi di sekitar tanda `=`, dan file `.env` sejajar dengan `package.json` (bukan di dalam folder lain).

---

## 7. Jalankan Website di Komputer

1. Di terminal VS Code ketik:
   ```
   npm run dev
   ```
2. Akan muncul:
   ```
   ➜  Local:   http://localhost:5173/
   ```
3. Tahan **Ctrl** lalu klik link tersebut → website terbuka di browser 🎉
4. Untuk mematikan: klik terminal, tekan **Ctrl + C**

> ℹ️ Selama database masih kosong, website menampilkan **data contoh** ("Contoh Project 1", dst). Itu normal — akan otomatis hilang setelah kamu menambah data asli di Dashboard.
>
> ℹ️ **Kirim komentar** baru bisa berfungsi setelah website di-online-kan ke Vercel (langkah 12), karena fitur itu memakai server Vercel.

---

## 8. Buat Akun Admin & Masuk Dashboard

Dashboard dipakai untuk menambah Project, Sertifikat, Pengalaman, Galeri, dan mengelola Komentar.

1. Supabase → menu **Authentication** → **Users** → **Add user** → **Create new user**
2. Isi **email & password** milikmu, **centang "Auto Confirm User"** → **Create user**
3. Buka file `supabase/jadikan_admin.sql` di VS Code, ganti `EMAIL_KAMU@gmail.com` dengan email tadi
4. Copy semua isinya → Supabase **SQL Editor** → **New query** → paste → **Run**
5. Di bawah akan muncul tabel berisi email kamu dengan role **admin** ✅
6. Buka **http://localhost:5173/login** → masuk dengan email & password tadi → kamu akan masuk ke **Dashboard** 🎉

---

## 9. Ganti Data Diri

Semua data pribadi sudah diganti dengan kata kunci yang **mudah dicari**. Cara tercepat:

1. Di VS Code tekan **Ctrl + Shift + F** (Search di semua file)
2. Cari kata kunci di bawah satu per satu, lalu ganti dengan datamu:

| Cari kata ini | Ganti dengan |
|---|---|
| `Nama Kamu` | Nama lengkapmu |
| `username` | Username Instagram / GitHub / LinkedIn / TikTok kamu |
| `domain-kamu.vercel.app` | Alamat website kamu (didapat setelah langkah 12) |
| `emailkamu@gmail.com` | Email untuk menerima pesan dari form kontak |
| `ganti-dengan-link-cv-kamu` | Link CV kamu (misal link Google Drive) |
| `Contoh` / `Nama Universitas` / `Nama Perusahaan` | Riwayat pendidikan & pengalamanmu |

**Lokasi file penting** (jika ingin mengedit manual):

| File | Isi yang bisa diganti |
|---|---|
| `index.html` | Judul tab browser, deskripsi Google (SEO) |
| `src/Pages/Home.jsx` | Judul & deskripsi SEO halaman utama |
| `src/Pages/About.jsx` | Nama, deskripsi diri, link CV, **riwayat pendidikan** (`EDUCATION_DATA`) |
| `src/components/SocialLinks.jsx` | Link sosial media di bagian kontak |
| `src/components/ui/parallax-forest-hero.jsx` | Link sosial media di hero |
| `src/components/ui/ParallaxForestSection.jsx` | Nama di bagian parallax |
| `src/components/ui/spotify-card.jsx` | Playlist Spotify (ganti link embed) |
| `src/components/Footer.jsx` | Nama di footer |
| `src/Pages/Contact.jsx` | Email penerima form kontak |
| `public/robots.txt`, `public/sitemap.xml` | Alamat website |

> 💡 Simpan setiap perubahan dengan **Ctrl + S**. Jika `npm run dev` sedang jalan, browser akan **otomatis ter-update**.

> ✅ **Project, Sertifikat, Prestasi, Pengalaman, dan Galeri** tidak perlu diedit di kode — tambahkan saja lewat **Dashboard**.

---

## 10. Ganti Foto & Gambar

Siapkan fotomu, lalu **timpa (replace)** file di folder `public/` dengan **nama file yang sama persis**:

| File di `public/` | Tampil di |
|---|---|
| `Photo.webp` | Foto profil di halaman About |
| `PhotoSpiderman.webp` | Foto efek "reveal" saat kursor diarahkan ke foto profil |
| `fotoEvent.jpeg` | Foto di bagian Social Links / Contact |
| `img30.svg` | Karakter/sosok di animasi parallax Home |
| `default-avatar.jpg` | Avatar default untuk komentar tanpa foto |

> 💡 Tips: foto profil sebaiknya **latar transparan** (PNG/WebP). Hapus background gratis di https://remove.bg lalu konversi ke WebP di https://squoosh.app.
>
> Jika format filemu berbeda (misal `.png`), ganti juga nama filenya di kode. Contoh: cari `Photo.webp` dengan Ctrl + Shift + F lalu ubah menjadi `Photo.png`.

---

## 11. Aktifkan Form Kontak

Form kontak memakai layanan gratis **FormSubmit** (tanpa daftar akun).

1. Pastikan email di `src/Pages/Contact.jsx` sudah diganti dengan email kamu (langkah 9)
2. Buka website → isi & kirim form kontak **satu kali** sebagai percobaan
3. Cek inbox email kamu (cek juga folder **Spam**) → ada email dari FormSubmit → klik **Activate Form**
4. Selesai! Pesan berikutnya akan langsung masuk ke email kamu ✅

---

## 12. Online-kan Website (Deploy ke Vercel)

Cara paling mudah untuk pemula — **tanpa GitHub**, langsung dari terminal VS Code.

### 12a. Upload pertama
1. Matikan `npm run dev` dulu (**Ctrl + C**)
2. Di terminal ketik:
   ```
   npx vercel
   ```
3. Jika ditanya *"Ok to proceed?"* ketik `y` → Enter
4. Pilih **Continue with GitHub/Google/Email** → browser terbuka → login → kembali ke VS Code
5. Jawab pertanyaan berikut (cukup tekan **Enter** untuk memakai jawaban default):
   - *Set up and deploy?* → **Y**
   - *Which scope?* → Enter
   - *Link to existing project?* → **N**
   - *Project name?* → ketik nama, misal `portfolio-namakamu`
   - *In which directory is your code located?* → Enter
   - *Want to modify these settings?* → **N**
6. Tunggu sampai selesai.

### 12b. Masukkan kunci database di Vercel
1. Buka https://vercel.com/dashboard → klik project kamu
2. **Settings → Environment Variables** → tambahkan **3 variabel** ini (isi sama dengan file `.env`):

   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Secret key |

3. Klik **Save** untuk masing-masing.

### 12c. Upload versi final
Kembali ke terminal VS Code, ketik:
```
npx vercel --prod
```
Setelah selesai akan muncul link seperti `https://portfolio-namakamu.vercel.app` → **website kamu sudah online!** 🎉🌍

> 🔁 Setiap kali kamu mengubah kode, cukup jalankan lagi `npx vercel --prod`.
>
> 📝 Jangan lupa ganti `domain-kamu.vercel.app` (langkah 9) dengan alamat asli website-mu, lalu deploy ulang.

> 💡 **Alternatif (opsional):** upload project ke GitHub memakai aplikasi **GitHub Desktop**, lalu di Vercel klik **Add New → Project → Import** repository tersebut. Dengan cara ini website otomatis ter-update setiap kamu *push* ke GitHub. Tetap isi 3 Environment Variables di atas.

---

## 13. Troubleshooting

| Masalah | Solusi |
|---|---|
| `'npm' is not recognized` | Node.js belum terinstall / perlu restart komputer |
| `running scripts is disabled on this system` | Ketik `cmd` di terminal lalu Enter, ulangi perintah. Atau di terminal pilih ikon **˅** → **Command Prompt** |
| Muncul error *"Missing Supabase URL..."* / website putih kosong | File `.env` belum dibuat / salah nama / salah isi. Cek langkah 6, lalu **Ctrl + C** dan `npm run dev` lagi |
| Data dari Dashboard tidak muncul | Tekan **Ctrl + Shift + R** di browser (website menyimpan cache data) |
| Login: *"Access denied"* | Akunmu belum jadi admin → jalankan `supabase/jadikan_admin.sql` dengan email yang benar |
| Login: *"Invalid login credentials"* | Email/password salah, atau lupa centang *Auto Confirm User* saat membuat user |
| Upload gambar di Dashboard gagal | Pastikan `setup.sql` sudah di-Run sampai sukses dan kamu login sebagai admin |
| Komentar gagal dikirim (di localhost) | Normal. Fitur komentar hanya jalan setelah deploy ke Vercel |
| Komentar gagal dikirim (di Vercel) | Cek 3 Environment Variables di Vercel, lalu `npx vercel --prod` lagi |
| Komentar ditolak | Komentar mengandung kata kasar / link / terlalu cepat (maks 2 komentar per menit) — ini fitur anti-spam |
| `Port 5173 is already in use` | Tutup terminal lain yang menjalankan `npm run dev`, atau pakai link port lain yang muncul |
| Form kontak tidak masuk email | Lakukan aktivasi FormSubmit (langkah 11), cek folder Spam |
| Website lambat di HP lama | Wajar, banyak animasi. Gunakan gambar ukuran kecil (format WebP) |

---

## 14. Ringkasan Perintah

| Perintah | Fungsi |
|---|---|
| `npm install` | Install semua library (cukup sekali di awal) |
| `npm run dev` | Jalankan website di komputer (http://localhost:5173) |
| `npm run build` | Cek apakah project bisa di-build tanpa error |
| `npx vercel` | Upload pertama ke Vercel |
| `npx vercel --prod` | Upload versi final / update website |
| `Ctrl + C` | Mematikan server yang sedang berjalan |

| Halaman | Alamat |
|---|---|
| Website utama | `/` |
| Login admin | `/login` |
| Dashboard admin | `/dashboard` |

---

Selamat, website portfolio-mu sudah jadi! 🎉
Jika masih mengalami kendala, salin pesan error (teks merah di terminal) lalu hubungi penjual.
