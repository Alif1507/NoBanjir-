/# DESIGN.md — NO BANJIR!

> **Status:** Spesifikasi desain UI/UX untuk implementasi web **setia terhadap 4 mockup PDF**.  
> **Referensi utama:** `Landing.pdf`, `Masuk.pdf`, `Daftar.pdf`, `Dashboard.pdf` yang diberikan pemilik proyek.  
> **Produk:** NO BANJIR! — Sistem Peringatan Dini Banjir Berbasis IoT, SMK Negeri 26 Jakarta.  
> **Pendamping:** `NO_BANJIR_WEB_APP_SPEC.md` (PRD).  
> **Target:** Buat tampilan situs sedekat mungkin dengan desain referensi; jangan membuat reinterpretasi dashboard SaaS atau mengganti bahasa visualnya.

---

## 0. PERINTAH UTAMA UNTUK AI CODING ASSISTANT

**Implementasikan frontend NO BANJIR! mengikuti desain terlampir dengan fidelitas visual setinggi mungkin.** Gunakan **empat screenshot referensi** di folder `design-assets/` sebagai acuan final untuk tampilan desktop; baca PRD untuk logika bisnis, IoT, autentikasi, dan API.

### Aturan yang tidak boleh dilanggar

1. **Visual reference > preferensi desain AI.** Jangan ubah menjadi antarmuka glassmorphism generik, dashboard admin gelap, layout sidebar, atau UI kartu berlebih.
2. **Pertahankan struktur/urutan section** seperti di PDF, termasuk ruang kosong (*whitespace*) dan ornamen bentuk cincin hitam di sisi halaman.
3. **Pertahankan foto sekolah dan foto lingkungan**. Pakai file yang diekstrak dari PDF di `design-assets/`, **jangan ganti stock photo atau gambar AI**.
4. **Jangan ubah warna utama**: putih/abu sangat muda, hitam, biru terang, cyan, dan footer biru gelap. Warna tingkat peringatan sesuai referensi.
5. **Pertahankan copywriting berbahasa Indonesia** dari mockup. Koreksi hanya jika diminta pemilik, kecuali bug aksesibilitas/keamanan yang tidak terlihat di desain.
6. **Jangan menambahkan sidebar, tabel admin, peta, widget cuaca besar, statistik ekstra, ikon dekoratif besar, efek gradien ungu, atau glass cards lain** di empat layar ini. Fitur tambahan PRD diletakkan di halaman turunan, panel yang dapat dibuka, atau area non-dominan.
7. **Pisahkan kesetiaan desain dari fungsionalitas.** Form, autentikasi, data ESP32, grafik, tautan, dan status harus benar-benar berfungsi; screenshot hanyalah tampilan, bukan alasan membuat elemen mati.
8. **Bangun desktop sesuai screenshot terlebih dahulu, lalu turunkan ke tablet/mobile** tanpa memaksakan desktop overflow secara horizontal.
9. **Setiap screenshot harus dibandingkan dengan implementasi pada viewport yang sama**; perbaiki perbedaan layout, jarak, ukuran, crop foto, dan jenis huruf sebelum menganggap selesai.
10. Jika ada bagian mockup yang tidak menentukan desain/teks pasti, **jangan mengarang seolah itu tertulis di PDF**. Ambil keputusan implementasi sederhana yang konsisten dan dokumentasikan.

### Prioritas bila instruksi berbeda

1. **Akurasi struktur visual & teks 4 PDF** → dokumen ini dan screenshot yang diekstrak.
2. **Perilaku sistem, keamanan, autentikasi, model data, dan integrasi ESP32** → PRD `NO_BANJIR_WEB_APP_SPEC.md`.
3. Aksesibilitas, responsivitas, dan best practice web → diterapkan dengan perubahan visual seminimal mungkin.

---

## 1. SUMBER REFERENSI & ASET

### 1.1 Reference board (bukan contoh generik)

| Layar | PDF sumber | Screenshot untuk visual comparison | Kanvas PDF asal |
|---|---|---|---|
| Landing | `Landing.pdf` | `design-assets/reference-landing.png` | 1728 × 5359 |
| Masuk | `Masuk.pdf` | `design-assets/reference-masuk.png` | 1728 × 1117 |
| Daftar | `Daftar.pdf` | `design-assets/reference-daftar.png` | 1728 × 1117 |
| Dashboard | `Dashboard.pdf` | `design-assets/reference-dashboard.png` | 1728 × 5065 |

Ukuran kanvas di atas merupakan **ukuran halaman PDF ketika dirender pada skala 1 (1 point → 1 piksel)**, **bukan** ukuran viewport CSS yang harus dipaksakan pada semua pengguna. Untuk uji fidelity desktop, gunakan **viewport lebar 1728 CSS px** dan sesuaikan tinggi/scroll agar seluruh section dapat difoto. Ukuran CSS numerik di bawah adalah **perkiraan awal berdasarkan pengukuran visual PDF**; screenshot asli tetap menentukan hasil akhir.

![Referensi Landing](./design-assets/reference-landing.png)

![Referensi Login](./design-assets/reference-masuk.png)

![Referensi Register](./design-assets/reference-daftar.png)

![Referensi Dashboard](./design-assets/reference-dashboard.png)

### 1.2 Aset foto asli (diekstrak dari PDF)

Semua file berikut berasal dari objek gambar yang tertanam dalam PDF, bukan gambar baru:

| File | Kegunaan dan aturan crop |
|---|---|
| `design-assets/smk26-building.jpg` | Gedung sekolah **landing hero**, **login**, **register**. Gunakan `background-size: cover`, periksa `background-position` agar papan SMK Negeri 26 tetap terlihat. |
| `design-assets/landing-card-ancaman.jpg` | Foto kartu **Ancaman Banjir** (pagar/langit). |
| `design-assets/landing-card-monitoring.jpg` | Foto kartu **Monitoring Air** (pohon/halaman). |
| `design-assets/landing-card-deteksi.jpg` | Foto kartu **Deteksi Dini** (gedung/pepohonan sore). |
| `design-assets/dashboard-aerial.jpg` | Banner lebar **No Banjir! CEGAH • ATASI • SELESAI** (pemandangan dari atas). |
| `design-assets/dashboard-laporan.jpg` | Foto vertikal **Laporkan Permasalahan Banjir** (gedung saat langit senja). |

