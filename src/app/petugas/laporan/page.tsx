import { PublicShell } from "../../../components/PublicShell.tsx";
import { ReportsList } from "../../../components/ReportsList.tsx";
import Link from "next/link";

export default function StaffReportsPage() { return <PublicShell>
  <h1>Panel Petugas</h1><p className="secondary-lead">Buka detail laporan untuk memproses, menyelesaikan, atau menolaknya. Setiap perubahan tercatat dalam riwayat.</p>
  <p><Link className="text-link" href="/petugas">← Kembali ke dashboard petugas</Link></p>
  <ReportsList scope="staff"/>
</PublicShell>; }
