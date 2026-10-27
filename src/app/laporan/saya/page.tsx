import { PublicShell } from "../../../components/PublicShell.tsx";
import { ReportsList } from "../../../components/ReportsList.tsx";

export default function MyReportsPage() { return <PublicShell>
  <h1>Laporan Saya</h1><p className="secondary-lead">Pantau laporan yang Anda kirim dan tindak lanjut petugas.</p>
  <ReportsList scope="mine"/>
</PublicShell>; }
