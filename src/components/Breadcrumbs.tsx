"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { pageBreadcrumbs } from "../lib/navigation.ts";

export function Breadcrumbs() {
  const items = pageBreadcrumbs(usePathname());
  return <nav className="breadcrumbs" aria-label="Jejak navigasi"><ol>{items.map((item, index) =>
    <li key={item.href}>{index > 0 && <span aria-hidden="true">/</span>}{index === items.length - 1 ?
      <span aria-current="page">{item.label}</span> : <Link href={item.href}>{item.label}</Link>}</li>
  )}</ol></nav>;
}
