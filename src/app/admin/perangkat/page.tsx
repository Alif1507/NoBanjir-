import { AdminDevices } from "../../../components/AdminDevices.tsx";
import { PublicShell } from "../../../components/PublicShell.tsx";
import Link from "next/link";

export default function AdminDevicesPage() { return <PublicShell>
  <h1>Pengaturan Perangkat</h1><p className="secondary-lead">Kelola identitas titik pemantauan, rentang sensor, dan ambang peringatan. Hanya admin yang dapat menyimpan perubahan.</p>
  <p><Link className="text-link" href="/admin">← Kembali ke dashboard admin</Link></p>
  <AdminDevices/>
</PublicShell>; }
