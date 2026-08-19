import { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function Kart({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-surface p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Baslik({ title, aciklama, sag }: { title: string; aciklama?: string; sag?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {aciklama && <p className="mt-0.5 text-sm text-muted">{aciklama}</p>}
      </div>
      {sag}
    </div>
  );
}

export function Buton({
  className = "",
  varyant = "birincil",
  boyut = "orta",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  varyant?: "birincil" | "ikincil" | "tehlike" | "hayalet";
  boyut?: "kucuk" | "orta";
}) {
  const varyantlar: Record<string, string> = {
    birincil: "bg-accent text-accent-foreground hover:opacity-90",
    ikincil: "bg-surface-2 text-foreground hover:bg-border",
    tehlike: "bg-danger text-white hover:opacity-90",
    hayalet: "bg-transparent text-foreground hover:bg-surface-2",
  };
  const boyutlar: Record<string, string> = {
    kucuk: "min-h-[38px] px-3 py-1.5 text-sm",
    orta: "min-h-[44px] px-4 py-2.5 text-sm",
  };
  return (
    <button
      className={`inline-flex touch-manipulation items-center justify-center gap-2 rounded-lg font-medium transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${varyantlar[varyant]} ${boyutlar[boyut]} ${className}`}
      {...props}
    />
  );
}

// text-base (16px) kasitli: iOS Safari, font-size 16px'in altindaki
// inputlara odaklanildiginda sayfayi otomatik yakinlastirir.
export function Girdi({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full min-h-[44px] touch-manipulation rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none placeholder:text-muted focus:border-accent md:text-sm ${className}`}
      {...props}
    />
  );
}

export function Secim({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={`relative ${className || "w-full"}`}>
      <select
        className="min-h-[44px] w-full touch-manipulation rounded-lg border border-border bg-surface px-3 py-2.5 pr-9 text-base outline-none focus:border-accent md:text-sm"
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  );
}

export function Etiket({
  children,
  ton = "notr",
}: {
  children: ReactNode;
  ton?: "notr" | "ok" | "warn" | "danger" | "accent";
}) {
  const tonlar: Record<string, string> = {
    notr: "bg-surface-2 text-muted",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
    accent: "bg-accent-soft text-accent",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tonlar[ton]}`}>
      {children}
    </span>
  );
}

export function IstatKart({
  baslik,
  deger,
  altBilgi,
  icon,
}: {
  baslik: string;
  deger: string;
  altBilgi?: string;
  icon?: ReactNode;
}) {
  return (
    <Kart className="flex items-start justify-between">
      <div>
        <div className="text-xs font-medium text-muted">{baslik}</div>
        <div className="mt-1.5 text-2xl font-semibold tracking-tight">{deger}</div>
        {altBilgi && <div className="mt-1 text-xs text-muted">{altBilgi}</div>}
      </div>
      {icon && <div className="rounded-lg bg-accent-soft p-2 text-accent">{icon}</div>}
    </Kart>
  );
}

export function BosDurum({ mesaj }: { mesaj: string }) {
  return <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">{mesaj}</div>;
}

export function Yukleniyor() {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-muted">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
      <span className="ml-3">Yükleniyor...</span>
    </div>
  );
}

export const paraFormat = (n: number | null | undefined) =>
  n == null ? "-" : new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);
