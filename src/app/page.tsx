import Link from "next/link";
import { AuthToggle } from "../components/AuthToggle.tsx";
import { ReportForm } from "../components/ReportForm.tsx";
import { SiteFooter } from "../components/SiteFooter.tsx";
import { SiteHeader } from "../components/SiteHeader.tsx";

const features = [
  { title: "Ancaman Banjir", image: "/images/landing-card-ancaman.jpg",
    description: "Banjir yang kerap terjadi dapat mengganggu kegiatan belajar mengajar dan aktivitas warga sekolah." },
  { title: "Monitoring Air", image: "/images/landing-card-monitoring.jpg",
    description: "Diperlukan sistem yang dapat memantau ketinggian air secara real-time agar perubahan kondisi dapat diketahui lebih cepat." },
  { title: "Deteksi Dini", image: "/images/landing-card-deteksi.jpg",
    description: "Memberikan informasi dan peringatan dini agar warga sekolah dapat lebih sigap dalam menghadapi potensi banjir." },
];
const steps = ["Deteksi Ketinggian Air", "Proses Data", "Pengiriman Data", "Pemantauan dan Peringatan"];

export default function Home() {
  return <><SiteHeader/><main id="main-content" tabIndex={-1} className="landing-main">
    <section className="landing-hero" aria-labelledby="hero-title">
      <div className="hero-panel"><AuthToggle active="login"/>
        <div className="hero-copy"><h1 id="hero-title">MARI <span className="hero-outline">WUJUDKAN</span><br/>SEKOLAH NYAMAN.</h1>
          <p>Melalui website No Banjir!, kami memanfaatkan teknologi untuk memantau dan mendeteksi ketinggian air secara real-time, sehingga kita dapat lebih sigap dalam menghadapi potensi banjir dan mengambil tindakan pencegahan sejak dini.</p>
          <Link className="hero-dashboard-link" href="/dashboard">Lihat pemantauan <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </section>
    <section className="statement-section rings" aria-labelledby="statement-title">
      <p>No Banjir !</p><h2 id="statement-title">Informasi Lebih Cepat,<br/>Kesiapsiagaan Lebih Awal,<br/>Nyaman Berkegiatan.</h2>
    </section>
    <section id="laporan" className="landing-report content-width" aria-labelledby="landing-report-title">
      <div><h2 id="landing-report-title">Laporan</h2><ReportForm compact/></div>
      <div className="landing-report-copy"><p>Sampaikan kendala atau masalah yang Anda temui saat menggunakan inovasi No Banjir! maupun permasalahan lain terkait kondisi lingkungan di sekolah.</p>
        <Link className="blue-pill" href="/laporan">Pelajari Lebih Lanjut</Link></div>
    </section>
    <section id="tentang" className="feature-section content-width" aria-labelledby="feature-title">
      <div className="feature-intro"><h2 id="feature-title">Kenapa <span>Inovasi<br/>No Banjir!</span> Hadir?</h2>
        <p>No Banjir! diciptakan sebagai solusi berbasis teknologi IoT untuk membantu warga sekolah memantau ketinggian air dan mendeteksi potensi banjir sejak dini.</p>
        <Link className="text-link" href="/tentang">Tentang proyek <span aria-hidden="true">↗</span></Link></div>
      <div className="feature-cards">{features.map(feature => <article className="feature-card" key={feature.title}
        style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,.82), transparent 70%), url('${feature.image}')` }}>
        <div><h3>{feature.title}</h3><p>{feature.description}</p></div></article>)}</div>
    </section>
    <section id="cara-kerja" className="process-section content-width" aria-labelledby="process-title">
      <h2 id="process-title">Bagaimana <span>No Banjir!</span> Bekerja</h2>
      <p>Kenali bagaimana teknologi IoT membantu memantau ketinggian air dan mendeteksi potensi banjir sejak dini.</p>
      <div className="process-grid">{steps.map((step,index) => <article className={`process-panel process-${index+1}`} key={step}>
        <span className="process-number">0{index+1}</span><h3>{step}</h3><span className="sensor-placeholder">Foto Sensor</span>
      </article>)}</div>
    </section>
  </main><SiteFooter/></>;
}