**Catatan:** Di PDF terdapat beberapa objek dekoratif raster (strip hitam, bagian foto yang sudah gelap, serta lingkaran). Untuk objek dekoratif, lebih baik rekonstruksi dengan CSS agar skalanya responsif. Jangan menempel screenshot seluruh halaman sebagai satu `img`; elemen harus semantik dan interaktif.

---

## 2. VISUAL SYSTEM GLOBAL

### 2.1 Mood & identitas

- Tampilan **editorial/promotional website sekolah**, kontras dan bold, tidak terlihat seperti template komersial.
- Latar konten dominan **putih-abu sangat muda**, bukan biru pucat seluruh halaman.
- Heading tebal berwarna **hitam** dengan sebagian kata diberi **biru**.
- Header navigasi **putih membulat di bagian bawah** dengan link sederhana dan underline biru pada halaman aktif.
- Footer **biru tua cerah** penuh lebar; ornamen teks besar semi-transparan bertuliskan `No Banjir!` dekat dasar.
- Ornamen geometris **lengkung/cincin hitam berukuran besar yang terpotong tepi halaman**. Jangan ganti jadi blob warna-warni.
- Komponen bukan card-heavy. Bayangan/border digunakan tipis hanya pada form, panel status, dan card laporan.

### 2.2 Color palette

| Token | Nilai | Referensi penggunaan |
|---|---|---|
| `--bg-page` | `#F6F6F6` | Latar Landing & Dashboard |
| `--white` | `#FFFFFF` | Header, kartu, panel form, panel autentikasi |
| `--black` | `#000000` | Teks utama, CTA hitam, placeholder grafik hitam, ornamen |
| `--text-muted` | `#5C5C5C` | Teks sekunder, subheading |
| `--blue-primary` | `#0285C7` | Teks biru, tombol pelajari lebih lanjut |
| `--blue-bright` | `#07A7F8` | Panel proses IoT, highlight biru terang |
| `--blue-footer` | `#00689D` | Footer, bagian biru gelap |
| `--cyan-chip` | `#57F6FE` | Tab Masuk/Daftar dan CTA navbar |
| `--cyan-highlight` | `#92FAFF` | Variasi cyan ringan / gradient kecil pada tab |
| `--input-blue` | `#CFEEFB` | Input berbentuk kapsul pada auth (nilai pendekatan visual) |
| `--input-report` | `#E4F1F6` | Input pada form laporan dashboard (nilai pendekatan visual) |
| `--risk-normal` | `#019230` | Arrow **Normal** |
| `--risk-waspada` | `#FEDF3A` | Arrow **Waspada** |
| `--risk-siaga` | `#F67F27` | Arrow **Siaga** |
| `--risk-bahaya` | `#FD2727` | Arrow **Bahaya** |
| `--status-card-safe` | `#3FC52D` | Latar kartu besar **Kondisi Aman** |
| `--divider` | `#D9D9D9` | Garis/border kecil |

> Warna solid yang jelas dibaca dari objek vektor PDF diprioritaskan. Beberapa warna seperti biru pastel input dan abu teks adalah **estimasi tampilan** dan perlu disempurnakan lewat screenshot comparison.

### 2.3 Typography

Jenis huruf hasil ekstraksi PDF disimpan sebagai font Type3 sehingga **nama font keluarga asli tidak bisa dipastikan dengan andal**. Bentuk huruf visualnya mirip **Poppins** dengan varian berat 400–800. Pilih **Poppins** sebagai font implementasi utama; verifikasi dengan screenshot. Jika file desain sumber (misalnya Figma) nanti tersedia, gunakan font resminya.

```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');

:root {
  --font-primary: 'Poppins', ui-sans-serif, system-ui, sans-serif;
  --bg-page: #F6F6F6;
  --white: #FFFFFF;
  --black: #000000;
  --text-muted: #5C5C5C;
  --blue-primary: #0285C7;
  --blue-bright: #07A7F8;
  --blue-footer: #00689D;
  --cyan-chip: #57F6FE;
  --input-blue: #CFEEFB;
  --input-report: #E4F1F6;
  --risk-normal: #019230;
  --risk-waspada: #FEDF3A;
  --risk-siaga: #F67F27;
  --risk-bahaya: #FD2727;
  --status-card-safe: #3FC52D;
}
body { font-family: var(--font-primary); background: var(--bg-page); color: var(--black); margin: 0; }
```

Perkiraan skala tipografi pada **desktop referensi 1728 px**:

| Elemen | Ukuran awal | Weight / karakter |
|---|---:|---|
| Link navbar | 20–25 px | 500, tidak terlalu tebal |
| Hero utama Landing | 86–110 px | 800–900, uppercase, line-height ±1.06 |
| Deskripsi hero | 20–25 px | 500, putih |
| Pernyataan besar `Informasi Lebih Cepat...` | 58–66 px | 400–500, center, line-height rapat |
| Heading section | 44–52 px | 700–800 |
| Heading Dashboard | 49–55 px | 700–800 |
| Judul dalam kartu status | 35–41 px | 700 |
| Headline kartu hijau `Kondisi Aman` | 46–53 px | 800, putih |
| Teks normal halaman | 18–23 px | 400–500 |
| Header footer | 30–33 px | 600–700 |
| Teks footer | 18–22 px | 400 |

Sesuaikan nilai aktual menurut screenshot setelah dijalankan. Jangan menggunakan semua font 14–16 px seperti template dashboard standar: mockup memang punya headline besar dan dekoratif.

### 2.4 Spacing, ukuran & bentuk

- Lebar konten desktop utama: sekitar **1480–1580 px** pada kanvas 1728, margin ±70–110 px (variasi per section).
- Padding section desktop: sekitar **80–110 px** horizontal.
- Jarak antarsection besar: sekitar **140–260 px**, khususnya di Landing.
- Radius umum form kecil: **8–12 px**; radius header bawah **28–40 px**; foto/banner hero membulat tepi bawah **40–70 px**.
- Input auth: **pill radius 9999 px**, tinggi sekitar **75–85 px** saat acuan 1728 lebar.
- Tombol utama: kapsul hitam dengan teks putih dan ukuran cukup besar.
- Card status dashboard: rounded 8–16 px, bayangan tipis/border abu; bukan glass card.
- Website harus terlihat lapang. Jangan merapatkan semua section untuk mengurangi tinggi halaman.

