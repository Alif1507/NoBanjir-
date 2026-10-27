"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useSession } from "../hooks/use-session.ts";
import { categoryLabels, parseReport, type ReportInput } from "../lib/reports/schema.ts";

const draftKey = "nobanjir-report-draft";
const initial: ReportInput = { category: "GENANGAN", location_text: "", description: "" };

export function ReportForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const session = useSession();
  const [fields, setFields] = useState<ReportInput>(initial);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [photoWarning, setPhotoWarning] = useState(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) {
        const parsed = parseReport(JSON.parse(saved));
        if (parsed.success) setFields(parsed.data);
      }
    } catch { /* Invalid local draft is ignored. */ }
  }, []);
  useEffect(() => {
    if (!photo) { setPhotoPreview(null); return; }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess(null); setPhotoWarning(false);
    const parsed = parseReport(fields);
    if (!parsed.success) { setError("Lengkapi lokasi dan deskripsi (minimal 20 karakter)."); return; }
    if (photo && (photo.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(photo.type))) {
      setError("Foto harus JPG, PNG, atau WEBP dengan ukuran maksimal 5 MB."); return;
    }
    if (!session.token) {
      sessionStorage.setItem(draftKey, JSON.stringify(parsed.data));
      router.push("/login?next=%2Flaporan%2Fbuat"); return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/reports", { method: "POST", headers: {
        Authorization: `Bearer ${session.token}`, "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      if (!response.ok) throw new Error(response.status === 503 ? "Laporan belum dapat dikirim. Tunggu sebentar lalu coba lagi." : "Periksa isi laporan Anda.");
      const data = await response.json() as { report: { id: string } };
      sessionStorage.removeItem(draftKey);
      setSuccess(data.report.id); setFields(initial);
      if (photo) {
        const form = new FormData(); form.append("photo", photo);
        const uploaded = await fetch(`/api/reports/${data.report.id}/photo`, { method: "POST",
          headers: { Authorization: `Bearer ${session.token}` }, body: form });
        if (!uploaded.ok) setPhotoWarning(true);
      }
      setPhoto(null);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Laporan gagal dikirim."); }
    finally { setBusy(false); }
  }

  const categoryField = <label>Jenis Laporan<select value={fields.category}
    onChange={event => setFields({ ...fields, category: event.target.value as ReportInput["category"] })}>
    {Object.entries(categoryLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}
  </select></label>;

  return <form className={compact ? "report-form compact-report" : "report-form"} onSubmit={submit} noValidate>
    {!compact && <label>Nama<input value={session.displayName ?? (typeof session.user?.user_metadata?.display_name === "string" ? session.user.user_metadata.display_name : "Masuk untuk mengisi")}
      readOnly aria-describedby="report-name-note"/><small id="report-name-note">Nama mengikuti akun yang masuk.</small></label>}
    {compact && categoryField}
    <label>Lokasi<input value={fields.location_text} maxLength={200} required
      placeholder="Contoh: Dekat gerbang utama sekolah" onChange={event => setFields({ ...fields, location_text: event.target.value })}/></label>
    {!compact && categoryField}
    <label className="report-description">Deskripsi<textarea value={fields.description} minLength={20} maxLength={2000} required
      placeholder="Jelaskan masalah yang terlihat, waktu kejadian, dan potensi dampaknya"
      onChange={event => setFields({ ...fields, description: event.target.value })}/></label>
    {!compact && <label className="photo-field">Foto (opsional)<input type="file" accept="image/jpeg,image/png,image/webp"
      onChange={event => setPhoto(event.target.files?.[0] ?? null)}/><small>Maksimal 5 MB. Foto hanya terlihat oleh Anda dan petugas.</small>
      {photoPreview && <img className="photo-preview" src={photoPreview} alt="Pratinjau foto laporan"/>}</label>}
    <button className="black-pill report-submit" type="submit" disabled={busy}>{busy ? "Mengirim…" : "Kirim"}</button>
    {error && <p className="form-message error" role="alert">{error}</p>}
    {success && <p className="form-message success" role="status">Laporan terkirim. ID: <Link href={`/laporan/${success}`}>{success.slice(0,8)}</Link>
      {photoWarning ? " Foto belum tersimpan; laporan tetap terkirim." : ""}</p>}
  </form>;
}
