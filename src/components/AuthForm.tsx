"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthToggle } from "./AuthToggle.tsx";
import { browserSupabase } from "../lib/supabase/browser.ts";
import { safeNextPath } from "../lib/auth/permissions.ts";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const client = browserSupabase();
    if (!client) { setError("Koneksi akun belum dikonfigurasi."); return; }
    if (mode === "register" && name.trim().length < 2) { setError("Nama minimal 2 karakter."); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError("Masukkan alamat email yang valid."); return; }
    if (password.length < 8) { setError("Kata sandi minimal 8 karakter."); return; }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error: authError } = await client.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
        router.push(next); router.refresh();
      } else {
        const { data, error: authError } = await client.auth.signUp({ email, password,
          options: { data: { display_name: name.trim() }, emailRedirectTo: `${window.location.origin}/dashboard` } });
        if (authError) throw authError;
        if (data.session) { router.push("/dashboard"); router.refresh(); }
        else setMessage("Periksa email Anda untuk mengonfirmasi akun, lalu masuk.");
      }
    } catch { setError(mode === "login" ? "Email atau kata sandi tidak cocok." : "Pendaftaran gagal. Periksa email atau coba lagi."); }
    finally { setBusy(false); }
  }
  return <main id="main-content" tabIndex={-1} className="auth-layout">
    <div className="auth-photo"><AuthToggle active={mode}/><div className="auth-photo-copy">
      <Link href="/">No Banjir!</Link><p>Teknologi untuk<br/>Mengatasi Banjir</p></div></div>
    <section className="auth-side"><form className="auth-form" onSubmit={submit} noValidate>
      <Link className="auth-back-link" href="/">← Kembali ke beranda</Link>
      <h1>{mode === "login" ? "Masuk" : "Daftar"}</h1>
      <p className="auth-subtitle">{mode === "login" ? "Masuk untuk mengakses layanan." : "Buat akun untuk mengakses layanan."}</p>
      {mode === "register" && <label>Nama<input value={name} onChange={event => setName(event.target.value)}
        autoComplete="name" minLength={2} maxLength={120} required/></label>}
      <label>Email<input value={email} type="email" onChange={event => setEmail(event.target.value)}
        autoComplete="email" required/></label>
      <label>Kata Sandi<input value={password} type="password" onChange={event => setPassword(event.target.value)}
        autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required/></label>
      <button className="black-pill auth-submit" type="submit" disabled={busy}>{busy ? "Mohon tunggu…" : mode === "login" ? "Masuk" : "Daftar"}</button>
      {error && <p className="form-message error" role="alert">{error}</p>}
      {message && <p className="form-message success" role="status">{message}</p>}
    </form></section>
  </main>;
}
