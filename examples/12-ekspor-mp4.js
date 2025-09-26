// Judul: 12 - Ekspor MP4
// Deskripsi: Contoh ini menunjukkan cara mengekspor animasi sebagai file video MP4 menggunakan FFmpeg.wasm.
// Ini adalah proses yang intensif yang mungkin memakan waktu beberapa saat tergantung pada durasi dan resolusi.
// Catatan: Proses ekspor terjadi di browser pengguna dan tidak memerlukan unggahan ke server.

let editor;
let exportButton;
let isExporting = false;
let progress = 0;
let logMessages = [];

function setup() {
  createCanvas(640, 360);
  // Buat instance VideoEditor
  editor = new VideoEditor(p5.instance, {
    canvas: canvas.elt,
  });

  // Buat beberapa klip animasi sederhana
  editor
    .createShapeClip('rect', {
      start: 0,
      duration: 4,
      properties: {
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        fill: 'red',
      },
    })
    .addKeyframe('x', 0, 50)
    .addKeyframe('x', 4000, 490);

  editor
    .createTextClip('Ekspor MP4!', {
      start: 1,
      duration: 3,
      properties: {
        y: 250,
        fontSize: 48,
        fill: 'white',
      },
    })
    .addKeyframe('x', 1000, -300)
    .addKeyframe('x', 4000, 640);

  // Atur total durasi timeline
  editor.timeline.duration = 4000;

  // Buat tombol untuk memulai ekspor
  exportButton = createButton('Ekspor ke MP4');
  exportButton.position(10, 10);
  exportButton.mousePressed(startExport);
}

async function draw() {
  background(220);

  // Perbarui dan render editor
  editor.update(p5.instance);
  await editor.render();

  // Tampilkan status ekspor jika sedang berlangsung
  if (isExporting) {
    // Gambar overlay semi-transparan
    fill(0, 150);
    rect(0, 0, width, height);

    // Tampilkan teks status dan progress bar
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    text('Mengekspor MP4, harap tunggu...', width / 2, height / 2 - 40);

    // Progress bar
    rectMode(CORNER);
    fill(100);
    rect(width / 2 - 150, height / 2, 300, 20);
    fill(0, 255, 0);
    rect(width / 2 - 150, height / 2, 300 * (progress / 100), 20);

    // Tampilkan pesan log terbaru
    textSize(12);
    textAlign(LEFT, BOTTOM);
    text(logMessages.slice(-5).join('\n'), 10, height - 10);
  }
}

function startExport() {
  if (isExporting) return;
  isExporting = true;
  progress = 0;
  logMessages = ['Memulai ekspor...'];
  exportButton.attribute('disabled', true);

  // Panggil metode exportMP4
  editor.exportMP4({
      frameRate: 30,
      filename: 'animasi-keren.mp4',
      onProgress: (p) => {
        progress = p; // p adalah nilai dari 0 hingga 100
      },
      onLog: (message) => {
        console.log(message);
        logMessages.push(message);
      },
    })
    .then(() => {
      console.log('Ekspor selesai!');
      logMessages.push('Ekspor Selesai!');
    })
    .catch((err) => {
      console.error('Ekspor gagal:', err);
      logMessages.push('ERROR: ' + err.message);
    })
    .finally(() => {
      isExporting = false;
      exportButton.removeAttribute('disabled');
    });
}