### 2.5 Komponen visual reusable

`SiteHeader`, `AuthToggle`, `SchoolPhotoPanel`, `SectionHeading`, `BigRingDecoration`, `StatusSummaryCard`, `RiskRibbon`, `ReportForm`, `SiteFooter`, `StatusChart`, `FeaturePhotoCard`, `ProcessStepCard`.

**Reusable berarti konsisten styling, bukan berarti semua halaman harus terlihat sama.** Layar autentikasi menggunakan layout split penuh dan **tidak memakai navbar biasa**.

---

## 3. LANDING PAGE — `/`

**Acuan mutlak:** `Landing.pdf` / `design-assets/reference-landing.png`. Tinggi desain penuh memanjang, bukan satu hero saja.

### 3.1 Urutan wajib dari atas ke bawah

1. Navbar putih.
2. Hero penuh foto SMK Negeri 26 + overlay kartu kaca abu transparan.
3. Pernyataan tengah: “Informasi Lebih Cepat, Kesiapsiagaan Lebih Awal, Nyaman Berkegiatan.”
4. **Form Laporan** kecil di kiri dan paragraf/CTA di kanan.
5. **Kenapa Inovasi No Banjir! Hadir?** + tiga kartu foto.
6. **Bagaimana No Banjir! Bekerja** + empat panel biru berbentuk potongan poligonal.
7. Footer biru lebar.

### 3.2 Header / navbar (bagian teratas)

- White floating bar **menempel di bagian atas**, melebar ke seluruh browser.
- Tepi bawah kiri-kanan bulat besar, kontras terhadap foto hero.
- Menu horizontal center: `Beranda`, `Laporan`, `Tentang`, `Cara Kerja`.
- `Beranda` aktif → **garis bawah pendek biru**.
- Tombol kecil kanan berupa pill cyan dengan teks hitam `Masuk`.
- **Tidak ada sidebar dan jangan tampilkan logo besar di bagian kiri** karena tidak ada pada desain.
- Semua link berfungsi: nav anchor `#laporan`, `#tentang`, `#cara-kerja`, `Masuk` → `/login`.
- Header dapat dibuat sticky bila tidak mengubah screenshot posisi awal; z-index cukup tinggi.

### 3.3 Hero pertama

- Area menutupi lebar penuh di bawah navbar, tinggi dominan ±**1100–1230 unit pada kanvas 1728**.
- Foto **`smk26-building.jpg`** sebagai background cover; foto harus menunjukkan fasad sekolah, papan identitas, dan gedung biru.
- Lapisan gelap sangat ringan bila diperlukan untuk keterbacaan, bukan mengubah seluruh foto jadi biru.
- Overlaid rectangular panel besar berwarna **abu-transparan / frosted glass**; posisi di dekat tengah atas, margin sekitar 80 px kiri/kanan, sudut ±20–30 px, blur latar ringan.
- Di kiri atas dalam panel muncul toggle cyan `Masuk`/`Daftar` dengan tab `Masuk` hitam terpilih. Ini **elemen dari desain**, bukan pengganti navbar `Masuk` kanan.
- Judul berada di dalam panel dan dominan putih, uppercase besar dalam **dua baris**:

  ```text
  MARI WUJUDKAN
  SEKOLAH NYAMAN.
  ```

  Kata **`WUJUDKAN`** pada baris pertama memiliki **outline/stroke putih dengan fill transparan**, sementara `MARI` dan `SEKOLAH NYAMAN.` putih solid.
- Deskripsi persis:

  > Melalui website No Banjir!, kami memanfaatkan teknologi untuk memantau dan mendeteksi ketinggian air secara real-time, sehingga kita dapat lebih sigap dalam menghadapi potensi banjir dan mengambil tindakan pencegahan sejak dini.

- Copy pendek relatif sempit dan berada di bawah headline, berwarna putih.
- Bawah foto hero melengkung membulat di kedua ujung.

Teknik outline:

```css
.hero-outline {
  color: transparent;
  -webkit-text-stroke: 2px #fff;
  paint-order: stroke fill;
}
```

### 3.4 Pernyataan utama di tengah

- Section putih/abu muda lapang.
- Ornamen **cincin hitam besar, sebagian keluar layar**, di tepi **kiri** dan **kanan**, berfungsi sebagai framing.
- Teks mini center di atas: **`No Banjir !`**.
- Judul 3 baris center **regular weight** (berbeda dari judul section lain):

  ```text
  Informasi Lebih Cepat,
  Kesiapsiagaan Lebih Awal,
  Nyaman Berkegiatan.
  ```

- Jangan menambah ikon tetesan besar, ilustrasi orang, atau kartu ringkasan kondisi di sini.

### 3.5 Laporan ringkas publik

- Judul `Laporan` di atas formulir di sisi kiri.
- Layout desktop **2 kolom**: form lebih lebar kiri (±57%), informasi singkat kanan (±35%).
- Form berupa **kotak putih** dengan border/shadow tipis, bukan card rounded super besar.
- Di dalam form empat isian dengan visual dua kolom (2 × 2):
  - `Jenis Laporan`
  - `Lokasi`
  - `Deskripsi`
  - Tombol **`Kirim`** hitam pill
- Field berbentuk input pendek warna putih, **border abu tipis**, pill.
- Paragraf kanan:

  > Sampaikan kendala atau masalah yang Anda temui saat menggunakan inovasi No Banjir! maupun permasalahan lain terkait kondisi lingkungan di sekolah.

- Tombol kanan `Pelajari Lebih Lanjut` warna biru, kapsul kecil.
- Tombol `Kirim`: bila login diwajibkan oleh PRD, simpan draft lokal dan lanjutkan autentikasi sebelum menyimpan laporan; **form tetap terlihat persis seperti screenshot**.

### 3.6 Tentang inovasi + tiga foto informasi

- Layout desktop: teks kiri ±32%, tiga kartu foto tegak di kanan dengan gap antarcard.
- Headline kiri 3 baris dan beberapa kata biru:

  ```text
  Kenapa Inovasi
  No Banjir! Hadir?
  ```

  `Inovasi` dan `No Banjir!` berwarna biru, lainnya hitam (periksa line-break pada screenshot).
