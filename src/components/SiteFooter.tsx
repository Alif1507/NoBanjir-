import Link from "next/link";

export function SiteFooter({ variant = "public" }: { variant?: "public" | "dashboard" }) {
  const navigation = variant === "dashboard"
    ? [["Kondisi", "/dashboard#kondisi"], ["Laporan", "/dashboard#laporan"], ["Status Air", "/dashboard#status-air"]]
    : [["Beranda", "/"], ["Laporan", "/#laporan"], ["Tentang", "/#tentang"], ["Cara Kerja", "/#cara-kerja"]];
  return <footer className="site-footer"><div className="footer-inner">
    <div className="footer-grid">
      <div><h2>Navigasi</h2>{navigation.map(([label,href]) => <Link key={label} href={href}>{label}</Link>)}</div>
      <div><h2>Kontak</h2><p>SMK Negeri 26 Jakarta</p><p>Silakan hubungi pihak sekolah melalui saluran resminya.</p></div>
      <div><h2>Layanan</h2><Link href="/dashboard">Pemantauan Ketinggian Air</Link>
        <Link href="/tingkat-kondisi">Peringatan Dini Banjir</Link><Link href="/dashboard">Riwayat Ketinggian Air</Link>
        <Link href="/laporan">Pelaporan Tentang Banjir</Link></div>
    </div>
    <div className="footer-bottom"><p>Jl. Balai Pustaka Baru I No.2, RT.2/RW.7, Rawamangun, Kec. Pulo Gadung, Kota Jakarta Timur 13220</p>
      <span className="footer-dots" aria-hidden="true"><i/><i/><i/></span></div>
    <p className="footer-note">Prototipe kesiapsiagaan sekolah · SDG 6 &amp; SDG 11</p>
    <span className="footer-watermark" aria-hidden="true">No Banjir!</span>
  </div></footer>;
}
