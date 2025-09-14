# Berkontribusi untuk p5.videoeditor.js

Terima kasih banyak atas minat Anda untuk berkontribusi pada `p5.videoeditor.js`! Kami sangat menghargai bantuan dari komunitas. Panduan ini akan membantu Anda memulai.

## Cara Berkontribusi

Kami menyambut berbagai jenis kontribusi, termasuk:

- **Laporan Bug**: Jika Anda menemukan bug, silakan buat _issue_ baru.
- **Permintaan Fitur**: Punya ide untuk fitur baru atau peningkatan? Buat _issue_ untuk mendiskusikannya.
- **Pull Request**: Jika Anda ingin langsung berkontribusi pada kode, dokumentasi, atau contoh, silakan kirimkan _Pull Request_.

## Menyiapkan Lingkungan Pengembangan

Untuk memulai pengembangan secara lokal, ikuti langkah-langkah berikut:

1.  **Fork Repositori**
    Klik tombol "Fork" di sudut kanan atas halaman GitHub repositori ini.

2.  **Clone Fork Anda**
    Clone repositori yang telah Anda _fork_ ke mesin lokal Anda:

    ```bash
    git clone https://github.com/NAMA_PENGGUNA_ANDA/p5.videoeditor.js.git
    cd p5.videoeditor.js
    ```

3.  **Instal Dependensi**
    Proyek ini menggunakan `npm` untuk manajemen dependensi. Jalankan perintah berikut di direktori root proyek:

    ```bash
    npm install
    ```

4.  **Jalankan Contoh Proyek**
    Untuk melihat perubahan Anda secara langsung, jalankan server pengembangan lokal. Ini akan menyajikan file proyek dan contoh di `http://localhost:8080`.
    ```bash
    npm start
    ```
    Buka `http://localhost:8080/examples/01-basic-timeline/` di browser Anda untuk melihat contoh dasar berjalan.

## Alur Kerja Pull Request (PR)

Kami mengikuti alur kerja standar berbasis _branch_ untuk kontribusi kode.

1.  **Buat Branch Baru**
    Pastikan Anda memulai dari _branch_ `main` yang terbaru, lalu buat _branch_ baru untuk perubahan Anda:

    ```bash
    git checkout main
    git pull origin main
    git checkout -b nama-fitur-atau-perbaikan-anda
    ```

    Contoh: `git checkout -b feat/add-blur-effect` atau `git checkout -b fix/timeline-bug`

2.  **Buat Perubahan dan Commit**
    Lakukan perubahan kode Anda. Pastikan untuk menulis pesan _commit_ yang jelas dan deskriptif.

3.  **Jalankan Tes**
    Sebelum mengirimkan PR, pastikan semua pengujian unit berhasil.

    ```bash
    npm test
    ```

4.  **Push ke Branch Anda**
    Unggah perubahan Anda ke repositori _fork_ Anda di GitHub:

    ```bash
    git push origin nama-fitur-atau-perbaikan-anda
    ```

5.  **Buka Pull Request**
    Buka halaman repositori `p5.videoeditor.js` di GitHub dan Anda akan melihat _prompt_ untuk membuka _Pull Request_ dari _branch_ yang baru saja Anda _push_. Isi templat PR dengan deskripsi perubahan Anda.

## Standar Kode

Untuk menjaga konsistensi gaya kode di seluruh proyek, kami menggunakan _linter_.

- **Jalankan Linter**: Untuk memeriksa apakah kode Anda sesuai dengan standar, jalankan:
  ```bash
  npm run lint
  ```
  _(Catatan: Konfigurasi linter seperti ESLint sedang dalam proses penyiapan.)_

## Melaporkan Bug

Laporan bug yang baik sangat membantu kami. Saat melaporkan bug, harap sertakan informasi berikut jika memungkinkan:

- **Versi Browser & Sistem Operasi**: Contoh: Chrome 105 di Windows 11.
- **Perilaku yang Diharapkan**: Apa yang seharusnya terjadi?
- **Perilaku Aktual**: Apa yang sebenarnya terjadi? Sertakan pesan _error_ atau _screenshot_ jika ada.
- **Langkah-langkah untuk Mereproduksi**: Berikan cuplikan kode atau langkah-langkah yang jelas yang dapat kami ikuti untuk mereproduksi bug tersebut.

Sekali lagi, terima kasih telah berkontribusi!
