# PRD — Project Workspace (Divisi Proyek)

> Aplikasi web internal berbasis AI untuk **tim proyek** pengembang perumahan.
> Dokumen ini dipakai untuk membuat **DESIGN** lebih dulu, sebelum ngoding.
> Nama produk bebas diganti.

> **Catatan turunan:** dokumen ini mengikuti struktur & prinsip desain PRD *Harmoni AI Workspace*, tetapi 4 menu intinya diganti sesuai kebutuhan divisi proyek. Sidebar tetap 5 item.

---

## 1. Ringkasan (1 paragraf)

Satu aplikasi web tempat tim proyek bisa: **menghitung kelayakan sebuah rencana proyek** sebelum diputuskan, **memantau pekerjaan di lapangan** lewat laporan & temuan harian, **menghitung perkiraan biaya bangunan langsung dari gambar konstruksi**, dan **menumpuk (overlay) gambar antar-disiplin** — struktur, arsitektur, MEP, interior — untuk menemukan ketidakcocokan sejak awal. Semua jalan di browser, tayang lewat Vercel. Tanpa install apa pun.

## 2. Pengguna & tujuan

| Pengguna | Butuh apa |
|----------|-----------|
| Manajer Proyek / PM | gambaran cepat status semua proyek, keputusan lanjut/tidak dari studi kelayakan |
| Pengawas / Site Engineer | isi laporan harian & foto dari HP di lapangan, catat temuan |
| Estimator / QS | hitung volume & biaya dari gambar, susun BoQ, kelola basis harga |
| Drafter / Koordinator Gambar | cek tumpang tindih antar-disiplin sebelum gambar turun ke lapangan |
| Manajemen / Direksi | ringkasan progres, deviasi biaya & jadwal, angka kelayakan |

**Tujuan produk:** memangkas waktu hitung & koordinasi gambar dari hari jadi jam, dan membuat kondisi lapangan terlihat tanpa harus menunggu rapat mingguan.

## 3. Prinsip desain (buat Claude Design)

- **Gaya:** bersih, profesional, modern — nuansa *proptech / konstruksi*, bukan mainan.
- **Layout:** sidebar kiri tetap (navigasi) bisa di-minimize, konten utama di kanan. Topbar tipis berisi judul menu + **pemilih proyek aktif** + avatar user.
- **Warna:** netral (putih/abu) + **1 warna aksen** (hijau zaitun atau emas). Dukung mode terang & gelap.
- **Warna disiplin (khusus menu Komposit Gambar):** ARS abu-gelap, STR biru, MEP oranye, INT hijau. Konsisten di seluruh aplikasi (legenda, badge, garis).
- **Bahasa UI:** Bahasa Indonesia. Istilah teknis lapangan tetap dipakai apa adanya (BoQ, AHSP, kurva S, MEP).
- **Responsif:** rapi di laptop & HP. **Menu Supervisi Lapangan wajib nyaman dipakai satu tangan di HP** — itu satu-satunya menu yang dipakai sambil berdiri di lokasi. Menu lain boleh diutamakan untuk layar besar.
- **Nuansa:** ramah tapi kredibel; tombol jelas; banyak ruang kosong; kartu (card) untuk mengelompokkan; angka penting ditampilkan besar dan mudah dibaca.

## 4. Struktur navigasi — DIKUNCI (jangan ditambah/dikurangi)

Sidebar berisi **5 item**:

1. **Dashboard** — ringkasan & pintu masuk
2. **Studi Kelayakan** — hitung kelayakan rencana proyek (feasibility study)
3. **Supervisi Lapangan** — laporan, progres, dan temuan di lokasi
4. **Estimasi Biaya** — hitung volume & biaya dari gambar konstruksi
5. **Komposit Gambar** — overlay gambar STR / ARS / MEP / INT

> Empat menu inti (2–5) = fitur yang dibangun. Menu tidak boleh bertambah tanpa update PRD.

**Konteks proyek:** hampir semua layar bergantung pada "proyek yang sedang dipilih". Pemilih proyek ada di topbar dan nilainya bertahan saat pindah menu.

## 5. Detail tiap layar

### 5.1 Dashboard

