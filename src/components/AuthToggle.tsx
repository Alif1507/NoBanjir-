import Link from "next/link";

export function AuthToggle({ active }: { active: "login" | "register" }) {
  return <nav className="auth-toggle" aria-label="Akun">
    <Link className={active === "login" ? "selected" : ""} href="/login">Masuk</Link>
    <Link className={active === "register" ? "selected" : ""} href="/register">Daftar</Link>
  </nav>;
}
