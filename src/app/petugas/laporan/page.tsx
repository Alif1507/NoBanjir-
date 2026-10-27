import { PublicShell } from "../../../components/PublicShell.tsx";
import { ReportsList } from "../../../components/ReportsList.tsx";

export default function StaffReportsPage() { return <PublicShell>
  <h1>Panel Petugas</h1><p className="secondary-lead">Buka detail laporan untuk memproses, menyelesaikan, atau menolaknya. Setiap perubahan tercatat dalam riwayat.</p>
  <ReportsList scope="staff"/>
</PublicShell>; }
