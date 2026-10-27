import Link from "next/link";
import { PublicShell } from "../../components/PublicShell.tsx";

export default function AboutPage() { return <PublicShell><h1>Tentang No Banjir!</h1>
  <p className="secondary-lead">No Banjir! adalah prototipe pemantauan ketinggian air dan kondisi hujan untuk mendukung kesiapsiagaan warga SMK Negeri 26 Jakarta.</p>
  <div className="guide-grid"><article className="detail-card"><h2>Cara kerja</h2><p>Sensor ultrasonik membaca jarak permukaan air, sensor hujan memberi penanda hujan, dan ESP32 mengirim data ke server. Server menghitung tinggi air dan tingkat kondisi dari kalibrasi titik pemantauan. Browser menampilkan hasil dan riwayatnya.</p></article>
    <article className="detail-card"><h2>Tujuan</h2><p>Informasi yang lebih cepat membantu warga sekolah memperhatikan perubahan kondisi lingkungan. Proyek ini berkaitan dengan SDG 6 tentang air bersih dan sanitasi serta SDG 11 tentang lingkungan yang aman dan tangguh.</p></article></div>
  <p className="info-banner">Status perangkat dan status air berbeda. Jika data hilang atau kedaluwarsa, kondisi saat ini belum dapat dipastikan. Keputusan keselamatan mengikuti petugas sekolah dan lembaga resmi.</p>
  <div className="secondary-actions"><Link className="black-pill" href="/dashboard">Pemantauan live</Link>
    <Link className="blue-pill" href="/dashboard?demo=1">Pratinjau demo</Link></div>
</PublicShell>; }
