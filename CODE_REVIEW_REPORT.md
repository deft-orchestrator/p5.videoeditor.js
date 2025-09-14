# Checklist Tinjauan Kode: p5.videoeditor.js

Dokumen ini adalah ringkasan yang dapat ditindaklanjuti dari laporan tinjauan kode asli. Gunakan checklist ini untuk melacak penyelesaian tugas-tugas perbaikan.

---

### ✅ Prioritas 1: Keamanan & Bug Kritis

- [x] **Perbaiki Kerentanan XSS (Kritis):** Validasi `videoSrc` di `src/clips/VideoClip.js` untuk hanya mengizinkan protokol URL yang aman (`http:`, `https:`, `blob:`, `data:`) dan secara eksplisit menolak skema berbahaya seperti `javascript:`.
- [x] **Perbaiki Bug Sinkronisasi Waktu Video (Tinggi):** Di `src/clips/VideoClip.js`, pastikan `videoElement.currentTime` disetel ke `relativeTime / 1000` di dalam metode `update` untuk memastikan sinkronisasi yang benar saat mencari (seeking) timeline.
- [x] **Perbaiki Crash pada Transisi (Tinggi):** Tambahkan `import ErrorHandler from '../utils/ErrorHandler.js';` di `src/core/Timeline.js` untuk mencegah crash saat mencoba menggunakan tipe transisi yang tidak ada.

---

### ✅ Prioritas 2: Infrastruktur & Proses Build

- [x] **Implementasikan Proses Build dengan Rollup.js:**
  - [x] Tambahkan `rollup`, `@rollup/plugin-node-resolve`, dan `@rollup/plugin-terser` ke `devDependencies`.
  - [x] Buat file `rollup.config.js` untuk menghasilkan output UMD dan ESM.
  - [x] Tambahkan skrip `"build": "rollup -c"` ke `package.json`.
  - [x] Perbarui properti `main` di `package.json` untuk menunjuk ke file hasil build.
- [x] **Siapkan Linter dan Formatter:**
  - [x] Tambahkan `eslint` dan `prettier` ke `devDependencies`.
  - [x] Konfigurasikan aturan dasar ESLint dan Prettier.
  - [x] Tambahkan skrip `lint` dan `format` ke `package.json`.

---

### ✅ Prioritas 3: Peningkatan Kualitas Kode & API

- [x] **Refactor Metode `RenderEngine.render`:**
  - [x] Pecah metode `render` yang panjang menjadi fungsi-fungsi privat yang lebih kecil (`_renderSceneToBuffer`, `_applyPostProcessing`, dll.).
  - [x] Perbaiki logika _ping-pong buffer_ untuk _post-processing_ agar dapat menangani beberapa efek dengan benar.
- [x] **Sentralisasi Logika Klip Aktif:**
  - [x] Buat satu metode privat di `Timeline.js` (misalnya, `_getRenderState(time)`) untuk menghilangkan duplikasi logika dalam `update` dan `render`.
- [x] **Terapkan Pola Pabrik (Factory Pattern) untuk API:**
  - [x] Buat metode seperti `editor.createTextClip(...)` yang menangani pembuatan dan penambahan klip dalam satu panggilan.
  - [x] Buat metode `addKeyframe` dan `addEffect` dapat di-chain dengan mengembalikan `this`.
- [x] **Tunda Pembuatan Elemen DOM:** Di `VideoClip.js`, pindahkan `document.createElement('video')` dari konstruktor ke pemanggilan `render` atau `update` pertama untuk mempermudah pengujian.

---

### ✅ Prioritas 4: Dokumentasi & Pengujian

- [x] **Perbarui Dokumentasi Pengguna:**
  - [x] Tulis ulang `README.md` agar secara akurat mencerminkan fungsionalitas **saat ini**.
  - [x] Pindahkan konten visi jangka panjang ke file terpisah seperti `VISION.md`.
- [x] **Lengkapi Dokumentasi Kode (JSDoc):**
  - [x] Lakukan peninjauan untuk menambahkan anotasi `@returns` dan `@example` yang hilang pada metode-metode publik utama.
- [x] **Perluas Cakupan Pengujian:**
  - [x] Buat tes regresi untuk bug yang diidentifikasi di atas (XSS, sinkronisasi video, crash transisi).
  - [x] Tambahkan tes untuk _edge cases_ (misalnya, durasi klip nol, mencari di luar batas).
  - [x] Kembangkan setidaknya satu tes integrasi dasar yang membangun timeline sederhana dan memverifikasi hasilnya.
