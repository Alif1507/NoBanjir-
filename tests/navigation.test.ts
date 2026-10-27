import test from "node:test";
import assert from "node:assert/strict";
import { navigationIsActive, pageBreadcrumbs } from "../src/lib/navigation.ts";

test("active navigation follows page boundaries and groups report detail pages", () => {
  assert.equal(navigationIsActive("/laporan/saya", "/laporan"), true);
  assert.equal(navigationIsActive("/laporan/buat", "/laporan"), true);
  assert.equal(navigationIsActive("/laporan", "/"), false);
  assert.equal(navigationIsActive("/laporan-lain", "/laporan"), false);
  assert.equal(navigationIsActive("/", "/"), true);
});

test("breadcrumbs link to the parent page and use a readable report detail label", () => {
  assert.deepEqual(pageBreadcrumbs("/admin/perangkat"), [
    { label: "Beranda", href: "/" }, { label: "Dashboard Admin", href: "/admin" },
    { label: "Pengaturan Perangkat", href: "/admin/perangkat" },
  ]);
  assert.deepEqual(pageBreadcrumbs("/laporan/4a5d24d2-5628-49e5-bb28-af2abf7fb826").at(-1), {
    label: "Detail Laporan", href: "/laporan/4a5d24d2-5628-49e5-bb28-af2abf7fb826",
  });
});
