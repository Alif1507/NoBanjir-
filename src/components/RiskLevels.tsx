const levels = [
  ["Normal", "Ketinggian air berada dalam batas aman.", "normal"],
  ["Waspada", "Ketinggian air mulai meningkat dari biasanya.", "waspada"],
  ["Siaga", "Ketinggian air terus meningkat dan perlu perhatian.", "siaga"],
  ["Bahaya", "Ketinggian air mencapai tingkat yang berbahaya.", "bahaya"],
] as const;

export function RiskLevels() {
  return <section id="status-air" className="risk-levels content-width rings" aria-labelledby="risk-title">
    <div className="risk-heading"><h2 id="risk-title">Tingkatan <span>Kondisi<br/>Ketinggian Air</span></h2>
      <p>Kenali setiap tingkatan kondisi air yang ditampilkan oleh No Banjir! agar warga sekolah dapat memahami situasi dan mengambil tindakan yang tepat sesuai tingkat risiko banjir.</p></div>
    <div className="risk-list">{levels.map(([name, description, key]) => <div className="risk-row" key={name}>
      <div className={`risk-ribbon ${key}`}><span>{name}</span></div><p>{description}</p></div>)}</div>
  </section>;
}
