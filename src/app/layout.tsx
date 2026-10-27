import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./navigation-motion.css";
import { SiteMotion } from "../components/SiteMotion.tsx";

export const metadata: Metadata = { title: "No Banjir! — Pantau. Waspada. Siap Bertindak.",
  description: "Pemantauan ketinggian air dan hujan berbasis IoT untuk kesiapsiagaan lingkungan sekolah." };
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="id"><body><a className="skip-link" href="#main-content">Lewati ke konten</a>{children}<SiteMotion/></body></html>;
}
