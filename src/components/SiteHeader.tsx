"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { browserSupabase } from "../lib/supabase/browser.ts";
import { useSession } from "../hooks/use-session.ts";
import { mainNavigation, navigationIsActive } from "../lib/navigation.ts";
import { NavigationIcon } from "./NavigationIcon.tsx";

export function SiteHeader({ variant = "public" }: { variant?: "public" | "dashboard" }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const staff = session.role === "admin" || session.role === "officer";
  const panelHref = session.role === "admin" ? "/admin" : "/petugas";
  const closeNavigation = () => { setMobileOpen(false); setAccountOpen(false); };
  const dismissMobile = () => {
    dialogRef.current?.close();
    setMobileOpen(false);
    menuButtonRef.current?.focus();
  };

  useEffect(() => { setMobileOpen(false); setAccountOpen(false); }, [pathname]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (mobileOpen && !dialog.open) dialog.showModal();
    if (!mobileOpen && dialog.open) dialog.close();
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 1180px)");
    const onResize = () => { if (desktop.matches) setMobileOpen(false); };
    desktop.addEventListener("change", onResize);
    return () => { document.body.style.overflow = previous; desktop.removeEventListener("change", onResize); };
  }, [mobileOpen]);
  useEffect(() => {
    if (!accountOpen) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !accountRef.current?.contains(event.target)) setAccountOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setAccountOpen(false); accountButtonRef.current?.focus(); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [accountOpen]);

  async function logout() {
    setLogoutError("");
    try {
      const result = await browserSupabase()?.auth.signOut();
      if (result?.error) throw result.error;
      closeNavigation(); router.push("/"); router.refresh();
    } catch { setLogoutError("Belum bisa keluar. Coba lagi."); }
  }
  const accountLinks = <>
    <Link href="/laporan/saya" onClick={closeNavigation}>Laporan saya <span aria-hidden="true">↗</span></Link>
    <Link href="/laporan/buat" onClick={closeNavigation}>Buat laporan <span aria-hidden="true">↗</span></Link>
    {staff && <>
      <Link href={panelHref} onClick={closeNavigation}>{session.role === "admin" ? "Dashboard admin" : "Dashboard petugas"}<span aria-hidden="true">↗</span></Link>
      <Link href="/petugas/laporan" onClick={closeNavigation}>Antrean laporan <span aria-hidden="true">↗</span></Link>
    </>}
    {session.role === "admin" && <Link href="/admin/perangkat" onClick={closeNavigation}>Pengaturan perangkat <span aria-hidden="true">↗</span></Link>}
  </>;

  return <><header className="site-header" data-variant={variant}>
    <Link className="brand-mark" href="/" aria-label="No Banjir, beranda">No Banjir<span>!</span></Link>
    <nav id="primary-nav" className="primary-nav" aria-label="Navigasi utama">
      {mainNavigation.map(link => <Link key={link.href} href={link.href}
        className={navigationIsActive(pathname, link.href) ? "nav-active" : undefined}
        aria-current={navigationIsActive(pathname, link.href) ? "page" : undefined}>{link.label}</Link>)}
    </nav>
    <div className="nav-actions">
      <Link className="header-report-link" href="/laporan/buat">Buat laporan <span aria-hidden="true">↗</span></Link>
      {session.user ? <div className="account-navigation" ref={accountRef}>
        <button ref={accountButtonRef} className="account-toggle" type="button" aria-expanded={accountOpen}
          aria-label="Buka menu akun"
          aria-controls="account-navigation" onClick={() => setAccountOpen(value => !value)}>
          <NavigationIcon name="user"/><span>{session.role === "admin" ? "Admin" : session.role === "officer" ? "Petugas" : "Akun"}</span><NavigationIcon name="chevron"/>
        </button>
        {accountOpen && <nav className="account-popover" id="account-navigation" aria-label="Akun dan pengelolaan">
          <p>{session.displayName ?? "Akun saya"}</p>{accountLinks}
          <button className="logout-link" onClick={logout}>Keluar dari akun</button>
          {logoutError && <small role="alert">{logoutError}</small>}
        </nav>}
      </div> : <Link className="cyan-pill" href="/login">Masuk</Link>}
      <button ref={menuButtonRef} className="mobile-menu" type="button" aria-expanded={mobileOpen}
        aria-label="Buka menu navigasi"
        aria-controls="mobile-navigation" onClick={() => { setAccountOpen(false); setMobileOpen(true); }}>
        <NavigationIcon name="menu"/><span>Menu</span>
      </button>
    </div>
    <div className="page-scroll-progress" aria-hidden="true"/>
  </header>

  <dialog ref={dialogRef} id="mobile-navigation" className="mobile-nav-dialog" aria-labelledby="mobile-navigation-title"
    onCancel={event => { event.preventDefault(); dismissMobile(); }}
    onClose={() => setMobileOpen(false)} onClick={event => { if (event.target === event.currentTarget) dismissMobile(); }}>
    <div className="mobile-nav-sheet">
      <div className="mobile-nav-heading"><span id="mobile-navigation-title">Jelajahi No Banjir!</span>
        <button type="button" className="mobile-nav-close" onClick={dismissMobile} aria-label="Tutup menu"><NavigationIcon name="close"/></button></div>
      <nav className="mobile-primary-links" aria-label="Semua halaman">
        {mainNavigation.map(link => <Link key={link.href} href={link.href} onClick={closeNavigation}
          aria-current={navigationIsActive(pathname, link.href) ? "page" : undefined}>
          <NavigationIcon name={link.icon}/><span>{link.label}</span><span className="mobile-nav-arrow" aria-hidden="true">↗</span></Link>)}
      </nav>
      {session.user && <nav className="mobile-account-links" aria-label="Akun dan pengelolaan"><p>{session.displayName ?? "Akun saya"}</p>{accountLinks}
        <button className="logout-link" onClick={logout}>Keluar dari akun</button>{logoutError && <small role="alert">{logoutError}</small>}</nav>}
      <Link className="black-pill mobile-report-cta" href="/laporan/buat" onClick={closeNavigation}>Laporkan kondisi lingkungan ↗</Link>
      {!session.user && <p className="mobile-signin-note">Sudah punya akun? <Link href="/login" onClick={closeNavigation}>Masuk</Link> atau <Link href="/register" onClick={closeNavigation}>daftar</Link>.</p>}
    </div>
  </dialog>

  <nav className="mobile-bottom-nav" aria-label="Navigasi cepat">
    {mainNavigation.slice(0, 4).map(link => <Link key={link.href} href={link.href} onClick={closeNavigation}
      aria-current={navigationIsActive(pathname, link.href) ? "page" : undefined}>
      <NavigationIcon name={link.icon}/><span>{link.href === "/dashboard" ? "Pantau" : link.label}</span></Link>)}
  </nav></>;
}
