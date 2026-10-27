"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useSession } from "../hooks/use-session.ts";
import { useTelemetry } from "../hooks/use-telemetry.ts";
import { isStaff } from "../lib/auth/permissions.ts";
import { deviceSchema, type Device } from "../lib/iot/schema.ts";
import { categoryLabels, reportSchema, statusLabels, type EnvironmentReport } from "../lib/reports/schema.ts";
import { summarizeStaffReports } from "../lib/staff/summary.ts";

const dateTime = (value: string) => new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta",
}).format(new Date(value)) + " WIB";
const healthLabels = { UNKNOWN: "Belum ada data", ONLINE: "Online", OFFLINE: "Offline",
  STALE: "Data kedaluwarsa", ERROR: "Sensor bermasalah" };

export function StaffDashboard({ adminOnly = false }: { adminOnly?: boolean }) {
  const session = useSession();
  const allowed = isStaff(session.role) && (!adminOnly || session.role === "admin");
  const [reports, setReports] = useState<EnvironmentReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [devicesError, setDevicesError] = useState("");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!allowed || !session.token) return;
    const controller = new AbortController();
    setReportsLoading(true); setReportsError("");
    fetch("/api/reports?scope=staff", { cache: "no-store", signal: controller.signal,
      headers: { Authorization: `Bearer ${session.token}` } })
      .then(async response => {
        if (!response.ok) throw new Error("Laporan belum dapat dimuat.");
        return z.object({ reports: z.array(reportSchema) }).parse(await response.json()).reports;
      })
      .then(rows => { if (!controller.signal.aborted) setReports(rows); })
      .catch(() => { if (!controller.signal.aborted) setReportsError("Laporan belum dapat dimuat."); })
      .finally(() => { if (!controller.signal.aborted) setReportsLoading(false); });
    return () => controller.abort();
  }, [allowed, session.token, reload]);

  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    setDevicesLoading(true); setDevicesError("");
    fetch("/api/devices", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Titik pantau belum dapat dimuat.");
        return z.object({ devices: z.array(deviceSchema) }).parse(await response.json()).devices;
      })
      .then(rows => { if (!controller.signal.aborted) {
        setDevices(rows);
        setDeviceId(current => rows.some(device => device.id === current) ? current : rows[0]?.id ?? null);
      } })
      .catch(() => { if (!controller.signal.aborted) setDevicesError("Titik pantau belum dapat dimuat."); })
      .finally(() => { if (!controller.signal.aborted) setDevicesLoading(false); });
    return () => controller.abort();
  }, [allowed, reload]);

  const selectedDevice = devices.find(device => device.id === deviceId);
  const telemetry = useTelemetry(allowed ? deviceId : null, selectedDevice?.offline_after_seconds ?? 90, "1h");
  const summary = summarizeStaffReports(reports);
  const fresh = telemetry.health === "ONLINE" || telemetry.health === "ERROR";
  const reading = telemetry.reading;
  const warning = fresh && reading?.float_switch_critical ? "BAHAYA" :
    fresh && reading?.is_valid ? reading.warning_level : null;
  const height = fresh && reading?.is_valid ? reading.water_height_cm : null;

  if (!session.ready) return <p role="status" className="empty-state">Memeriksa akses…</p>;
  if (!session.user) return <p className="empty-state">Silakan <Link className="text-link" href="/login?next=%2Fpetugas">masuk</Link> untuk membuka panel.</p>;
  if (!session.role) return <p className="empty-state">Profil akun belum tersedia. Coba masuk kembali.</p>;
  if (!allowed) return <p className="empty-state">Halaman ini hanya untuk {adminOnly ? "admin" : "petugas dan admin"} sekolah.</p>;

  return <div className="staff-dashboard">
    <section className="staff-hero"><div><span className="staff-eyebrow">RUANG KENDALI · NO BANJIR!</span>
      <h1>{session.role === "admin" ? "Dashboard Admin" : "Dashboard Petugas"}</h1>
      <p>Selamat datang, {session.displayName ?? "Petugas"}. Pantau laporan warga sekolah dan kondisi titik sensor dari satu tempat.</p></div>
      <span className="staff-role-badge">{session.role === "admin" ? "ADMIN" : "PETUGAS"}</span></section>

    <div className="staff-quick-links">
      <Link className="black-pill" href="/petugas/laporan">Kelola semua laporan ↗</Link>
      <Link className="blue-pill" href="/dashboard">Lihat pemantauan publik ↗</Link>
      {session.role === "admin" && <Link className="staff-outline-link" href="/admin/perangkat">Pengaturan perangkat ↗</Link>}
    </div>

    <section aria-labelledby="staff-report-heading" className="staff-dashboard-section">
      <div className="staff-section-heading"><div><p className="staff-section-kicker">LAPORAN LINGKUNGAN</p>
        <h2 id="staff-report-heading">Perlu Perhatian</h2></div>
        <button type="button" className="staff-refresh" onClick={() => setReload(value => value + 1)}>Muat ulang</button></div>
      <p className="staff-section-intro">Ringkasan dari maksimal 100 laporan terbaru. Buka antrean untuk filter dan tindak lanjut.</p>
      {reportsLoading ? <p role="status" className="empty-state">Memuat laporan…</p> : reportsError ?
        <p role="alert" className="empty-state">{reportsError}</p> : <>
        <div className="staff-stat-grid">
          <article className="staff-stat-card"><span>Baru masuk</span><strong>{summary.counts.DIKIRIM}</strong><small>Menunggu pemeriksaan</small></article>
          <article className="staff-stat-card"><span>Diproses</span><strong>{summary.counts.DIPROSES}</strong><small>Sedang ditindaklanjuti</small></article>
          <article className="staff-stat-card"><span>Selesai</span><strong>{summary.counts.SELESAI}</strong><small>Telah ditangani</small></article>
          <article className="staff-stat-card"><span>Ditolak</span><strong>{summary.counts.DITOLAK}</strong><small>Dengan alasan petugas</small></article>
        </div>
        {summary.isPartial && <p className="staff-sample-note">Angka di atas hanya mencakup 100 laporan terbaru.</p>}
        <div className="staff-dashboard-panel"><div className="staff-panel-title"><h3>Antrean terbaru</h3>
          <Link className="text-link" href="/petugas/laporan">Lihat semua ↗</Link></div>
          {summary.actionable.length ? <ul className="staff-attention-list">{summary.actionable.map(report =>
            <li key={report.id}><div><span className={`status-chip ${report.status.toLowerCase()}`}>{statusLabels[report.status]}</span>
              <h4>{categoryLabels[report.category]} · {report.location_text}</h4>
              <small>{dateTime(report.created_at)}</small></div>
              <Link className="staff-row-link" href={`/laporan/${report.id}`}>Tinjau laporan ↗</Link></li>)}</ul>
            : <p className="empty-state">Tidak ada laporan yang menunggu tindak lanjut.</p>}</div>
      </>}
    </section>

    <section aria-labelledby="staff-sensor-heading" className="staff-dashboard-section">
      <div className="staff-section-heading"><div><p className="staff-section-kicker">PEMANTAUAN SENSOR</p>
        <h2 id="staff-sensor-heading">Kondisi Titik Pantau</h2></div>
        <span className="staff-device-count">{devices.length} titik aktif</span></div>
      {devicesLoading ? <p role="status" className="empty-state">Memuat titik pantau…</p> : devicesError ?
        <p role="alert" className="empty-state">{devicesError}</p> : !devices.length ?
        <p className="empty-state">Belum ada perangkat aktif. {session.role === "admin" ?
          <Link className="text-link" href="/admin/perangkat">Buka pengaturan perangkat</Link> :
          "Hubungi admin untuk menyiapkan titik pantau."}</p> : <div className="staff-sensor-panel">
          <div className="staff-sensor-top"><label>Titik pemantauan<select value={deviceId ?? ""} onChange={event => setDeviceId(event.target.value)}>
            {devices.map(device => <option key={device.id} value={device.id}>{device.name}</option>)}</select></label>
            <span className={`staff-health ${telemetry.health.toLowerCase()}`}>{healthLabels[telemetry.health]}</span></div>
          <p className="staff-device-location">{selectedDevice?.location_description}</p>
          <div className="staff-sensor-metrics"><div><span>Tinggi air</span><strong>{height === null ? "—" : `${height.toFixed(1)} cm`}</strong></div>
            <div><span>Level peringatan</span><strong className={warning ? `staff-warning ${warning.toLowerCase()}` : ""}>{warning ?? "Belum diketahui"}</strong></div>
            <div><span>Hujan</span><strong>{fresh && reading?.is_raining !== null && reading?.is_raining !== undefined ?
              reading.is_raining ? "Hujan" : "Tidak hujan" : "Belum diketahui"}</strong></div></div>
          <p className="staff-sensor-time">Pembacaan terakhir: {reading ? dateTime(reading.received_at) : "Belum ada pembacaan"}</p>
          {telemetry.error && <p role="alert" className="form-message error">Data sensor belum dapat diperbarui. Coba buka pemantauan publik.</p>}
        </div>}
    </section>
  </div>;
}
