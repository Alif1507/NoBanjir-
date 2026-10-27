"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ReportForm } from "../../components/ReportForm.tsx";
import { RiskLevels } from "../../components/RiskLevels.tsx";
import { SiteFooter } from "../../components/SiteFooter.tsx";
import { SiteHeader } from "../../components/SiteHeader.tsx";
import { WaterChart, type ChartPoint } from "../../components/WaterChart.tsx";
import { demoSeries, demoSnapshot } from "../../lib/demo/data.ts";
import {
  deviceSchema,
  type Device,
  type WarningLevel,
} from "../../lib/iot/schema.ts";
import { useTelemetry, type HistoryRange } from "../../hooks/use-telemetry.ts";

const label: Record<WarningLevel, string> = {
  NORMAL: "Kondisi Aman",
  WASPADA: "Waspada",
  SIAGA: "Siaga",
  BAHAYA: "Bahaya",
};
const statusIcons: Record<WarningLevel, string> = {
  NORMAL: "/images/status-icons/Aman.png",
  WASPADA: "/images/status-icons/Waspada.png",
  SIAGA: "/images/status-icons/Siaga.png",
  BAHAYA: "/images/status-icons/Bahaya.png",
};
const fmtTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value)) + " WIB"
    : "Belum ada pembacaan";

