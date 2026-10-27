"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { browserSupabase } from "../lib/supabase/browser.ts";
import { useSession } from "../hooks/use-session.ts";

export function SiteHeader({ variant = "public" }: { variant?: "public" | "dashboard" }) {
  const [open, setOpen] = useState(false);
  const session = useSession();
  const router = useRouter();
  const links = variant === "dashboard"
    ? [["Kondisi", "/dashboard#kondisi"], ["Laporan", "/dashboard#laporan"], ["Status Air", "/dashboard#status-air"]]
    : [["Beranda", "/"], ["Laporan", "/#laporan"], ["Tentang", "/#tentang"], ["Cara Kerja", "/#cara-kerja"]];
  async function logout() {
    await browserSupabase()?.auth.signOut();
    setOpen(false); router.push("/"); router.refresh();
  }
  return <header className="site-header">
    <Link className="brand-mark" href="/" aria-label="No Banjir, beranda">No Banjir<span>!</span></Link>
    <button className="mobile-menu" type="button" aria-expanded={open} aria-controls="primary-nav"
      onClick={() => setOpen(!open)}>Menu <span aria-hidden="true">☰</span></button>
    <nav id="primary-nav" className={open ? "primary-nav open" : "primary-nav"} aria-label="Navigasi utama">
      {links.map(([label, href], index) => <Link key={label} href={href} className={index === 0 ? "nav-active" : ""}
        onClick={() => setOpen(false)}>{label}</Link>)}
      {(session.role === "admin" || session.role === "officer") &&
        <Link className="staff-nav-link" href={session.role === "admin" ? "/admin" : "/petugas"}
          onClick={() => setOpen(false)}>{session.role === "admin" ? "Dashboard Admin" : "Dashboard Petugas"}</Link>}
      <Link className="nav-mobile-extra" href="/laporan">Lihat laporan</Link>
      <Link className="nav-mobile-extra" href="/tingkat-kondisi">Panduan kondisi</Link>
      {session.role === "admin" && <Link className="nav-mobile-extra" href="/admin/perangkat">Pengaturan perangkat</Link>}
      {(session.role === "admin" || session.role === "officer") &&
        <Link className="nav-mobile-extra" href="/petugas/laporan">Antrean laporan</Link>}
    </nav>
    <div className="nav-actions">
      {session.user ? <><Link href="/laporan/saya" className="account-link">Akun</Link>
        <button className="cyan-pill" onClick={logout}>Keluar</button></>
        : <Link className="cyan-pill" href="/login">Masuk</Link>}
    </div>
  </header>;
}
