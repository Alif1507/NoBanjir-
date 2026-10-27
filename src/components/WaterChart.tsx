"use client";

import type { HistoryRange } from "../hooks/use-telemetry.ts";

export type ChartPoint = { received_at: string; water_height_cm: number; source?: "DEMO" };
const ranges: [HistoryRange,string][] = [["1h","1 jam"],["6h","6 jam"],["24h","24 jam"],["7d","7 hari"]];
const timeLabel = (value: string) => new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta",
  hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }).format(new Date(value));

export function WaterChart({ points, range, onRangeChange, demo }:
  { points: ChartPoint[]; range: HistoryRange; onRangeChange: (range: HistoryRange) => void; demo: boolean }) {
  const valid = points.filter(point => Number.isFinite(point.water_height_cm)).slice(-140);
  const max = Math.max(10, ...valid.map(point => point.water_height_cm)) * 1.15;
  const width = 1000, height = 260;
  const coords = valid.map((point,index) => ({ x: 35 + (valid.length < 2 ? 0 : index * 930 / (valid.length - 1)),
    y: height - 20 - point.water_height_cm / max * 215 }));
  const line = coords.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  return <section id="grafik" className="water-chart content-width" aria-labelledby="chart-title">
    <div className="chart-head"><h2 id="chart-title">Grafik</h2><div className="chart-ranges" role="group" aria-label="Rentang waktu">
      {ranges.map(([value,label]) => <button type="button" key={value} className={range === value ? "selected" : ""}
        aria-pressed={range === value} onClick={() => onRangeChange(value)}>{label}</button>)}</div></div>
    {valid.length ? <><div className="chart-svg-wrap"><svg viewBox={`0 0 ${width} ${height}`} role="img"
      aria-label={`Grafik tinggi air ${demo ? "simulasi" : "tersimpan"}, ${valid.length} titik. Terakhir ${valid.at(-1)?.water_height_cm.toFixed(1)} sentimeter.`}>
      {[0,.25,.5,.75,1].map(fraction => <g key={fraction}><line x1="35" x2="965" y1={height-20-fraction*215}
        y2={height-20-fraction*215} stroke="#414141" strokeDasharray="4 7"/>
        <text x="2" y={height-16-fraction*215} fill="#aeb8bf" fontSize="17">{Math.round(max*fraction)}</text></g>)}
      <polyline key={range} className="chart-trace" pathLength="1" points={line} fill="none" stroke="#57f6fe" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      {coords.length === 1 && <circle cx={coords[0].x} cy={coords[0].y} r="7" fill="#57f6fe"/>}
      </svg></div><div className="chart-axis"><span>{timeLabel(valid[0].received_at)}</span><span>{timeLabel(valid.at(-1)!.received_at)} WIB</span></div></>
      : <p className="chart-empty">Grafik<span>Belum ada pembacaan pada rentang ini.</span></p>}
  </section>;
}
