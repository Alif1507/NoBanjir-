import Link from "next/link";
import { PublicShell } from "../../components/PublicShell.tsx";
import { ReportsList } from "../../components/ReportsList.tsx";

export default function ReportsPage() { return <PublicShell>
  <h1>Laporan Lingkungan</h1><p className="secondary-lead">Cerita singkat kondisi lingkungan sekolah yang dilaporkan warga. Daftar publik hanya memuat kategori, lokasi, deskripsi, status, dan waktu.</p>
  <div className="secondary-actions"><Link className="black-pill" href="/laporan/buat">Buat Laporan</Link>
    <Link className="blue-pill" href="/laporan/saya">Laporan Saya</Link></div>
  <ReportsList/>
</PublicShell>; }