- Deskripsi:

  > No Banjir! diciptakan sebagai solusi berbasis teknologi IoT untuk membantu warga sekolah memantau ketinggian air dan mendeteksi potensi banjir sejak dini.

- Kartu **foto tinggi** (bukan ilustrasi). Ratio kira-kira **281 × 500** pada kanvas referensi; `object-fit: cover`.
- Tiap kartu punya **overlay gradasi hitam dari bawah**, judul putih mendekati area bawah, dan deskripsi putih kecil.
- Urutan, label dan deskripsi:
  1. **Ancaman Banjir** — “Banjir yang kerap terjadi dapat mengganggu kegiatan belajar mengajar dan aktivitas warga sekolah.”
  2. **Monitoring Air** — “Diperlukan sistem yang dapat memantau ketinggian air secara real-time agar perubahan kondisi dapat diketahui lebih cepat.”
  3. **Deteksi Dini** — “Memberikan informasi dan peringatan dini agar warga sekolah dapat lebih sigap dalam menghadapi potensi banjir.”
- **Jangan ubah menjadi tiga kartu putih horizontal dengan ikon.** Ini foto vertikal seperti sumber PDF.

### 3.7 Bagaimana No Banjir! Bekerja

- Heading center:

  **`Bagaimana`** (hitam) **`No Banjir!`** (biru) **`Bekerja`** (hitam).

- Subjudul center:

  > Kenali bagaimana teknologi IoT membantu memantau ketinggian air dan mendeteksi potensi banjir sejak dini.

- Di bawahnya empat panel **biru tinggi** terpisah dengan bentuk atap/miring yang berbeda, **bukan empat kartu rounded biasa**.
- Urutan **tepat**:
  1. `Deteksi Ketinggian Air`
  2. `Proses Data`
  3. `Pengiriman Data`
  4. `Pemantauan dan Peringatan`
- Warna panel selang-seling: `#0285C7`, `#07A7F8`, `#07A7F8`, `#0285C7` (lihat screenshot).
- Judul putih sekitar tengah/atas panel; di bagian bawah masih terdapat **placeholder teks hitam besar “Foto Sensor”** (terlihat di PDF). Untuk kesetiaan visual **tampilkan placeholder jika belum ada foto komponen**. Setelah foto prototipe tersedia, gantikan hanya area placeholder dengan foto sensor, bukan ganti bentuk panel.
- Panel perlu puncak miring yang berbeda. Gunakan CSS `clip-path: polygon(...)` atau pseudo-element; pastikan konten tidak terpotong.

### 3.8 Footer Landing

- Footer full bleed warna `#00689D`.
- Baris utama tiga kolom: `Navigasi`, `Kontak`, `Layanan`.
- Isi **Navigasi**: `Beranda`, `Laporan`, `Tentang`, `Cara Kerja`.
- Isi **Kontak** pada mockup: `nobanjir!@gmail.com` dan `+62 812-3456-7890` (nomor/email ditampilkan sebagai teks referensi; perlu konfirmasi sebelum dipakai sebagai kontak layanan aktif).
- Isi **Layanan**:
  - `Pemantauan Ketinggian Air`
  - `Peringatan Dini Banjir`
  - `Riwayat Ketinggian Air`
  - `Pelaporan Tentang Banjir`
- Garis horizontal abu-putih transparan.
- Baris alamat:

  > Jl. Balai Pustaka Baru I No.2, RT.2/RW.7, Rawamangun, Kec. Pulo Gadung, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13220

- Di kanan bawah ada **tiga bulatan putih** berjajar (jangan otomatis menafsirkannya sebagai akun media sosial yang valid; bisa placeholder dekoratif hingga URL nyata tersedia).
- Elemen dekoratif `No Banjir!` **sangat besar**, transparansi rendah, di belakang/footer bawah; terpotong di tepi dasar halaman.

---

## 4. HALAMAN MASUK — `/login`

**Acuan:** `Masuk.pdf` / `design-assets/reference-masuk.png`.

### 4.1 Layout dasar: 60/40 split

- Layar desktop dibagi **kiri foto ±60%**, **kanan area putih ±40%** sepanjang tinggi viewport.
- **Tidak ada navbar Landing** dan tidak ada footer di layar autentikasi.
- Panel kiri adalah foto `smk26-building.jpg` cropped cover. Fasad sekolah serta papan “SMK NEGERI 26 JAKARTA” tetap terbaca secara visual.
- Panel kanan putih solid, form tepat di tengah area kanan (sedikit di atas pusat vertikal).
- Di bagian **atas kanan panel foto** ada toggle cyan `Masuk` / `Daftar` yang sama pada register; `Masuk` **terpilih = kapsul hitam** dengan teks putih.
- Di **kiri bawah foto** ada teks overlay:

  ```text
  No Banjir!
  Teknologi untuk Mengatasi Banjir
  ```

  Baris pertama putih bold, baris kedua abu putih pucat, besar dan bold; beri overlay gelap bawah secukupnya agar terbaca.

### 4.2 Form Login

- Heading tengah **`Masuk`**, hitam, tebal, ±50–60 px pada kanvas referensi.
- Subheading tengah **`Masuk untuk mengakses layanan.`** abu gelap, ±25–30 px.
- Container input lebar ±**520 px** pada referensi 1728, bergeser sesuai ukuran panel kanan.
- Field pertama: label `Nama`, input pill biru pastel `#CFEEFB`, tinggi ±75–85 px.
- Field kedua: label `Kata Sandi`, input password pill warna sama.
- Tombol hitam besar full width `Masuk`, radius pill, teks putih sangat tebal.
- Jarak antara elemen cukup lega; input **tanpa border hitam** dan bukan form field kotak standar.
- Tidak ada kartu putih tambahan: form berada langsung di atas latar putih panel kanan.

### 4.3 Perilaku

- Toggle `Daftar` → `/register`, toggle `Masuk` tidak menavigasi bila sudah login page.
- `Nama` menjadi *username/display name* hanya bila backend memang mendukung autentikasi username; jika login backend mengharuskan email, sesuaikan pemetaan/implementasi dengan PRD tanpa diam-diam membuat login tidak bekerja. **Jangan ganti label visual `Nama` menjadi `Email` tanpa persetujuan**.
- Validasi dilakukan di bawah field dengan pesan kecil tanpa mengganti layout besar.
- Loading button mempertahankan ukuran `Masuk`.
- Autentikasi sukses → `/dashboard` atau rute `next` valid.

