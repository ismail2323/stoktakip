"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ScanLine,
  ShoppingCart,
  History,
  Truck,
  Settings,
  MoreHorizontal,
  X,
  Wrench,
  LogOut,
  UserRound,
} from "lucide-react";
import TemaDegistirici from "@/components/TemaDegistirici";

const TUM_LINKLER = [
  { href: "/", label: "Ana Sayfa", icon: LayoutDashboard },
  { href: "/stok", label: "Stok Listesi", icon: Package },
  { href: "/alis", label: "Fatura / Alış", icon: ScanLine },
  { href: "/satis", label: "Satış", icon: ShoppingCart },
  { href: "/hareketler", label: "Hareketler", icon: History },
  { href: "/tedarikciler", label: "Tedarikçiler", icon: Truck },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
];

const ALT_NAV_LINKLER = TUM_LINKLER.slice(0, 4);
const DIGER_LINKLER = TUM_LINKLER.slice(4);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [digerAcik, setDigerAcik] = useState(false);
  const [kullanici, setKullanici] = useState<{ kullaniciAdi: string; ad: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/auth/ben")
      .then((r) => (r.ok ? r.json() : null))
      .then(setKullanici)
      .catch(() => {});
  }, []);

  async function cikisYap() {
    await fetch("/api/auth/cikis", { method: "POST" });
    router.push("/giris");
    router.refresh();
  }

  const aktifMi = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="flex min-h-dvh w-full">
      {/* Masaüstü kenar çubuğu */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-surface px-4 py-6 md:flex">
        <div className="flex items-center gap-2 px-2 pb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Wrench size={18} />
          </div>
          <div>
            <div className="font-semibold leading-tight">Parça Depo</div>
            <div className="text-xs text-muted leading-tight">Stok Takip Sistemi</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {TUM_LINKLER.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                aktifMi(href)
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
            <UserRound size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{kullanici?.ad || kullanici?.kullaniciAdi || "..."}</div>
            <div className="truncate text-xs text-muted">@{kullanici?.kullaniciAdi || ""}</div>
          </div>
          <TemaDegistirici />
          <button onClick={cikisYap} aria-label="Çıkış yap" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Ana içerik */}
      <div className="flex min-h-dvh flex-1 flex-col">
        <header
          className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3 md:hidden"
          style={{ paddingTop: "max(0.75rem, var(--safe-top))" }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Wrench size={16} />
          </div>
          <div className="font-semibold">Parça Depo</div>
          <div className="ml-auto flex items-center gap-1">
            <TemaDegistirici />
            <button onClick={cikisYap} aria-label="Çıkış yap" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main
          className="flex-1 px-4 py-5 md:px-8 md:py-8 md:pb-8"
          style={{ paddingBottom: "calc(6rem + var(--safe-bottom))" }}
        >
          {children}
        </main>
      </div>

      {/* Mobil alt navigasyon */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-surface md:hidden"
        style={{ paddingBottom: "var(--safe-bottom)", paddingLeft: "var(--safe-left)", paddingRight: "var(--safe-right)" }}
      >
        {ALT_NAV_LINKLER.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
              aktifMi(href) ? "text-accent" : "text-muted"
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
        <button
          onClick={() => setDigerAcik(true)}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
            digerAcik || DIGER_LINKLER.some((l) => aktifMi(l.href)) ? "text-accent" : "text-muted"
          }`}
        >
          <MoreHorizontal size={20} />
          Diğer
        </button>
      </nav>

      {digerAcik && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDigerAcik(false)} />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-surface p-4"
            style={{ paddingBottom: "max(2rem, calc(1rem + var(--safe-bottom)))" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="font-semibold">Diğer Sayfalar</div>
              <button onClick={() => setDigerAcik(false)} className="text-muted">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {DIGER_LINKLER.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setDigerAcik(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
                    aktifMi(href) ? "bg-accent-soft text-accent" : "text-foreground"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