- Sapaan ("Halo, [nama] 👋") + tanggal.
- **Baris kartu metrik** untuk proyek aktif: progres realisasi vs rencana (%), deviasi jadwal (hari), nilai kontrak vs realisasi biaya, jumlah temuan terbuka.
- 4 **kartu menu besar** (Studi Kelayakan, Supervisi Lapangan, Estimasi Biaya, Komposit Gambar) — tiap kartu ada ikon, judul, 1 kalimat penjelas, tombol "Buka".
- Panel "Aktivitas terakhir": laporan harian terakhir, estimasi terakhir dibuat, temuan koordinasi baru — boleh pakai data contoh dulu.
- Panel "Perlu perhatian": temuan prioritas tinggi yang lewat tenggat.

### 5.2 Studi Kelayakan

- **Form input** dikelompokkan dalam beberapa kartu, bukan satu form panjang:
  - *Lahan:* lokasi, luas lahan, harga lahan, KDB/KLB/KDH.
  - *Rencana produk:* tipe unit, jumlah unit per tipe, luas bangunan, luas kavling, harga jual per tipe.
  - *Biaya:* biaya konstruksi per m², infrastruktur & prasarana, perizinan, marketing, overhead.
  - *Keuangan & waktu:* durasi proyek, rencana penjualan per periode (absorpsi), porsi pinjaman, bunga, pajak.
- Tombol **Hitung**.
- **Hasil** ditampilkan terstruktur:
  - Ringkasan eksekutif + **verdict jelas** (Layak / Marginal / Tidak layak) dengan alasan singkat.
  - Kartu metrik besar: **NPV, IRR, Payback Period, Margin, BEP (unit terjual)**.
  - **Tabel proyeksi arus kas** per periode + grafik garis kumulatif.
  - **Analisis sensitivitas:** slider untuk harga jual, biaya konstruksi, dan kecepatan penjualan (±10–20%) → metrik ikut berubah *langsung*, plus tabel/heatmap ringkas skenario terburuk–terbaik.
- **Skenario:** simpan hasil sebagai skenario bernama; bisa **bandingkan 2–3 skenario berdampingan** dalam satu tabel.
- Tombol **Ekspor** (PDF ringkasan / Excel rincian).
- Empty state: "Belum ada studi kelayakan. Mulai dari data lahan."

### 5.3 Supervisi Lapangan

**Dirancang mobile-first.**

- **Daftar proyek** (kartu: nama, lokasi, progres, jumlah temuan terbuka) → masuk ke **detail proyek** dengan tab: *Laporan · Progres · Temuan · Foto*.
- **Laporan harian** — form pendek: tanggal, cuaca, jumlah tenaga kerja per tukang, material masuk, alat, catatan kendala, dan **progres per item pekerjaan (%)**. Tombol simpan besar di bawah, mudah dijangkau jempol.
- **Foto lapangan:** ambil/upload foto, otomatis kena cap waktu, diberi kategori (Progres / Temuan / K3) dan lokasi (blok–unit–lantai). Tampil sebagai galeri grid.
- **Progres:** **kurva S rencana vs realisasi** + tabel bobot pekerjaan. Deviasi negatif ditandai merah.
- **Temuan / defect list:** judul, lokasi, foto, disiplin terkait, prioritas, PIC, tenggat, status (**Terbuka → Perbaikan → Verifikasi → Selesai**). Tampilan tabel di laptop, kartu bertumpuk di HP. Filter per status & prioritas.
- **Checklist inspeksi** per tahap pekerjaan (pondasi, struktur, dinding, atap, MEP, finishing) — centang + catatan + foto.
- **Rangkuman AI:** tombol "Buat ringkasan mingguan" → AI menyusun ringkasan dari laporan & temuan minggu itu untuk dikirim ke manajemen. Hasil bisa diedit sebelum dipakai.
- Empty state per tab.

### 5.4 Estimasi Biaya (dari gambar konstruksi)