---

## 5. HALAMAN DAFTAR — `/register`

**Acuan:** `Daftar.pdf` / `design-assets/reference-daftar.png`.

### 5.1 Hubungan dengan halaman Login

Semua layout, foto kiri, copy overlay, proporsi split, bentuk input, dan gaya cyan toggle **SAMA** seperti halaman Login. Jangan merancang layar register berbeda.

- Toggle `Daftar` **aktif = kapsul hitam**; `Masuk` tidak aktif pada latar cyan.
- Heading berubah ke **`Daftar`**.
- Subheading menjadi **`Buat akun untuk mengakses layanan.`**.
- Urutan label/input:
  1. `Nama`
  2. `Email`
  3. `Kata Sandi`
- Field tetap pill biru muda penuh lebar dengan interval vertikal serupa login.

### 5.2 Hal penting: inkonsistensi label tombol dari sumber

**PDF `Daftar.pdf` menampilkan teks tombol bawah “Masuk”, bukan “Daftar”.** Jangan diam-diam mengklaim PDF menuliskan “Daftar”.

- **Mode `strictVisual=true` (untuk screenshot matching):** label tombol terlihat `Masuk` **seperti PDF**, namun `type="submit"` harus memproses **pendaftaran akun**, bukan melakukan login.
- **Mode produksi yang direkomendasikan secara UX:** ubah label menjadi `Daftar` atau `Buat Akun` **setelah mendapat persetujuan**, agar tidak membingungkan pengguna.
- Toggle atas tetap menunjukkan `Daftar` sebagai tab aktif apa pun pilihan label tombol.

### 5.3 Perilaku

- Buat user baru memakai Supabase Auth sesuai PRD, validasi nama, email unik/sesuai penyedia, panjang kata sandi sesuai kebijakan.
- Sediakan pesan error/sukses dengan gaya kecil non-invasif di panel putih.
- Toggle `Masuk` → `/login`.

---

## 6. DASHBOARD — `/dashboard`

**Acuan:** `Dashboard.pdf` / `design-assets/reference-dashboard.png`.

Dashboard ini **halaman scrolling editorial**, **bukan admin sidebar dashboard**. Semua blok berikut muncul dalam satu halaman.

### 6.1 Header Dashboard

- White horizontal nav rounded bottom, gaya identik dengan Landing.
- Isi menu center: `Kondisi`, `Laporan`, `Status Air`.
- Menu aktif awal: **Kondisi** + underline biru pendek.
- Kanan: tombol pill cyan `Keluar`, teks hitam.
- Routing: `Kondisi` → `#kondisi`, `Laporan` → `#laporan`, `Status Air` → `#status-air`.
- `Keluar` harus memanggil sign out dan mengarahkan ke `/` atau `/login`.

### 6.2 Kondisi Sekolah Saat Ini

- Area awal setelah header memiliki margin horizontal ±80 px.
- Heading besar **`Kondisi Sekolah Saat Ini`** rata kiri.
- Subheading **`Pemantauan sekolah secara langsung.`**.
- Di bawahnya dua kartu status **bersebelahan**, bukan 4 metrik standar:

**Kartu 1 — Ketinggian Air**

- Sekitar separuh lebar konten (lebih sempit daripada kartu hijau dengan gap cukup besar).
- Latar putih dengan border abu dan shadow bawah tipis.
- Lingkaran abu solid di sisi kiri atas (placeholder ikon dari mockup), judul `Ketinggian Air` kanan lingkaran.
- Di tengah bawah judul, angka/isi besar **`–`** ketika **belum ada nilai sensor**. Jangan mengarang `12 cm` sebagai data live.
- Di bawah ada titik hijau kecil dan label **`Normal`** untuk keadaan contoh referensi. **Dalam implementasi real**, label hanya Normal bila telemetri valid menyatakan Normal.
- Ketika ada data valid, gantikan `–` menjadi nilai contoh format **`12 cm`** sesuai API; label berubah berdasar threshold.

**Kartu 2 — Status Saat Ini**

- Lebar sebanding kartu pertama, gap besar ±100 px antara kedua kartu pada screenshot.
- Hijau terang penuh `#3FC52D`, teks putih/headline besar.
- Placeholder lingkaran abu terang di kiri atas, judul hitam `Status Saat Ini` kanan lingkaran.
- Headline tengah **`Kondisi Aman`** putih, bold.
- Untuk Waspada/Siaga/Bahaya ganti fill card sesuai warna level namun **jangan ganti layout**.
- Data offline, stale, error **tidak boleh tampil sebagai Aman**; gunakan teks seperti `Data Tidak Tersedia` dengan state netral, tetap memakai bentuk komponen yang sama.

### 6.3 Grafik

- Blok hitam besar/solid dengan lebar hampir penuh konten (sekitar sama dengan baris dua card di atas).
- Pada screenshot teks besar center **`Grafik`** berwarna putih; **ini placeholder resmi mockup**.
- Minimal visual state saat tidak ada data: blok hitam ini **persis** dengan teks `Grafik` center.
- Saat ada data: tempatkan **grafik ketinggian air sungguhan** dengan latar hitam yang tetap dipertahankan, garis/label kontras putih atau biru; heading `Grafik` tetap visible tetapi berpindah menjadi judul area bila perlu.
- Informasi `Demo / Live`, timestamp, status sensor boleh berupa teks mini/floating kecil **tanpa menambah baris kartu baru sebelum grafik**.
- Hindari background putih, gradient berwarna, donut chart, dan tabel angka besar yang merusak hasil screenshot.

### 6.4 Banner foto slogan

- Setelah grafik terdapat **jarak kosong jelas** sebelum banner foto.
- Full bleed foto `dashboard-aerial.jpg` (foto udara area sekolah/perumahan), rasio banner lebar sekitar 1728 × 500 pada screenshot.
- Dark overlay ringan–sedang.
- Teks besar putih **`No Banjir!`** center.
- Tepat di bawahnya urutan kata besar uppercase / outline:

  **`CEGAH`** `●` **`ATASI`** `●` **`SELESAI`**

- Kata dapat memakai fill transparan dengan stroke putih, bulatan putih solid pemisah.
- Jangan ganti banner ini dengan ilustrasi IoT atau peta.

