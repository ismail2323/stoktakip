"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wrench,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Camera,
  ScanSearch,
  BarChart3,
  History,
  Smartphone,
  Tablet,
  Monitor,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import TemaDegistirici from "@/components/TemaDegistirici";

const OZELLIKLER = [
  {
    icon: Camera,
    baslik: "Fatura Fotoğrafla, Otomatik Oku",
    aciklama: "Kağıt faturayı telefonla fotoğraflayın; yapay zeka stok kodu, ürün adı, marka ve fiyatı saniyeler içinde okur.",
  },
  {
    icon: ScanSearch,
    baslik: "Kamerayla Anında Satış",
    aciklama: "Satılacak ürünün fotoğrafını çekin, sistem stoktaki karşılığını bulsun, adet girip stoktan otomatik düşsün.",
  },
  {
    icon: BarChart3,
    baslik: "Gerçek Zamanlı Raporlama",
    aciklama: "Günlük/haftalık satış-alış grafikleri, düşük stok uyarıları ve en çok satan ürünler tek ekranda.",
  },
  {
    icon: History,
    baslik: "Her Hareket Kayıt Altında",
    aciklama: "Kim, ne zaman, hangi yoldan (fatura okuma / kamera / elle) işlem yaptı — otomatik loglanır, hiçbir şey kaybolmaz.",
  },
];

const ADIMLAR = [
  "Faturayı ya da satılacak ürünü telefonla fotoğraflayın",
  "Yapay zeka bilgileri saniyeler içinde okusun",
  "Okunanları gözden geçirip tek dokunuşla onaylayın",
  "Depo, elle tek satır yazmadan otomatik güncellensin",
];

