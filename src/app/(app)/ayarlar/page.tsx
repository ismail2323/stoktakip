"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Save, KeyRound, Eye, EyeOff, Store } from "lucide-react";
import { Baslik, Kart, Buton, Girdi } from "@/components/ui";

type GenelAyarlar = {
  dukkanAdi: string;
  varsayilanMinStok: string;
};

export default function AyarlarPage() {
  const [ayarlar, setAyarlar] = useState<GenelAyarlar | null>(null);
  const [genelKaydediliyor, setGenelKaydediliyor] = useState(false);
  const [genelBasari, setGenelBasari] = useState(false);

  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [ad, setAd] = useState("");
  const [yeniKullaniciAdi, setYeniKullaniciAdi] = useState("");
  const [yeniAd, setYeniAd] = useState("");
  const [mevcutSifre, setMevcutSifre] = useState("");
  const [yeniSifre, setYeniSifre] = useState("");
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState("");
  const [sifreGoster, setSifreGoster] = useState(false);
  const [hesapKaydediliyor, setHesapKaydediliyor] = useState(false);
  const [hesapHata, setHesapHata] = useState<string | null>(null);
  const [hesapBasari, setHesapBasari] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((veri) =>
      setAyarlar({ dukkanAdi: veri.dukkanAdi, varsayilanMinStok: veri.varsayilanMinStok })
    );
    fetch("/api/auth/ben")
      .then((r) => r.json())
      .then((veri) => {
        setKullaniciAdi(veri.kullaniciAdi);
        setAd(veri.ad || "");
        setYeniKullaniciAdi(veri.kullaniciAdi);
        setYeniAd(veri.ad || "");
      });
  }, []);

  async function genelKaydet() {
    if (!ayarlar) return;
    setGenelKaydediliyor(true);
    setGenelBasari(false);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ayarlar),
      });
      setGenelBasari(true);
    } finally {
      setGenelKaydediliyor(false);
    }
  }

  async function hesapKaydet(e: React.FormEvent) {
    e.preventDefault();
    setHesapHata(null);
    setHesapBasari(false);

    if (!mevcutSifre) {
      setHesapHata("Değişiklik yapmak için mevcut şifrenizi girmelisiniz.");
      return;
    }
    if (yeniSifre && yeniSifre !== yeniSifreTekrar) {
      setHesapHata("Yeni şifreler eşleşmiyor.");
      return;
    }

    setHesapKaydediliyor(true);
    try {
      const yanit = await fetch("/api/auth/degistir", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mevcutSifre,
          yeniKullaniciAdi: yeniKullaniciAdi !== kullaniciAdi ? yeniKullaniciAdi : undefined,
          yeniAd: yeniAd !== ad ? yeniAd : undefined,
          yeniSifre: yeniSifre || undefined,
        }),
      });
      const veri = await yanit.json();
      if (!yanit.ok) {
        setHesapHata(veri.hata || "Güncellenemedi.");
        return;
      }
      setKullaniciAdi(veri.kullaniciAdi);
      setAd(veri.ad || "");
      setMevcutSifre("");
      setYeniSifre("");
      setYeniSifreTekrar("");
      setHesapBasari(true);
    } catch {
      setHesapHata("Sunucuya ulaşılamadı.");
    } finally {
      setHesapKaydediliyor(false);
    }
  }

  if (!ayarlar) return null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Baslik title="Ayarlar" aciklama="Dükkan bilgileri ve hesap ayarları." />

      <Kart className="mb-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 font-semibold">
          <Store size={16} className="text-accent" /> Dükkan Bilgileri
        </div>

        {genelBasari && (
          <div className="flex items-center gap-2 rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">
            <CheckCircle2 size={16} /> Kaydedildi.
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs text-muted">Dükkan Adı</label>
          <Girdi value={ayarlar.dukkanAdi} onChange={(e) => setAyarlar({ ...ayarlar, dukkanAdi: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Varsayılan Minimum Stok Uyarı Seviyesi</label>
          <Girdi
            type="number"
            value={ayarlar.varsayilanMinStok}
            onChange={(e) => setAyarlar({ ...ayarlar, varsayilanMinStok: e.target.value })}
          />
        </div>

        <Buton className="self-start" onClick={genelKaydet} disabled={genelKaydediliyor}>
          {genelKaydediliyor ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Kaydet
        </Buton>
      </Kart>

      <Kart className="flex flex-col gap-4">
        <div className="flex items-center gap-2 font-semibold">
          <KeyRound size={16} className="text-accent" /> Giriş Bilgileri
        </div>
        <p className="-mt-2 text-xs text-muted">
          Kullanıcı adınızı veya şifrenizi değiştirmek için önce mevcut şifrenizi girin.
        </p>

        {hesapBasari && (
          <div className="flex items-center gap-2 rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">
            <CheckCircle2 size={16} /> Hesap bilgileri güncellendi.
          </div>
        )}
        {hesapHata && (
          <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{hesapHata}</div>
        )}

        <form onSubmit={hesapKaydet} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs text-muted">Ad Soyad</label>
            <Girdi name="ad" autoComplete="name" value={yeniAd} onChange={(e) => setYeniAd(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Kullanıcı Adı</label>
            <Girdi name="username" autoComplete="username" value={yeniKullaniciAdi} onChange={(e) => setYeniKullaniciAdi(e.target.value)} />
          </div>

          <div className="border-t border-border pt-4">
            <label className="mb-1 block text-xs text-muted">Yeni Şifre (opsiyonel)</label>
            <div className="relative">
              <input
                name="new-password"
                autoComplete="new-password"
                type={sifreGoster ? "text" : "password"}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 pr-10 text-base outline-none focus:border-accent md:text-sm"
                value={yeniSifre}
                onChange={(e) => setYeniSifre(e.target.value)}
                placeholder="Değiştirmek istemiyorsanız boş bırakın"
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
          {yeniSifre && (
            <div>
              <label className="mb-1 block text-xs text-muted">Yeni Şifre (Tekrar)</label>
              <input
                name="new-password-confirm"
                autoComplete="new-password"
                type={sifreGoster ? "text" : "password"}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-accent md:text-sm"
                value={yeniSifreTekrar}
                onChange={(e) => setYeniSifreTekrar(e.target.value)}
                minLength={6}
              />
            </div>
          )}

          <div className="border-t border-border pt-4">
            <label className="mb-1 block text-xs text-muted">Mevcut Şifre (onay için gerekli)</label>
            <input
              name="current-password"
              autoComplete="current-password"
              type={sifreGoster ? "text" : "password"}
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-accent md:text-sm"
              value={mevcutSifre}
              onChange={(e) => setMevcutSifre(e.target.value)}
            />
          </div>

          <Buton type="submit" className="self-start" disabled={hesapKaydediliyor}>
            {hesapKaydediliyor ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Hesabı Güncelle
          </Buton>
        </form>
      </Kart>
    </div>
  );
}