export default function DashboardPage() {
  const [demo, setDemo] = useState(false);
  const [demoLevel, setDemoLevel] = useState<WarningLevel>("NORMAL");
  const [demoRain, setDemoRain] = useState(false);
  const [demoOffline, setDemoOffline] = useState(false);
  const [range, setRange] = useState<HistoryRange>("1h");
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    setDemo(new URLSearchParams(window.location.search).get("demo") === "1");
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setListLoading(true);
    setListError(false);
    fetch("/api/devices", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unavailable");
        const result = z
          .object({ devices: z.array(deviceSchema) })
          .parse(await response.json());
        if (!controller.signal.aborted) {
          setDevices(result.devices);
          setDeviceId((current) =>
            result.devices.some((d) => d.id === current)
              ? current
              : (result.devices[0]?.id ?? null),
          );
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setListError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setListLoading(false);
      });
    return () => controller.abort();
  }, [reload]);
  const device = devices.find((d) => d.id === deviceId);
  const telemetry = useTelemetry(
    demo ? null : deviceId,
    device?.offline_after_seconds ?? 90,
    range,
  );
  const snapshot = demoSnapshot(
    demoLevel,
    demoRain,
    demoOffline,
    new Date(telemetry.now),
  );
  const fresh = telemetry.health === "ONLINE" || telemetry.health === "ERROR";
  const liveCritical =
    fresh && telemetry.reading?.float_switch_critical === true;
  const level = demo
    ? snapshot.level
    : fresh
      ? liveCritical
        ? "BAHAYA"
        : telemetry.reading?.is_valid
          ? telemetry.reading.warning_level
          : null
      : null;
  const height = demo
    ? snapshot.heightCm
    : fresh && telemetry.reading?.is_valid
      ? telemetry.reading.water_height_cm
      : null;
  const health = demo ? snapshot.health : telemetry.health;
  const raining = demo
    ? snapshot.isRaining
    : fresh
      ? telemetry.reading?.is_raining
      : null;
  const chartPoints: ChartPoint[] = demo
    ? demoSeries(demoLevel, range, new Date(telemetry.now))
    : telemetry.history
        .filter((r) => r.is_valid && r.water_height_cm !== null)
        .map((r) => ({
          received_at: r.received_at,
          water_height_cm: r.water_height_cm!,
        }));
  const statusTitle = level
    ? label[level]
    : health === "OFFLINE" || health === "STALE"
      ? "Perangkat Offline"
      : health === "ERROR"
        ? "Sensor Bermasalah"
        : "Data Belum Tersedia";
  const statusText =
    health === "OFFLINE" || health === "STALE"
      ? "Status air terbaru belum dapat dipastikan."
      : health === "ERROR"
        ? "Pembacaan jarak perlu diperiksa."
        : level
          ? "Periksa panduan tindakan sesuai tingkat kondisi."
          : "Belum ada pembacaan sensor yang valid.";
  return (
    <>
      <SiteHeader variant="dashboard" />
      <main className="dashboard-main">
        <section
          id="kondisi"
          className="conditions content-width"
          aria-labelledby="condition-title"
        >
          <div className="condition-top">
            <div>
              <h1 id="condition-title">Kondisi Sekolah Saat Ini</h1>
              <p>Pemantauan sekolah secara langsung.</p>
            </div>
            <span className={`source-badge ${demo ? "demo" : ""}`}>
              {demo
                ? "MODE DEMO — DATA SIMULASI"
                : health === "ONLINE"
                  ? "LIVE"
                  : "DATA SENSOR"}
            </span>
          </div>
          {demo && (
            <div
              className="demo-controls"
              role="group"
              aria-label="Pengaturan simulasi"
            >
              <label>
                Status simulasi
                <select
                  value={demoLevel}
                  onChange={(e) => setDemoLevel(e.target.value as WarningLevel)}
                >
                  {(["NORMAL", "WASPADA", "SIAGA", "BAHAYA"] as const).map(
                    (value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={demoRain}
                  onChange={(e) => setDemoRain(e.target.checked)}
                />{" "}
                Hujan
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={demoOffline}
                  onChange={(e) => setDemoOffline(e.target.checked)}
                />{" "}
                Perangkat offline
              </label>
              <Link href="/dashboard">Kembali ke data sensor</Link>
            </div>
          )}
          {!demo && (
            <div className="sensor-meta">
              {devices.length > 1 && (
                <label>
                  Titik pemantauan{" "}
                  <select
                    value={deviceId ?? ""}
                    onChange={(e) => setDeviceId(e.target.value)}
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {device && (
                <p>
                  {device.name} · {device.location_description}
                </p>
              )}
              {listLoading && <p role="status">Memuat titik pemantauan…</p>}
              {!listLoading && !listError && !devices.length && (
                <p role="status">
                  Belum ada perangkat aktif. Data sensor belum tersedia.
                </p>
              )}
              {(listError || telemetry.error) && (
                <p role="alert">
                  Koneksi data sedang bermasalah.{" "}
                  <button type="button" onClick={() => setReload((v) => v + 1)}>
                    Coba lagi
                  </button>
                </p>
              )}
            </div>
          )}
          {(level === "SIAGA" || level === "BAHAYA") && (
            <div
              className={`warning-banner ${level.toLowerCase()}`}
              role="alert"
            >
              <strong>
                {level}: {device?.name ?? "Simulasi"}
              </strong>
              <span>
                Periksa kondisi di lapangan dan ikuti prosedur sekolah.
              </span>
            </div>
          )}
          <div className="condition-cards">
            <article className="height-card">
              <div className="card-heading">
                <span className="gray-disc" aria-hidden="true" />
                <h2>Ketinggian Air</h2>
              </div>
              <p className="height-number" aria-live="polite">
                {height === null ? (
                  "–"
                ) : (
                  <>
                    {height.toFixed(1)} <small>cm</small>
                  </>
                )}
              </p>
              <p className="height-status">
                <span
                  className={`status-dot ${level?.toLowerCase() ?? "unknown"}`}
                />
                {level ?? "Belum diketahui"}
              </p>
            </article>
            <article
              className={`current-card ${level?.toLowerCase() ?? "unknown"}`}
            >
              <div className="card-heading">
                <span
                  className={`gray-disc ${level ? "has-status-icon" : ""}`}
                  aria-hidden="true"
                >
                  {level && (
                    <Image
                      src={statusIcons[level]}
                      alt=""
                      width={96}
                      height={96}
                      className="status-icon-image"
                      unoptimized
                    />
                  )}
                </span>
                <h2>Status Saat Ini</h2>
              </div>
              <p className="current-title" aria-live="polite">
                {statusTitle}
              </p>
              <p className="current-copy">{statusText}</p>
            </article>
          </div>
          <div className="reading-meta">
            <span>
              Hujan:{" "}
              {raining === null || raining === undefined
                ? "Belum diketahui"
                : raining
                  ? "Hujan"
                  : "Tidak hujan"}
            </span>
            <span>
              Perangkat:{" "}
              {health === "ONLINE"
                ? "Online"
                : health === "ERROR"
                  ? "Error"
                  : health === "STALE" || health === "OFFLINE"
                    ? "Offline"
                    : "Belum ada data"}
            </span>
            <span>
              Pembaruan:{" "}
              {demo
                ? "Simulasi"
                : fmtTime(telemetry.reading?.received_at ?? null)}
            </span>
          </div>
          {telemetry.truncated && !demo && (
            <p className="subtle-note">
              Riwayat dibatasi pada 1.000 pembacaan terbaru.
            </p>
          )}
        </section>
        <WaterChart
          points={chartPoints}
          range={range}
          onRangeChange={setRange}
          demo={demo}
        />
        <section className="motto-banner" aria-label="Slogan No Banjir">
          <div>
            <h2>No Banjir!</h2>
            <p>
              CEGAH <span>●</span> ATASI <span>●</span> SELESAI
            </p>
          </div>
        </section>
        <section
          id="laporan"
          className="dashboard-report rings"
          aria-labelledby="dashboard-report-title"
        >
          <h2 id="dashboard-report-title">Laporkan Permasalahan Anda</h2>
          <p>
            Sampaikan laporan mengenai genangan air, potensi banjir, atau
            kendala yang Anda temukan di lingkungan sekolah untuk membantu
            meningkatkan keamanan dan kesiapsiagaan bersama.
          </p>
          <div className="dashboard-report-box">
            <ReportForm />
            <div className="report-photo">
              <p>
                Laporkan
                <br />
                Permasalahan
                <br />
                Banjir
              </p>
            </div>
          </div>
          <Link className="all-reports-link" href="/laporan">
            Lihat laporan lingkungan ↗
          </Link>
        </section>
        <RiskLevels />
      </main>
      <SiteFooter variant="dashboard" />
    </>
  );
}
