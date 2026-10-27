export const mainNavigation = [
  { label: "Beranda", href: "/", icon: "home" },
  { label: "Pemantauan", href: "/dashboard", icon: "monitor" },
  { label: "Laporan", href: "/laporan", icon: "report" },
  { label: "Panduan", href: "/tingkat-kondisi", icon: "guide" },
  { label: "Tentang", href: "/tentang", icon: "info" },
] as const;

export function navigationIsActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

const routeNames: Record<string, string> = {
  "/laporan": "Laporan", "/laporan/buat": "Buat Laporan", "/laporan/saya": "Laporan Saya",
  "/tingkat-kondisi": "Panduan Kondisi", "/tentang": "Tentang",
  "/admin": "Dashboard Admin", "/admin/perangkat": "Pengaturan Perangkat",
  "/petugas": "Dashboard Petugas", "/petugas/laporan": "Antrean Laporan",
};

export function pageBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return [{ label: "Beranda", href: "/" }, ...segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    return { label: routeNames[href] ?? (index === 1 && segments[0] === "laporan" ? "Detail Laporan" : segment), href };
  })];
}
