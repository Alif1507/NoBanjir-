"use client";

import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { useSession } from "../hooks/use-session.ts";
import { deviceSchema, type Device } from "../lib/iot/schema.ts";

type AdminDevice = Device & { min_ingest_interval_seconds: number };
const fields: [keyof AdminDevice,string][] = [
  ["sensor_to_zero_cm","Jarak sensor ke titik nol (cm)"],
  ["min_distance_cm","Jarak minimum sensor (cm)"],
  ["max_distance_cm","Jarak maksimum sensor (cm)"],
  ["max_water_height_cm","Tinggi air maksimum terukur (cm)"],
  ["waspada_min_cm","Ambang Waspada (cm)"],
  ["siaga_min_cm","Ambang Siaga (cm)"],
  ["bahaya_min_cm","Ambang Bahaya (cm)"],
  ["offline_after_seconds","Offline setelah (detik)"],
  ["min_ingest_interval_seconds","Interval kirim minimum (detik)"],
];

export function AdminDevices() {
  const session = useSession();
  const [devices, setDevices] = useState<AdminDevice[]>([]);
  const [selected, setSelected] = useState<AdminDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!session.token || session.role !== "admin") return;
    fetch("/api/admin/devices", { headers: { Authorization: `Bearer ${session.token}` }, cache: "no-store" })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { const list = z.array(deviceSchema.extend({ min_ingest_interval_seconds: z.number() })).parse(data.devices);
        setDevices(list); setSelected(list[0] ?? null); })
      .catch(() => setError("Daftar perangkat belum dapat dimuat."))
      .finally(() => setLoading(false));
  }, [session.token, session.role]);
  if (!session.ready || (session.token && !session.role)) return <p role="status">Memeriksa akses…</p>;
  if (session.role !== "admin") return <p className="empty-state">Halaman ini hanya untuk admin sekolah.</p>;
  function update<K extends keyof AdminDevice>(field: K, value: AdminDevice[K]) {
    setSelected(current => current ? { ...current, [field]: value } : current);
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || !session.token) return;
    setBusy(true); setError(""); setMessage("");
    const payload = { device_code: selected.device_code, name: selected.name,
      location_description: selected.location_description, sensor_to_zero_cm: selected.sensor_to_zero_cm,
      min_distance_cm: selected.min_distance_cm, max_distance_cm: selected.max_distance_cm,
      max_water_height_cm: selected.max_water_height_cm, waspada_min_cm: selected.waspada_min_cm,
      siaga_min_cm: selected.siaga_min_cm, bahaya_min_cm: selected.bahaya_min_cm,
      offline_after_seconds: selected.offline_after_seconds,
      min_ingest_interval_seconds: selected.min_ingest_interval_seconds, is_active: selected.is_active };
    const response = await fetch(`/api/admin/devices/${selected.id}`, { method: "PATCH",
      headers: { Authorization: `Bearer ${session.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload) }).catch(() => null);
    if (response?.ok) { setDevices(current => current.map(d => d.id === selected.id ? selected : d));
      setMessage("Pengaturan perangkat tersimpan."); }
    else setError("Pengaturan tidak tersimpan. Periksa urutan ambang, zona buta sensor, dan koneksi.");
    setBusy(false);
  }
  return <div>
    <p className="info-banner">Ukur titik nol dan zona buta JSN-SR04T di lokasi pemasangan. Ambang demo bukan nilai keselamatan produksi. Token perangkat dibuat melalui alat provisioning lokal dan tidak ditampilkan di halaman ini.</p>
    {loading && <p role="status">Memuat perangkat…</p>}{error && <p role="alert" className="form-message error">{error}</p>}
    {!loading && !devices.length && <p className="empty-state">Belum ada perangkat. Daftarkan perangkat dengan skrip provisioning setelah kalibrasi fisik.</p>}
    {selected && <><label className="admin-device-select">Titik pemantauan<select value={selected.id}
      onChange={event => setSelected(devices.find(d => d.id === event.target.value) ?? null)}>
      {devices.map(d => <option key={d.id} value={d.id}>{d.name} ({d.device_code})</option>)}</select></label>
      <form className="admin-grid" onSubmit={save}>
        <div className="admin-card"><h2>Identitas</h2><label>Nama titik<input value={selected.name} maxLength={120}
          onChange={event => update("name",event.target.value)}/></label>
          <label>Lokasi<textarea value={selected.location_description} maxLength={500}
            onChange={event => update("location_description",event.target.value)}/></label>
          <label><input type="checkbox" checked={selected.is_active} onChange={event => update("is_active",event.target.checked)}/> Perangkat aktif</label></div>
        <div className="admin-card"><h2>Kalibrasi &amp; Ambang</h2>{fields.map(([key,label]) => <label key={key}>{label}
          <input type="number" step={key.includes("seconds") ? "1" : "0.1"} required
            value={selected[key] as number} onChange={event => update(key, Number(event.target.value))}/></label>)}</div>
        <div className="admin-card"><h2>Simpan</h2><p>Perubahan ambang akan dipakai saat pembacaan sensor berikutnya. Pembacaan lama tetap memakai hasil tersimpan.</p>
          <button className="black-pill" disabled={busy}>{busy ? "Menyimpan…" : "Simpan perubahan"}</button>
          {message && <p role="status" className="form-message success">{message}</p>}</div>
      </form></>}
  </div>;
}