- **Upload gambar** konstruksi: PDF (denah, potongan, detail), atau gambar JPG/PNG hasil ekspor. Daftar gambar tampil sebagai kartu dengan nama, disiplin, lantai, dan status.
- **Kalibrasi skala — langkah wajib sebelum mengukur.** User menarik garis di atas satu dimensi yang diketahui (mis. grid 6.000 mm) lalu memasukkan panjang sebenarnya. Sebelum dikalibrasi, alat ukur terkunci dan muncul petunjuk jelas.
- **Alat ukur** di toolbar viewer: ukur **panjang**, **luas**, dan **hitung jumlah objek** (kolom, pintu, titik lampu). Setiap hasil pengukuran langsung masuk ke daftar item di panel kanan dan tetap terlihat sebagai anotasi di gambar.
- **Bantuan AI (usulan, bukan keputusan):** tombol "Deteksi elemen" → AI mengusulkan daftar elemen & volume awal (dinding, kolom, pintu, jendela). Tiap usulan muncul dengan **badge tingkat keyakinan** dan **wajib dicentang "Diverifikasi"** oleh user sebelum ikut dihitung. Item yang belum diverifikasi ditandai berbeda dan tidak masuk total final.
- **Tabel BoQ** yang bisa diedit langsung: kode, uraian pekerjaan, volume, satuan, harga satuan, jumlah. Dikelompokkan per kelompok pekerjaan (Persiapan, Struktur, Arsitektur, MEP, Finishing).
- **Rekapitulasi:** subtotal per kelompok, overhead & profit (%), PPN, total. Ditampilkan sebagai kartu ringkas di atas tabel.
- **Basis Harga:** sub-halaman berisi daftar harga satuan pekerjaan (rujukan AHSP/HSPK daerah), bisa diedit dan **diimpor dari Excel**. Harga satuan di BoQ mengambil dari sini, tapi tetap bisa ditimpa manual per item.
- Tombol **Ekspor BoQ ke Excel**.
- **Banner permanen** di atas hasil: "Ini estimasi awal berbasis pembacaan gambar — wajib diverifikasi estimator sebelum dipakai untuk penawaran atau kontrak."

### 5.5 Komposit Gambar (overlay antar-disiplin)

- **Upload per disiplin:** unggah set gambar untuk **STR, ARS, MEP, INT**, masing-masing diberi label **lantai/zona**. Yang ditumpuk hanya gambar dengan lantai/zona yang sama.
- **Viewer komposit:** kanvas besar dengan zoom & pan. Di kiri **panel lapisan (layer)**: tiap disiplin punya baris dengan toggle tampil/sembunyi, **slider transparansi**, dan kotak warna sesuai warna disiplin. Legenda selalu terlihat.
- **Penyelarasan (alignment):** user menandai **2 titik referensi yang sama** (mis. perpotongan grid A-1 dan C-5) di dua gambar → aplikasi menyelaraskan posisi, skala, dan rotasi. Hasil penyelarasan tersimpan supaya tidak perlu diulang.
- **Markup & temuan koordinasi:** alat kotak, panah, dan catatan di atas komposit. Setiap markup bisa diangkat jadi **Temuan Koordinasi** — berisi disiplin yang bentrok, lokasi, PIC, tenggat, status. Daftar temuan tampil di panel kanan dan **nyambung ke daftar temuan di menu Supervisi Lapangan**.
- **Bantuan AI:** tombol "Periksa potensi bentrok" → AI menandai area yang patut dicurigai (mis. jalur ducting menembus balok) sebagai **saran bertanda tanya**, bukan kesimpulan. User yang memutuskan.
- **Ekspor:** gambar komposit (PDF) + daftar temuan.
- Empty state: "Upload minimal 2 disiplin pada lantai yang sama untuk mulai menumpuk gambar."

## 6. Komponen & pola umum

- **Sidebar** dengan ikon + label, item aktif ter-highlight; jadi menu hamburger di HP.
- **Pemilih proyek** di topbar, konsisten di semua menu.
- **Kartu (card)** sudut membulat, bayangan halus.
- **Kartu metrik** — angka besar, label kecil, indikator naik/turun berwarna.
- **Tabel bisa diedit langsung** (BoQ, bobot pekerjaan) — klik sel langsung ubah, ada tombol tambah/hapus baris.
- **Viewer gambar** dipakai ulang di menu 4 & 5: toolbar atas, kanvas tengah, panel kanan.
- **Badge status** konsisten: Terbuka (merah), Perbaikan (kuning), Verifikasi (biru), Selesai (hijau); Diverifikasi ✓ / Perlu dicek.
- **Tombol** utama warna aksen; sekunder outline; aksi merusak (hapus) merah dan selalu pakai konfirmasi.
- **Toast** untuk notifikasi ("Laporan harian tersimpan").
- **Loading & empty state** di tiap menu — jangan biarkan layar kosong tanpa penjelasan. Untuk proses berat (deteksi elemen, hitung kelayakan) pakai progress bar, bukan spinner tanpa keterangan.
- **Toleran error:** kalau AI/API gagal, tampilkan pesan ramah + tombol "Coba lagi", dan **jangan hilangkan input yang sudah diketik user**.
- **Pola verifikasi:** setiap angka hasil AI selalu tampil bersama sumbernya (gambar & lokasi pengukuran) dan status verifikasinya.