function GirisFormu() {
  const router = useRouter();
  const params = useSearchParams();
  const [durum, setDurum] = useState<"yukleniyor" | "kurulum" | "giris">("yukleniyor");

  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [ad, setAd] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifreTekrar, setSifreTekrar] = useState("");
  const [beniHatirla, setBeniHatirla] = useState(true);
  const [sifreGoster, setSifreGoster] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  useEffect(() => {
    fetch("/api/auth/kurulum-durumu")
      .then((r) => r.json())
      .then((veri) => setDurum(veri.kurulumTamam ? "giris" : "kurulum"));
  }, []);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);

    if (durum === "kurulum") {
      if (sifre !== sifreTekrar) {
        setHata("Şifreler eşleşmiyor.");
        return;
      }
      setGonderiliyor(true);
      try {
        const yanit = await fetch("/api/auth/ilk-kurulum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kullaniciAdi, sifre, ad, beniHatirla }),
        });
        const veri = await yanit.json();
        if (!yanit.ok) {
          setHata(veri.hata || "Kurulum başarısız.");
          return;
        }
        router.push(params.get("devam") || "/");
        router.refresh();
      } catch {
        setHata("Sunucuya ulaşılamadı.");
      } finally {
        setGonderiliyor(false);
      }
      return;
    }

    setGonderiliyor(true);
    try {
      const yanit = await fetch("/api/auth/giris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kullaniciAdi, sifre, beniHatirla }),
      });
      const veri = await yanit.json();
      if (!yanit.ok) {
        setHata(veri.hata || "Giriş başarısız.");
        return;
      }
      router.push(params.get("devam") || "/");
      router.refresh();
    } catch {
      setHata("Sunucuya ulaşılamadı.");
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background md:flex-row">
      {/* Sol: Urun tanitimi (mobilde kucultulmus, tablet/masaustunde tam) */}
      <div
        className="relative flex flex-col overflow-hidden bg-gradient-to-br from-[#e17a34] via-[#c2551a] to-[#7a2f0a] px-6 pb-6 text-white pt-[max(1.5rem,var(--safe-top))] md:w-[50%] md:justify-center md:px-10 md:pb-8 md:pt-[max(2rem,var(--safe-top))] lg:w-[54%]"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/10 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Wrench size={18} />
            </div>
            <span className="text-lg font-semibold tracking-tight">Parça Depo</span>
          </div>

          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles size={13} /> Yapay Zeka Destekli · Güncel Sistem
            </div>
            <h1 className="max-w-xl text-3xl font-bold leading-tight tracking-tight">
              Yeni Nesil Yedek Parça Stok Takibi
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 lg:text-base">
              Kağıt faturaları elle girmeyi unutun. Fotoğrafını çekin, yapay zeka okusun,
              siz sadece tek dokunuşla onaylayın — basit, hızlı ve kullanıcı dostu.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {OZELLIKLER.map(({ icon: Icon, baslik, aciklama }) => (
              <div key={baslik} className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                  <Icon size={16} />
                </div>
                <div>
                  <div className="text-sm font-semibold">{baslik}</div>
                  <div className="mt-0.5 text-xs leading-snug text-white/80 lg:text-sm">{aciklama}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden rounded-xl bg-white/10 p-4 backdrop-blur md:block">
            <div className="mb-3 text-sm font-semibold">Nasıl Çalışır?</div>
            <div className="grid gap-2.5 lg:grid-cols-2">
              {ADIMLAR.map((adim, i) => (
                <div key={adim} className="flex items-start gap-2.5 text-xs leading-snug text-white/85 lg:text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-semibold">
                    {i + 1}
                  </span>
                  {adim}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden items-center gap-4 border-t border-white/15 pt-4 text-xs text-white/85 md:flex lg:text-sm">
            <div className="flex items-center gap-1.5">
              <Smartphone size={16} /> Telefon
            </div>
            <div className="flex items-center gap-1.5">
              <Tablet size={16} /> Tablet
            </div>
            <div className="flex items-center gap-1.5">
              <Monitor size={16} /> Bilgisayar
            </div>
            <span className="ml-auto flex items-center gap-1 text-xs text-white/70">
              <CheckCircle2 size={13} /> Hepsi aynı hesapta senkron
            </span>
          </div>
        </div>
      </div>

      {/* Sag: Giris formu */}
      <div
        className="relative flex flex-1 items-center justify-center px-4 py-10"
        style={{
          paddingTop: "max(2.5rem, var(--safe-top))",
          paddingBottom: "max(2.5rem, var(--safe-bottom))",
          paddingLeft: "max(1rem, var(--safe-left))",
          paddingRight: "max(1rem, var(--safe-right))",
        }}
      >
        <div className="absolute right-4 top-[max(1rem,var(--safe-top))]">
          <TemaDegistirici />
        </div>

        <div className="w-full max-w-md">
          {durum === "yukleniyor" ? (
            <div className="flex justify-center py-10 text-muted">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : (
            <form onSubmit={gonder} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-black/10 md:p-8 dark:shadow-black/30">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  {durum === "kurulum" ? "İlk Kurulum: Yönetici Hesabı Oluştur" : "Elazığ Yedek Parça'ya Hoş Geldiniz"}
                </h1>
                <p className="mt-1 text-sm text-muted">
                  {durum === "kurulum"
                    ? "Bu sistemde henüz hesap yok. Dükkan için ilk kullanıcı adı ve şifreyi belirleyin."
                    : "Devam etmek için kullanıcı adı ve şifrenizle giriş yapın."}
                </p>
              </div>

              {hata && (
                <div className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" /> {hata}
                </div>
              )}

              {durum === "kurulum" && (
                <div>
                  <label className="mb-1 block text-xs text-muted">Ad Soyad (opsiyonel)</label>
                  <input
                    name="ad"
                    autoComplete="name"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-accent md:text-sm"
                    value={ad}
                    onChange={(e) => setAd(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs text-muted">Kullanıcı Adı</label>
                <input
                  name="username"
                  autoComplete="username"
                  required
                  autoFocus
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-accent md:text-sm"
                  value={kullaniciAdi}
                  onChange={(e) => setKullaniciAdi(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted">Şifre</label>
                <div className="relative">
                  <input
                    name="password"
                    autoComplete={durum === "kurulum" ? "new-password" : "current-password"}
                    required
                    type={sifreGoster ? "text" : "password"}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 pr-10 text-base outline-none focus:border-accent md:text-sm"
                    value={sifre}
                    onChange={(e) => setSifre(e.target.value)}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setSifreGoster((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                  >
                    {sifreGoster ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {durum === "kurulum" && (
                <div>
                  <label className="mb-1 block text-xs text-muted">Şifre (Tekrar)</label>
                  <input
                    name="password-confirm"
                    autoComplete="new-password"
                    required
                    type={sifreGoster ? "text" : "password"}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-accent md:text-sm"
                    value={sifreTekrar}
                    onChange={(e) => setSifreTekrar(e.target.value)}
                    minLength={6}
                  />
                </div>
              )}

              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  className="h-4 w-4 appearance-auto rounded border border-border bg-surface accent-accent"
                  checked={beniHatirla}
                  onChange={(e) => setBeniHatirla(e.target.checked)}
                />
                Beni hatırla
              </label>

              <button
                type="submit"
                disabled={gonderiliyor}
                className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
              >
                {gonderiliyor && <Loader2 size={16} className="animate-spin" />}
                {durum === "kurulum" ? "Hesabı Oluştur ve Başla" : "Giriş Yap"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GirisSayfasi() {
  return (
    <Suspense fallback={null}>
      <GirisFormu />
    </Suspense>
  );
}
