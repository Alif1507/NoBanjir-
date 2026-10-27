import { AdminDevices } from "../../../components/AdminDevices.tsx";
import { PublicShell } from "../../../components/PublicShell.tsx";

export default function AdminDevicesPage() { return <PublicShell>
  <h1>Pengaturan Perangkat</h1><p className="secondary-lead">Kelola identitas titik pemantauan, rentang sensor, dan ambang peringatan. Hanya admin yang dapat menyimpan perubahan.</p>
  <AdminDevices/>
</PublicShell>; }
