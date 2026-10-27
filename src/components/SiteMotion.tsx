"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NavigationIcon } from "./NavigationIcon.tsx";

const revealTargets = ".statement-section,.landing-report,.feature-intro,.feature-card,.process-panel,.water-chart,.motto-banner,.dashboard-report>h2,.dashboard-report>p,.dashboard-report-box,.risk-heading,.risk-row,.guide-card,.staff-dashboard-section,.report-list article,.detail-card";

export function SiteMotion() {
  const pathname = usePathname();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let frame = 0;
    const updateScroll = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty("--page-progress", String(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0));
      setShowTop(window.scrollY > 600);
    };
    const scheduleScroll = () => { if (!frame) frame = requestAnimationFrame(updateScroll); };
    window.addEventListener("scroll", scheduleScroll, { passive: true });
    window.addEventListener("resize", scheduleScroll);
    updateScroll();

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.querySelector("main");
    const marked: HTMLElement[] = [];
    const seen = new WeakSet<HTMLElement>();
    const observer = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.remove("reveal-pending");
        entry.target.classList.add("reveal-visible");
        observer?.unobserve(entry.target);
      }
    }, { threshold: 0.06, rootMargin: "0px 0px -32px 0px" }) : null;

    const register = (element: HTMLElement) => {
      if (seen.has(element) || !observer || motionPreference.matches) return;
      seen.add(element); marked.push(element);
      if (element.getBoundingClientRect().top < window.innerHeight * 0.95) return;
      element.style.setProperty("--reveal-delay", `${Math.min(3, Array.from(element.parentElement?.children ?? []).indexOf(element)) * 55}ms`);
      element.classList.add("reveal-pending");
      observer.observe(element);
    };
    root?.querySelectorAll<HTMLElement>(revealTargets).forEach(register);
    const additions = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) if (node instanceof HTMLElement) {
        if (node.matches(revealTargets)) register(node);
        node.querySelectorAll<HTMLElement>(revealTargets).forEach(register);
      }
      scheduleScroll();
    });
    if (root) additions.observe(root, { childList: true, subtree: true });
    const disableMotion = () => {
      if (motionPreference.matches) {
        observer?.disconnect();
        marked.forEach(element => element.classList.remove("reveal-pending"));
      }
    };
    motionPreference.addEventListener("change", disableMotion);
    return () => {
      window.removeEventListener("scroll", scheduleScroll);
      window.removeEventListener("resize", scheduleScroll);
      cancelAnimationFrame(frame);
      observer?.disconnect(); additions.disconnect();
      motionPreference.removeEventListener("change", disableMotion);
      marked.forEach(element => element.classList.remove("reveal-pending"));
    };
  }, [pathname]);

  return <button className={`back-to-top ${showTop ? "is-visible" : ""}`} type="button"
    aria-label="Kembali ke atas" title="Kembali ke atas" aria-hidden={!showTop} tabIndex={showTop ? 0 : -1}
    onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}>
    <NavigationIcon name="up"/>
  </button>;
}
