# P5.VIDEOEDITOR.JS

![Version](https://img.shields.io/badge/version-3.9.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![p5.js](https://img.shields.io/badge/p5.js-v1.9.0-orange)
![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)

> Sebuah framework motion design canggih untuk membuat video berbasis kode di p5.js.

P5.VideoEditor.JS adalah sebuah library yang memperluas fungsionalitas p5.js untuk memungkinkan pembuatan animasi dan video yang kompleks dengan sistem timeline berbasis keyframe yang intuitif. Jika Anda familiar dengan software seperti After Effects, konsepnya akan terasa sangat alami.

## Fitur Utama (Features)

*   **Timeline & Keyframing:** Animasikan properti apa pun dari waktu ke waktu dengan keyframe.
*   **Sistem Klip:** Atur proyek Anda dengan `TextClip`, `ShapeClip`, `ImageClip`, dan banyak lagi.
*   **Efek Dinamis:** Tambahkan efek seperti `Wiggle`, `Typewriter`, atau `AudioReactive` dengan mudah.
*   **Parenting:** Tautkan klip satu sama lain untuk membuat animasi hierarkis yang kompleks.
*   **Easing Functions:** Lebih dari 20 fungsi easing untuk memberikan "rasa" yang pas pada animasi Anda.
*   **Masking:** Gunakan satu klip untuk menampilkan atau menyembunyikan bagian dari klip lain.
*   **Modul Ekspor:** Ekspor kreasi Anda ke format video atau gambar berurutan dengan bantuan `CCapture.js`.
*   **Debugging Visual:** Tampilkan timeline dan informasi klip langsung di atas kanvas Anda untuk memudahkan debugging.

## Instalasi & Penggunaan (Installation & Setup)

Cara termudah untuk menggunakan P5.VideoEditor.JS adalah dengan menambahkannya langsung ke file `index.html` Anda dari CDN. Pastikan untuk menyertakan p5.js terlebih dahulu.

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/p5.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/p5.videoeditor@3.9.0/dist/p5.videoeditor.min.js"></script>
    <script src="sketch.js"></script>
  </head>
  <body>
  </body>
</html>
```
*(Catatan: URL CDN di atas adalah contoh. Setelah proyek ini benar-benar dipublikasikan ke npm, URL ini akan berfungsi).*

## Mulai Cepat (Quick Start)

Berikut adalah contoh kode minimal yang bisa langsung Anda salin ke file `sketch.js` Anda untuk melihat hasilnya.

```javascript
// sketch.js

let timeline;

function setup() {
  createCanvas(1280, 720);

  // Inisialisasi timeline
  timeline = new Timeline();

  // Buat klip persegi merah yang berdurasi 3 detik
  const rectClip = new ShapeClip('rect', 0, 3, {
    x: width / 2,
    y: height / 2,
    w: 150,
    h: 150,
    color: 'red'
  });

  // Animasikan skalanya dari 0 ke 1, lalu kembali ke 0
  rectClip.addKeyframe(0, { scale: 0 });
  rectClip.addKeyframe(1, { scale: 1 }, Easing.easeOutBounce);
  rectClip.addKeyframe(2, { scale: 1 });
  rectClip.addKeyframe(3, { scale: 0 }, Easing.easeInBack);

  // Animasikan rotasinya
  rectClip.addKeyframe(0, { rotation: 0 });
  rectClip.addKeyframe(3, { rotation: PI });

  // Tambahkan klip ke timeline
  timeline.add(rectClip);

  // Aktifkan mode debug untuk melihat apa yang terjadi
  timeline.setDebug(true);
}

function draw() {
  background(10, 20, 30);

  // Perbarui dan render timeline setiap frame
  timeline.update();
}
```

## Dokumentasi & Contoh Lainnya

*   **Dokumentasi API:** Untuk penjelasan detail tentang setiap kelas dan metode, silakan kunjungi [Dokumentasi API kami](https://username.github.io/p5-videoeditor/) (Tautan ini akan aktif setelah GitHub Pages diatur).
*   **Folder Contoh:** Jelajahi folder [`/examples`](./examples) untuk melihat berbagai skenario penggunaan, dari animasi teks sederhana hingga efek reaktif audio.

## Cara Berkontribusi (Contributing)

Kontribusi sangat kami harapkan! Baik itu laporan bug, permintaan fitur, atau pengiriman kode, semua bantuan sangat dihargai. Silakan baca [Panduan Berkontribusi](./CONTRIBUTING.md) untuk memulai.

## Lisensi (License)

Proyek ini dirilis di bawah **Lisensi MIT**. Lihat file [LICENSE](./LICENSE) untuk detail lengkap.