### 6.5 Laporkan Permasalahan Anda

- Latar `#F6F6F6`, ada dekorasi **cincin hitam** besar terpotong **kiri atas** dan **kanan samping** section.
- Heading bold center:

  **`Laporkan Permasalahan Anda`**.

- Subheading center dengan isi:

  > Sampaikan laporan mengenai genangan air, potensi banjir, atau kendala yang Anda temukan di lingkungan sekolah untuk membantu meningkatkan keamanan dan kesiapsiagaan bersama.

- Kontainer form putih terpusat, border abu dan shadow tipis, **2 kolom**:
  - **Kiri**: form relatif sempit, 4 field vertikal, label sederhana di atas input, input biru pastel.
  - **Kanan**: foto **`dashboard-laporan.jpg`**, besar, vertikal, menempati hampir setengah box.
- Field kiri dengan urutan persis: `Nama`, `Lokasi`, `Jenis Laporan`, `Deskripsi`.
- `Deskripsi` lebih tinggi (textarea rounded) daripada isian yang lain.
- Tombol hitam pill **`Kirim`** pada bagian bawah form, relatif **tidak full width**: ±60% lebar kolom kiri.
- Di atas foto kanan ada **teks putih rata kanan**, tiga baris:

  ```text
  Laporkan
  Permasalahan
  Banjir
  ```

- Jadikan foto punya overlay gelap halus untuk kontras; radius foto kecil.
- Form harus dikirim ke backend laporan sesuai PRD; `Jenis Laporan` dapat berupa select yang tampil seperti input pill, pilihan sesuai PRD.

### 6.6 Tingkatan Kondisi Ketinggian Air

- Di bagian bawah form ada section berjarak besar; dua kolom header.
- Heading kiri beberapa baris, kata `Kondisi` dan `Ketinggian Air` diberi biru:

  ```text
  Tingkatan Kondisi
  Ketinggian Air
  ```

- Paragraf penjelasan di kanan, ukuran teks lebih kecil dengan perataan kanan/tengah seperti mockup:

  > Kenali setiap tingkatan kondisi air yang ditampilkan oleh No Banjir! agar warga sekolah dapat memahami situasi dan mengambil tindakan yang tepat sesuai tingkat risiko banjir.

- Di bawah header ada daftar **empat ribbon panah horizontal**, masing-masing di kiri, dengan deskripsi hitam bold di kanan.

| Urutan | Label pita | Warna pita | Teks deskripsi (gunakan persis) |
|---|---|---|---|
| 1 | `Normal` | `#019230` | Ketinggian air berada dalam batas aman. |
| 2 | `Waspada` | `#FEDF3A` | Ketinggian air mulai meningkat dari biasanya. |
| 3 | `Siaga` | `#F67F27` | Ketinggian air terus meningkat dan perlu perhatian. |
| 4 | `Bahaya` | `#FD2727` | Ketinggian air mencapai tingkat yang berbahaya. |

**Bentuk penting:** pita adalah **panah segi enam memanjang ke kanan**, di ujung kiri ada **dua chevron bertumpuk / potongan V** dalam warna lebih pucat. Jangan diganti rounded badge biasa, progress bar, atau empat kotak persegi.

CSS awal yang boleh digunakan (penyempurnaan sesuai screenshot):

```css
.risk-ribbon {
  position: relative;
  width: min(100%, 440px);
  min-height: 86px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  clip-path: polygon(11% 0, 88% 0, 100% 50%, 88% 100%, 11% 100%, 22% 50%);
}
.risk-ribbon::before {
  content: '';
  position: absolute;
  left: 0;
  width: 22%;
  height: 100%;
  background: rgba(255,255,255,.55);
  clip-path: polygon(0 0, 48% 0, 96% 50%, 48% 100%, 0 100%, 48% 50%);
}
```

CSS contoh hanya titik awal; bentuk chevron ganda dapat lebih presisi dengan dua elemen anak SVG/CSS. Label harus terbaca pada pita kuning (pilih white text dengan shadow ringan atau atur kontras tanpa mengganti warna pita).

### 6.7 Footer Dashboard

Sama dengan Landing, kecuali menu Navigasi berisi `Kondisi`, `Laporan`, `Status Air`. Kontak, Layanan, alamat, tiga bulatan putih, dan teks besar transparan `No Banjir!` tetap ada.

---

## 7. RESPONSIVE DESIGN

PDF memberikan referensi **desktop saja**. Mobile/tablet berikut adalah **interpretasi tambahan**, bukan klaim bahwa tersedia mockup mobile. Tugas developer adalah mempertahankan identitas desain dan konten.

| Ukuran | Implementasi yang diharapkan |
|---|---|
| ≥1440 px | Cocokkan geometri desktop referensi: heading besar, foto lebar, section lapang, rasio asli. |
| 1024–1439 px | Pertahankan 2-column status dan auth split; kurangi font/spacing proporsional. |
| 768–1023 px | Landing tiga foto boleh horizontal scroll atau 3 kolom rapat; section form dashboard bisa dua kolom bila cukup. |
| ≤767 px | Navbar collapsible dengan menu, auth satu kolom foto di atas/di belakang area singkat, kartu dashboard bertumpuk, form dashboard satu kolom dengan foto setelah form, ribbon dan deskripsi vertikal atau compact. |
| ≤375 px | Tidak boleh ada horizontal scrollbar; teks hero wrap rapi; input/button full width bila sempit. |

### Responsive invariants

- Foto gedung pada layar auth tetap terlihat; jangan hanya menampilkan form putih dan menghilangkan identitas sekolah.
- Pada mobile semua text dapat dibaca tanpa zoom, walau ukuran headline desktop perlu turun menggunakan `clamp()`.
- Tingkat warna Normal–Bahaya dan teks harus tetap identik.
- Footer 3 kolom boleh menjadi stack, tapi semua tautan dan alamat tetap tersedia.
- Tombol Masuk/Keluar tetap tersedia di mobile.
- Ornamen cincin boleh dipotong lebih jauh agar tidak menutupi teks/form.
- Jika menggunakan `position: absolute` pada desktop, **jangan sampai elemen melayang di atas form saat mobile**.

---

## 8. INTERAKSI, ROUTING, STATE

### 8.1 Rute untuk keempat layar utama

