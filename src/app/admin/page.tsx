import { PublicShell } from "../../components/PublicShell.tsx";
import { StaffDashboard } from "../../components/StaffDashboard.tsx";

export default function AdminPage() {
  return <PublicShell><StaffDashboard adminOnly/></PublicShell>;
}
