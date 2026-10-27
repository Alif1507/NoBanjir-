import { PublicShell } from "../../../components/PublicShell.tsx";
import { ReportForm } from "../../../components/ReportForm.tsx";

export default function CreateReportPage() { return <PublicShell>
  <h1>Buat Laporan</h1><p className="secondary-lead">Laporkan genangan, saluran tersumbat, sampah, atau kondisi lain di lingkungan sekolah. Masuk diperlukan sebelum laporan disimpan.</p>
  <div className="detail-card" style={{ maxWidth: 750 }}><ReportForm/></div>
</PublicShell>; }