| URL | Halaman | Navigasi visual |
|---|---|---|
| `/` | Landing | `Beranda · Laporan · Tentang · Cara Kerja · Masuk` |
| `/login` | Masuk | Toggle `Masuk / Daftar` |
| `/register` | Daftar | Toggle `Masuk / Daftar` |
| `/dashboard` | Dashboard | `Kondisi · Laporan · Status Air · Keluar` |

Anchor: Landing `#laporan`, `#tentang`, `#cara-kerja`; Dashboard `#kondisi`, `#laporan`, `#status-air`.

### 8.2 Fungsionalitas yang tidak boleh dikorbankan

- **Autentikasi** harus valid, password tidak disimpan di localStorage mentah, tidak ada kredensial hardcoded di source.
- **Ketinggian air** dari ESP32, label status dan chart berasal dari live telemetry atau Demo Mode berlabel; tidak membuat data palsu seolah live.
- **Grafik** harus menampilkan deret waktu saat ada data, empty state mengikuti screenshot `Grafik` hitam.
- **Laporan** terintegrasi backend; error validasi ditampilkan inline dan sukses punya feedback jelas.
- **Sign out** benar-benar keluar.
- **Empat status** mempertahankan warna dan perbedaan visual, juga label tekstual.
- Sensor **offline/stale/error** harus punya state terpisah dari Normal/aman.
- Threshold ketinggian tidak di-hardcode dari contoh mockup; ikuti PRD/konfigurasi admin.

### 8.3 Kompromi desain dengan PRD

PRD mencakup detail hujan, device health, grafik historis, admin sensor, dan alur laporan lanjut. Screenshot menampilkan **dua kartu**, bukan empat. **Jangan menambah kartu ketiga/keempat di bagian atas dashboard**. Detail ekstra bisa berada pada panel expand atau tooltip yang aksesibel, pada area di bawah grafik, atau halaman petugas/admin terpisah. Pengguna tetap dapat menemukan data penting tanpa kesulitan.

Contoh status data:

| Kondisi | Tinggi air | Kartu status | Grafik |
|---|---|---|---|
| Belum ada data | `–` | `Belum Ada Data` (netral) | Placeholder `Grafik` |
| Normal valid | Nilai `x cm` | Hijau + `Kondisi Aman` | Chart live |
| Waspada valid | Nilai `x cm` | Kuning + `Waspada` | Chart live |
| Siaga valid | Nilai `x cm` | Oranye + `Siaga` | Chart live |
| Bahaya valid | Nilai `x cm` | Merah + `Bahaya` | Chart live |
| Sensor offline | Nilai akhir (berlabel lama) atau `–` | Netral + `Sensor Offline` | Riwayat dengan peringatan stale |
| Demo Mode | Simulasi berlabel `DEMO` | Sesuai simulasi | Chart simulasi berlabel DEMO |

---

## 9. STRUKTUR KOMPONEN & FILE

Gunakan stack PRD (Next.js App Router, React, TypeScript, Tailwind CSS, Supabase). Ini rekomendasi organisasi kode, **bukan perubahan rancangan visual**:

```text
src/
  app/
    page.tsx                        # Landing
    login/page.tsx                  # Masuk
    register/page.tsx               # Daftar
    dashboard/page.tsx              # Dashboard
    globals.css
  components/
    layout/
      SiteHeader.tsx
      SiteFooter.tsx
      AuthPhotoPanel.tsx
      AuthToggle.tsx
    landing/
      LandingHero.tsx
      StatementSection.tsx
      QuickReportSection.tsx
      WhyNoBanjirSection.tsx
      HowItWorksSection.tsx
    dashboard/
      ConditionsOverview.tsx
      WaterHeightCard.tsx
      CurrentStatusCard.tsx
      WaterChart.tsx
      MottoBanner.tsx
      DashboardReportSection.tsx
      RiskLevelsSection.tsx
      RiskRibbon.tsx
    shared/
      BigRingDecoration.tsx
      ReportForm.tsx
  lib/
    risk.ts
    telemetry.ts
    auth.ts
public/
  images/
    smk26-building.jpg
    landing-card-ancaman.jpg
    landing-card-monitoring.jpg
    landing-card-deteksi.jpg
    dashboard-aerial.jpg
    dashboard-laporan.jpg
```

Salin asset JPEG dari `design-assets/` ke `public/images/` jika memakai Next.js. Jangan memasukkan gambar referensi full-page ke UI.

### 9.1 Layout utama (pseudo JSX)

```tsx
// Landing: urutan tidak boleh berubah.
<>
  <SiteHeader variant="public" active="beranda" />
  <main>
    <LandingHero />
    <StatementSection />
    <QuickReportSection id="laporan" />
    <WhyNoBanjirSection id="tentang" />
    <HowItWorksSection id="cara-kerja" />
  </main>
  <SiteFooter variant="public" />
</>

// Dashboard: urutan tidak boleh berubah.
<>
  <SiteHeader variant="dashboard" active="kondisi" />
  <main>
    <ConditionsOverview id="kondisi" />
    <WaterChart />
    <MottoBanner />
    <DashboardReportSection id="laporan" />
    <RiskLevelsSection id="status-air" />
  </main>
  <SiteFooter variant="dashboard" />
</>
```

### 9.2 Contoh CSS penting untuk fidelity

```css
/* Bukan tema baru, hanya pondasi visual agar selaras PDF. */
.site-header {
  width: 100%;
  background: #fff;
  border-radius: 0 0 38px 38px;
  box-shadow: 0 2px 4px rgba(0,0,0,.10);
}
.pill-cyan { background: #57f6fe; color: #000; border-radius: 9999px; }
.pill-black { background: #000; color: #fff; border-radius: 9999px; }
.auth-layout { display: grid; grid-template-columns: 60% 40%; min-height: 100vh; }
.auth-photo {
  background: linear-gradient(to top, rgba(0,0,0,.56), transparent 35%),
              url('/images/smk26-building.jpg') center center / cover no-repeat;
}
.auth-input { border: 0; outline-offset: 3px; border-radius: 9999px; background: #cfeefb; }
.dashboard-chart-empty { background: #000; color: #fff; display: grid; place-items: center; }
.footer-main { background: #00689d; color: #fff; overflow: hidden; }
@media (max-width: 767px) {
  .auth-layout { grid-template-columns: 1fr; }
  .auth-photo { min-height: 34vh; }
}
```

