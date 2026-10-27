import Link from "next/link";
import { PublicShell } from "../../components/PublicShell.tsx";

const guide = [
  { level: "Normal", tone: "normal", meaning: "Air berada di bawah batas Waspada yang dikalibrasi untuk titik sensor.", action: "Pantau informasi sekolah secara berkala." },
  { level: "Waspada", tone: "waspada", meaning: "Ketinggian air mulai meningkat dari biasanya.", action: "Perhatikan pembaruan dan kondisi di sekitar saluran air." },
  { level: "Siaga", tone: "siaga", meaning: "Ketinggian air terus meningkat dan perlu perhatian.", action: "Ikuti arahan petugas sekolah dan hindari area genangan." },
  { level: "Bahaya", tone: "bahaya", meaning: "Ketinggian air mencapai ambang kritis atau sensor pelampung kritis aktif.", action: "Segera ikuti prosedur keselamatan sekolah dan arahan petugas." },
];
export default function LevelsPage() { return <PublicShell><h1>Tingkat Kondisi Air</h1>
  <p className="secondary-lead">Empat tingkat ini dihitung dari pengukuran sensor dan ambang hasil kalibrasi per lokasi. Perangkat offline atau sensor error ditampilkan terpisah, bukan dianggap Normal.</p>
  <div className="guide-grid">{guide.map(item => <article className={`guide-card ${item.tone}`} key={item.level}>
    <h2>{item.level}</h2><p>{item.meaning}</p><strong>{item.action}</strong></article>)}</div>
  <p className="info-banner">Informasi No Banjir! mendukung kewaspadaan. Ikuti selalu peringatan resmi dan prosedur keselamatan sekolah.</p>
  <Link className="blue-pill" href="/dashboard">Lihat pemantauan</Link>
</PublicShell>; }