## 7. Di luar cakupan (Non-goals) — untuk sesi ini

- Tidak ada login/multi-user rumit (anggap 1 user internal dulu). Pembagian peran Pengawas vs Manajemen masuk fase berikutnya.
- Tidak ada pembayaran.
- Tidak menyimpan file di dalam database (file → Blob, database hanya alamat/metadata).
- **Bukan aplikasi BIM.** Tidak ada model 3D, tidak ada IFC, tidak ada *clash detection* otomatis 3D. Yang dibangun adalah overlay 2D + markup manual.
- Tidak membaca file DWG/RVT secara langsung — gambar harus diekspor ke PDF/gambar dulu.
- Tidak menggantikan perhitungan estimator bersertifikat; hasil aplikasi berstatus estimasi awal.
- Belum ada integrasi ke sistem akuntansi/ERP, email, atau WhatsApp.
- Belum ada mode offline penuh di lapangan (lihat Risiko).

## 8. Catatan teknis (untuk tahap ngoding, bukan untuk design)

- Hosting & deploy: **Vercel** (Next.js), auto-deploy dari GitHub `kelompok88`.
- Database: **Neon Postgres** via `DATABASE_URL`.
- File: **Vercel Blob** via `BLOB_READ_WRITE_TOKEN` — upload gambar besar langsung dari browser ke Blob, jangan lewat serverless function.
- AI: **OpenAI** via `OPENAI_API_KEY` — analisa & ringkasan (`gpt-4o`), pembacaan gambar memakai kemampuan *vision* pada `gpt-4o`.
- Render gambar: **pdf.js** untuk menampilkan PDF sebagai kanvas.
- Anotasi, lapisan, dan pengukuran: pustaka kanvas (mis. Konva atau Fabric.js). Simpan anotasi sebagai koordinat dalam database, **jangan** sebagai gambar hasil bakar.
- Grafik (kurva S, arus kas, sensitivitas): pustaka chart standar.
- Perhitungan kelayakan (NPV/IRR) dijalankan di sisi klien agar slider sensitivitas terasa instan; hasil final baru disimpan ke database.
- Aturan keras: API key tidak pernah masuk kode; `.env` masuk `.gitignore`.

## 9. Risiko & asumsi — perlu diputuskan sebelum ngoding

| Risiko | Dampak | Sikap yang diambil di PRD ini |
|--------|--------|-------------------------------|
| AI membaca gambar konstruksi belum akurat untuk kuantitas | Estimasi salah dipakai untuk penawaran | Semua hasil AI berstatus *usulan*, wajib verifikasi manual, ada banner peringatan |
| Skala gambar tidak diketahui / PDF tanpa metadata | Semua ukuran meleset | Kalibrasi skala manual jadi langkah wajib, alat ukur terkunci sebelum itu |
| Gambar antar-disiplin tidak sepusat/beda ukuran kertas | Overlay tidak nyambung | Penyelarasan 2 titik referensi manual, bukan otomatis |
| Sinyal lemah di lokasi proyek | Laporan harian gagal terkirim | Minimal: simpan draf di perangkat + tombol kirim ulang. Offline penuh = fase berikutnya |
| Basis harga satuan cepat kedaluwarsa | Total biaya menyesatkan | Basis Harga jadi halaman tersendiri yang bisa diperbarui & diimpor dari Excel, ada tanggal berlaku |
| Volume gambar besar (ratusan lembar) | Aplikasi lambat | Upload langsung ke Blob, render per halaman, batasi jumlah lapisan aktif |