---

## 10. VISUAL QA — ACCEPTANCE CRITERIA

Sebuah implementasi **belum selesai** meski semua halaman bisa dibuka apabila tampilannya tidak mirip mockup. Checklist:

### 10.1 Landing

- [ ] Header putih bawah-rounded; menu dan tombol `Masuk` cyan seperti gambar.
- [ ] Foto sekolah **asli** tampil full hero dengan crop yang cocok.
- [ ] Panel frosted glass transparan melapisi foto, dengan toggle di kiri atas.
- [ ] Hero tulisan dua baris sangat besar; `WUJUDKAN` outline putih.
- [ ] Teks pernyataan 3 baris center dan lingkaran hitam sisi kiri/kanan.
- [ ] Form laporan dua kolom kecil + penjelasan kanan.
- [ ] Tiga kartu **foto vertikal** di section alasan dibuat, bukan icon cards.
- [ ] Empat panel biru potongan miring sesuai urutan dan placeholder `Foto Sensor`.
- [ ] Footer biru lengkap dengan tiga kolom, alamat, tiga bulatan, watermark besar.

### 10.2 Masuk / Daftar

- [ ] Panel foto kiri kira-kira 60%; panel putih kanan kira-kira 40% pada desktop.
- [ ] Photo crop cocok dan teks `No Banjir! / Teknologi untuk Mengatasi Banjir` di kiri bawah.
- [ ] Toggle cyan di dekat pojok atas kanan foto dan tab aktif hitam.
- [ ] Form center kanan, pill input biru pastel, CTA hitam besar.
- [ ] Login 2 input, register 3 input, copy heading/subheading sesuai sumber.
- [ ] Register mengakui typo tombol `Masuk` di mockup, dengan keputusan mode fidelity jelas.

### 10.3 Dashboard

- [ ] Navbar tanpa sidebar: `Kondisi Laporan Status Air Keluar`.
- [ ] Dua kartu besar bersebelahan: satu putih, satu hijau `Kondisi Aman`.
- [ ] Placeholder ikon **bulat abu**, seperti desain, bukan menggantinya dengan icon pack dominan.
- [ ] Grafik background hitam dengan fallback teks putih `Grafik`.
- [ ] Banner aerial asli dengan slogan `CEGAH • ATASI • SELESAI`.
- [ ] Laporan berisi field kiri dan **foto sore** kanan + overlay putih.
- [ ] Empat ribbon panah warna **hijau, kuning, oranye, merah**, bukan badge biasa.
- [ ] Footer biru identik dengan landing, navigasi disesuaikan.

### 10.4 Perilaku dan keamanan

- [ ] Semua route/link/anchor berfungsi dan scroll menuju section yang benar.
- [ ] Semua tombol punya aksi nyata atau state disabled yang dijelaskan.
- [ ] Tampilan data sensor offline/stale tidak menampilkan kondisi aman palsu.
- [ ] Semua input divalidasi, pesan error dapat dibaca pembaca layar.
- [ ] Tab keyboard/focus jelas, form punya `<label>` asli, kontras memadai.
- [ ] Tampilan mobile tidak overflow.
- [ ] Tidak ada konten, gambar, atau kredensial tidak resmi yang dianggap data live.

### 10.5 Metode screenshot comparison

1. Jalankan website dan buka viewport **1728 px** lebar untuk semua 4 halaman.
2. Ambil screenshot **full-page** untuk Landing dan Dashboard; viewport screenshot untuk Masuk/Daftar.
3. Buka hasil screenshot berdampingan dengan gambar di `design-assets/reference-*.png`.
4. Perbaiki dalam urutan: **struktur/section → ukuran foto/crop → typography → margin/gap → warna → border/radius → ornamen → details**.
5. Test kedua viewport juga: **390 × 844** (mobile) dan **768 × 1024** (tablet).
6. Jangan berhenti hanya karena tampilannya “mirip secara tema”; targetnya meniru **komposisi asli**.
7. Catat deviasi yang tidak bisa diselesaikan karena aset/font asal belum tersedia.

---

## 11. CATATAN KETIDAKPASTIAN SUMBER

Hal-hal berikut **tidak boleh diklaim pasti berasal dari PDF**:

- Nama font exact (PDF menggunakan font Type3 / vektor; Poppins adalah **perkiraan kuat**, bukan metadata definitif).
- Detail breakpoint mobile atau susunan mobile (4 PDF hanya mockup desktop).
- Ukuran CSS siap pakai per elemen (angka layout di sini estimasi berdasar render halaman PDF berukuran 1728 unit).
- Threshold tinggi air dalam sentimeter untuk empat level (ambil dari pengujian/konfigurasi admin sesuai PRD).
- Identitas real-time data sensor, backend, dan credential (tidak tersedia di screenshot).
- Nilai akurat/no data: screenshot menunjukkan `–` di tinggi air serta `Kondisi Aman` di card; itu hanya **ilustrasi desain**, bukan bukti telemetry aman.
- Kepastian bahwa email/nomor kontak mockup adalah kontak layanan nyata.

**Simpulan arahan:** Desain ini adalah **replika empat layar referensi**, sedangkan isi telemetry dan pelaporan harus fungsional menurut PRD tanpa merusak visual empat layar.

---

## 12. FINAL BUILD INSTRUCTION (PROMPT SIAP PAKAI)

> Baca seluruh `DESIGN.md` ini, `NO_BANJIR_WEB_APP_SPEC.md`, dan semua gambar `design-assets/reference-*.png`. Bangun web NO BANJIR! dengan 4 halaman `/`, `/login`, `/register`, dan `/dashboard` mengikuti empat PDF asli semirip mungkin. Pakai foto asli yang disertakan dalam `design-assets/`. Prioritaskan struktur dan screenshot match, bukan mendesain ulang. Jangan memakai dashboard sidebar, tema generik, ikon acak, gambar stock, atau menambah kartu metrik yang tidak ada. Implementasikan login/register, laporan, data sensor/telemetry, dan grafik berdasarkan PRD dengan demo mode jelas. Terakhir buat screenshot full page per halaman pada viewport desktop 1728px; bandingkan dengan reference images dan iterasi sampai detail besar dan kecil cocok. Buat responsif tanpa menghilangkan identitas visual.

**END OF DESIGN.md**
