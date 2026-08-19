"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  Minus,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PackageX,
  Camera,
  ScanSearch,
  Receipt,
  RotateCcw,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { Baslik, Kart, Buton, Girdi, Etiket, BosDurum, paraFormat } from "@/components/ui";
import { resmiOku } from "@/lib/resim";

type Urun = {
  id: string;
  stokKodu: string;
  urunAdi: string;
  marka: string;
  miktar: number;
  birim: string;
  satisFiyati: number | null;
};

type FaturaSatiri = {
  okunanStokKodu: string;
  okunanUrunAdi: string;
  miktar: number;
  eslesmeTuru: "kod+isim" | "kod" | "isim" | null;
  eslesmeNotu: string;
  eslesenUrun: { id: string; stokKodu: string; urunAdi: string; miktar: number; birim: string; satisFiyati: number | null } | null;
  dahilEt: boolean;
};

export default function SatisPage() {
  const [mod, setMod] = useState<"arama" | "kamera" | "fatura">("arama");

  const [sorgu, setSorgu] = useState("");
  const [sonuclar, setSonuclar] = useState<Urun[]>([]);
  const [ariyorMu, setAriyorMu] = useState(false);

  const dosyaInputRef = useRef<HTMLInputElement>(null);
  const [yukleniyorTanima, setYukleniyorTanima] = useState(false);
  const [tanimaHata, setTanimaHata] = useState<string | null>(null);
  const [tanimaSonuc, setTanimaSonuc] = useState<{ stokKoduTahmini: string | null; urunAdiTahmini: string | null } | null>(null);
  const [tanimaEslesenler, setTanimaEslesenler] = useState<Urun[]>([]);

  const faturaDosyaInputRef = useRef<HTMLInputElement>(null);
  const [yukleniyorFatura, setYukleniyorFatura] = useState(false);
  const [faturaHata, setFaturaHata] = useState<string | null>(null);
  const [faturaSatirlari, setFaturaSatirlari] = useState<FaturaSatiri[] | null>(null);
  const [faturaKaydediliyor, setFaturaKaydediliyor] = useState(false);
  const [faturaBasari, setFaturaBasari] = useState<string | null>(null);

  const [seciliUrun, setSeciliUrun] = useState<Urun | null>(null);
  const [satisKaynagi, setSatisKaynagi] = useState<"elle" | "kamera">("elle");
  const [miktar, setMiktar] = useState(1);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basari, setBasari] = useState<string | null>(null);

  useEffect(() => {
    if (!sorgu.trim()) return;
    const zamanlayici = setTimeout(() => {
      setAriyorMu(true);
      fetch(`/api/products?q=${encodeURIComponent(sorgu.trim())}`)
        .then((r) => r.json())
        .then((veri) => setSonuclar(veri))
        .finally(() => setAriyorMu(false));
    }, 300);
    return () => clearTimeout(zamanlayici);
  }, [sorgu]);

  const gosterilecekSonuclar = sorgu.trim() ? sonuclar : [];

  function urunSec(u: Urun, kaynak: "elle" | "kamera" = "elle") {
    setSeciliUrun(u);
    setSatisKaynagi(kaynak);
    setMiktar(1);
    setHata(null);
    setBasari(null);
  }

  async function fotografSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    e.target.value = "";
    if (!dosya) return;

    setBasari(null);
    setTanimaHata(null);
    setTanimaSonuc(null);
    setTanimaEslesenler([]);
    setYukleniyorTanima(true);

    try {
      const dataUrl = await resmiOku(dosya, 1200);
      if (!dataUrl) {
        setTanimaHata("Fotoğraf okunamadı. Lütfen tekrar çekmeyi deneyin.");
        return;
      }
      const yanit = await fetch("/api/ocr/urun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const veri = await yanit.json();
      if (!yanit.ok) {
        setTanimaHata(veri.hata || "Ürün tanınamadı.");
        return;
      }
      setTanimaSonuc(veri.tanima);
      setTanimaEslesenler(veri.eslesenler);
      if (veri.eslesenler.length === 1) {
        urunSec(veri.eslesenler[0], "kamera");
      }
    } catch {
      setTanimaHata("Ürün tanınamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setYukleniyorTanima(false);
    }
  }

  async function satisiOnayla() {
    if (!seciliUrun) return;
    if (miktar < 1 || miktar > seciliUrun.miktar) {
      setHata(`Geçersiz miktar. Mevcut stok: ${seciliUrun.miktar} ${seciliUrun.birim}`);
      return;
    }
    setKaydediliyor(true);
    setHata(null);
    try {
      const yanit = await fetch("/api/stock/out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urunId: seciliUrun.id, miktar, kaynak: satisKaynagi }),
      });
      const veri = await yanit.json();
      if (!yanit.ok) {
        setHata(veri.hata || "Satış işlenemedi.");
        return;
      }
      setBasari(`${miktar} ${seciliUrun.birim} "${seciliUrun.urunAdi}" satıldı, stoktan düşüldü.`);
      setSeciliUrun(null);
      setSorgu("");
      setSonuclar([]);
      setTanimaSonuc(null);
      setTanimaEslesenler([]);
    } catch {
      setHata("Sunucuya ulaşılamadı.");
    } finally {
      setKaydediliyor(false);
    }
  }

  async function faturaFotografiSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    e.target.value = "";
    if (!dosya) return;

    setFaturaBasari(null);
    setFaturaHata(null);
    setFaturaSatirlari(null);
    setYukleniyorFatura(true);

    try {
      const dataUrl = await resmiOku(dosya);
      if (!dataUrl) {
        setFaturaHata("Fotoğraf okunamadı. Lütfen tekrar çekmeyi deneyin.");
        return;
      }
      const yanit = await fetch("/api/ocr/satis-fatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const veri = await yanit.json();
      if (!yanit.ok) {
        setFaturaHata(veri.hata || "Fatura okunamadı.");
        return;
      }
      setFaturaSatirlari(
        veri.satirlar.map((s: FaturaSatiri) => ({ ...s, dahilEt: Boolean(s.eslesenUrun) }))
      );
    } catch {
      setFaturaHata("Fatura okunamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setYukleniyorFatura(false);
    }
  }

  function faturaSatiriGuncelle(i: number, alan: "miktar" | "dahilEt", deger: number | boolean) {
    if (!faturaSatirlari) return;
    const kopya = [...faturaSatirlari];
    kopya[i] = { ...kopya[i], [alan]: deger };
    setFaturaSatirlari(kopya);
  }

  function faturaSifirla() {
    setFaturaSatirlari(null);
    setFaturaHata(null);
    setFaturaBasari(null);
  }

  const gecerliFaturaSatirlari = (faturaSatirlari ?? []).filter(
    (s) => s.dahilEt && s.eslesenUrun && s.miktar > 0 && s.miktar <= s.eslesenUrun.miktar
  );

  async function faturaSatisiOnayla() {
    if (gecerliFaturaSatirlari.length === 0) return;
    setFaturaKaydediliyor(true);
    setFaturaHata(null);
    try {
      const yanit = await fetch("/api/stock/out/coklu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kalemler: gecerliFaturaSatirlari.map((s) => ({
            urunId: s.eslesenUrun!.id,
            miktar: s.miktar,
            okunanStokKodu: s.okunanStokKodu,
            okunanUrunAdi: s.okunanUrunAdi,
          })),
          kaynak: "ocr",
        }),
      });
      const veri = await yanit.json();
      if (!yanit.ok) {
        setFaturaHata(veri.hata || "Satış işlenemedi.");
        return;
      }
      const atlanan = (faturaSatirlari ?? []).length - gecerliFaturaSatirlari.length;
      setFaturaBasari(
        `${gecerliFaturaSatirlari.length} üründe toplam ${gecerliFaturaSatirlari.reduce((t, s) => t + s.miktar, 0)} adet stoktan düşüldü.` +
          (atlanan > 0 ? ` ${atlanan} satır eşleşmediği/dahil edilmediği için atlandı.` : "")
      );
      setFaturaSatirlari(null);
    } catch {
      setFaturaHata("Sunucuya ulaşılamadı.");
    } finally {
      setFaturaKaydediliyor(false);
    }
  }

  return (
    <div>
      <Baslik title="Satış" aciklama="Kamerayla ürünü tanıtın, fatura/fiş okutun ya da arayın — stoktan otomatik düşsün." />

      {basari && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-ok-soft px-4 py-3 text-sm text-ok">
          <CheckCircle2 size={18} /> {basari}
        </div>
      )}

      <div className="mb-4 inline-flex flex-wrap rounded-lg border border-border bg-surface p-1">
        <button
          onClick={() => setMod("arama")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
            mod === "arama" ? "bg-accent text-accent-foreground" : "text-muted"
          }`}
        >
          <Search size={15} /> Elle Ara
        </button>
        <button
          onClick={() => setMod("kamera")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
            mod === "kamera" ? "bg-accent text-accent-foreground" : "text-muted"
          }`}
        >
          <Camera size={15} /> Tek Ürün (Kamera)
        </button>
        <button
          onClick={() => setMod("fatura")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
            mod === "fatura" ? "bg-accent text-accent-foreground" : "text-muted"
          }`}
        >
          <Receipt size={15} /> Fatura/Fiş Oku (Toplu)
        </button>
      </div>

      {mod === "arama" && (
        <Kart>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Girdi
              className="pl-9"
              placeholder="Stok kodu veya ürün adı ile ara..."
              value={sorgu}
              onChange={(e) => setSorgu(e.target.value)}
              autoFocus
            />
          </div>

          <div className="mt-3 max-h-[420px] overflow-y-auto">
            {ariyorMu && <div className="flex justify-center py-6 text-muted"><Loader2 className="animate-spin" size={18} /></div>}

            {!ariyorMu && sorgu && gosterilecekSonuclar.length === 0 && <BosDurum mesaj="Ürün bulunamadı." />}

            <div className="flex flex-col divide-y divide-border">
              {gosterilecekSonuclar.map((u) => (
                <button
                  key={u.id}
                  onClick={() => urunSec(u, "elle")}
                  disabled={u.miktar <= 0}
                  className="flex items-center justify-between py-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div>
                    <div className="text-sm font-medium">{u.urunAdi}</div>
                    <div className="text-xs text-muted">
                      {u.stokKodu} · {u.marka} {u.satisFiyati != null && `· ${paraFormat(u.satisFiyati)}`}
                    </div>
                  </div>
                  {u.miktar <= 0 ? (
                    <Etiket ton="danger">
                      <PackageX size={12} className="mr-1 inline" /> Tükendi
                    </Etiket>
                  ) : (
                    <Etiket ton={u.miktar <= 3 ? "warn" : "ok"}>{u.miktar} {u.birim}</Etiket>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Kart>
      )}

      {mod === "kamera" && (
        <Kart>
          {!tanimaSonuc && !yukleniyorTanima && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="rounded-full bg-accent-soft p-4 text-accent">
                <Camera size={28} />
              </div>
              <div>
                <div className="font-medium">Satılacak ürünün fotoğrafını çekin</div>
                <div className="mt-1 text-sm text-muted">Parçanın üzerindeki kod/etiket veya kutusu net görünsün.</div>
              </div>
              <Buton onClick={() => dosyaInputRef.current?.click()}>
                <Camera size={16} /> Fotoğraf Çek
              </Buton>
              <input ref={dosyaInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={fotografSecildi} />
            </div>
          )}

          {yukleniyorTanima && (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-muted">
              <Loader2 className="animate-spin" size={26} />
              <div className="text-sm">Ürün tanınıyor...</div>
            </div>
          )}

          {tanimaHata && (
            <div className="flex items-start gap-2 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
              <AlertCircle size={18} className="mt-0.5 shrink-0" /> {tanimaHata}
            </div>
          )}

          {tanimaSonuc && !yukleniyorTanima && (
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                <ScanSearch size={16} className="text-accent" />
                Okunan: {tanimaSonuc.urunAdiTahmini || tanimaSonuc.stokKoduTahmini || "belirlenemedi"}
              </div>

              {tanimaEslesenler.length === 0 ? (
                <BosDurum mesaj="Stokta eşleşen ürün bulunamadı. 'Elle Ara' sekmesinden manuel arayabilirsiniz." />
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {tanimaEslesenler.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => urunSec(u, "kamera")}
                      disabled={u.miktar <= 0}
                      className={`flex items-center justify-between py-3 text-left disabled:cursor-not-allowed disabled:opacity-50 ${
                        seciliUrun?.id === u.id ? "rounded-lg bg-accent-soft px-2" : ""
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium">{u.urunAdi}</div>
                        <div className="text-xs text-muted">
                          {u.stokKodu} · {u.marka} {u.satisFiyati != null && `· ${paraFormat(u.satisFiyati)}`}
                        </div>
                      </div>
                      <Etiket ton={u.miktar <= 3 ? "warn" : "ok"}>{u.miktar} {u.birim}</Etiket>
                    </button>
                  ))}
                </div>
              )}

              <Buton
                varyant="ikincil"
                boyut="kucuk"
                className="mt-4"
                onClick={() => {
                  setTanimaSonuc(null);
                  setTanimaEslesenler([]);
                }}
              >
                <Camera size={14} /> Tekrar Çek
              </Buton>
            </div>
          )}
        </Kart>
      )}

      {mod === "fatura" && (
        <div className="flex flex-col gap-4">
          {faturaBasari && (
            <div className="flex items-center gap-2 rounded-lg bg-ok-soft px-4 py-3 text-sm text-ok">
              <CheckCircle2 size={18} /> {faturaBasari}
            </div>
          )}

          {!faturaSatirlari && !yukleniyorFatura && (
            <Kart className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="rounded-full bg-accent-soft p-4 text-accent">
                <Receipt size={28} />
              </div>
              <div>
                <div className="font-medium">Satış faturasının/fişinin fotoğrafını çekin</div>
                <div className="mt-1 text-sm text-muted">
                  Sistem tüm satırları okur, stoktaki ürünlerle birebir eşleştirir; onayladığınızda hepsi
                  tek seferde stoktan düşer.
                </div>
              </div>
              <Buton onClick={() => faturaDosyaInputRef.current?.click()}>
                <Camera size={16} /> Fotoğraf Çek
              </Buton>
              <input
                ref={faturaDosyaInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={faturaFotografiSecildi}
              />
            </Kart>
          )}

          {yukleniyorFatura && (
            <Kart className="flex flex-col items-center gap-3 py-10 text-center text-muted">
              <Loader2 className="animate-spin" size={26} />
              <div className="text-sm">Fatura okunuyor ve stokla eşleştiriliyor...</div>
            </Kart>
          )}

          {faturaHata && (
            <div className="flex items-start gap-2 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
              <AlertCircle size={18} className="mt-0.5 shrink-0" /> {faturaHata}
            </div>
          )}

          {faturaSatirlari && !yukleniyorFatura && (
            <>
              <Kart>
                <div className="mb-1 text-sm text-muted">
                  Faturadan <strong className="text-foreground">{faturaSatirlari.length}</strong> ürün okudum. Stokla
                  eşleşenleri işaretledim — kontrol edip onaylarsanız depodan/stoktan düşülecektir.
                </div>
              </Kart>

              <Kart className="overflow-x-auto p-0">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted">
                      <th className="px-3 py-2.5 font-medium"></th>
                      <th className="px-3 py-2.5 font-medium">Okunan Ürün</th>
                      <th className="px-3 py-2.5 font-medium">Eşleşme</th>
                      <th className="px-3 py-2.5 font-medium">Mevcut Stok</th>
                      <th className="px-3 py-2.5 font-medium">Satılacak</th>
                      <th className="px-3 py-2.5 font-medium">Kalan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {faturaSatirlari.map((s, i) => {
                      const yetersiz = Boolean(s.eslesenUrun) && s.miktar > (s.eslesenUrun?.miktar ?? 0);
                      const kalan = s.eslesenUrun ? s.eslesenUrun.miktar - s.miktar : null;
                      return (
                        <tr key={i} className={!s.eslesenUrun ? "opacity-60" : ""}>
                          <td className="px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={s.dahilEt}
                              disabled={!s.eslesenUrun}
                              onChange={(e) => faturaSatiriGuncelle(i, "dahilEt", e.target.checked)}
                              className="h-4 w-4 appearance-auto accent-accent"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-medium">{s.eslesenUrun?.urunAdi ?? s.okunanUrunAdi}</div>
                            <div className="font-mono text-xs text-muted">{s.eslesenUrun?.stokKodu ?? s.okunanStokKodu}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            {s.eslesenUrun ? (
                              <Etiket ton="ok">
                                <CheckCircle size={11} className="mr-1 inline" />
                                {s.eslesmeTuru === "kod+isim"
                                  ? "Kod + isim tam"
                                  : s.eslesmeTuru === "kod"
                                    ? "Kod tam"
                                    : "İsim tam"}
                              </Etiket>
                            ) : (
                              <Etiket ton="danger">
                                <XCircle size={11} className="mr-1 inline" /> Eşleşmedi
                              </Etiket>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-muted">
                            <div>{s.eslesenUrun ? `${s.eslesenUrun.miktar} ${s.eslesenUrun.birim}` : "-"}</div>
                            {s.eslesmeNotu && <div className="mt-1 max-w-[220px] text-xs">{s.eslesmeNotu}</div>}
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="number"
                              min={1}
                              disabled={!s.eslesenUrun}
                              value={s.miktar}
                              onChange={(e) => faturaSatiriGuncelle(i, "miktar", Number(e.target.value))}
                              className="w-20 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent disabled:opacity-50"
                            />
                            {yetersiz && <div className="mt-1 text-xs text-danger">Yetersiz stok</div>}
                          </td>
                          <td className={`px-3 py-2.5 ${kalan != null && kalan < 0 ? "text-danger" : "text-muted"}`}>
                            {kalan != null ? kalan : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Kart>

              <div className="flex flex-wrap items-center gap-3">
                <Buton onClick={faturaSatisiOnayla} disabled={faturaKaydediliyor || gecerliFaturaSatirlari.length === 0}>
                  {faturaKaydediliyor ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Onayla, Stoktan Düş ({gecerliFaturaSatirlari.length} ürün)
                </Buton>
                <Buton varyant="ikincil" onClick={faturaSifirla} disabled={faturaKaydediliyor}>
                  <RotateCcw size={16} /> Yeniden Çek
                </Buton>
              </div>
            </>
          )}
        </div>
      )}

      {seciliUrun && (
        <Kart className="mt-4">
          <div className="mb-4">
            <div className="font-semibold">{seciliUrun.urunAdi}</div>
            <div className="text-xs text-muted">
              {seciliUrun.stokKodu} · Mevcut stok: {seciliUrun.miktar} {seciliUrun.birim}
            </div>
          </div>

          {hata && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              <AlertCircle size={16} /> {hata}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setMiktar((m) => Math.max(1, m - 1))}
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-2 hover:bg-border"
            >
              <Minus size={18} />
            </button>
            <input
              type="number"
              value={miktar}
              min={1}
              max={seciliUrun.miktar}
              onChange={(e) => setMiktar(Number(e.target.value))}
              className="h-11 w-20 rounded-lg border border-border bg-surface text-center text-lg font-semibold outline-none focus:border-accent"
            />
            <button
              onClick={() => setMiktar((m) => Math.min(seciliUrun.miktar, m + 1))}
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-2 hover:bg-border"
            >
              <Plus size={18} />
            </button>
            <span className="text-sm text-muted">{seciliUrun.birim}</span>

            <div className="ml-auto flex gap-2">
              <Buton varyant="ikincil" onClick={() => setSeciliUrun(null)}>
                Vazgeç
              </Buton>
              <Buton onClick={satisiOnayla} disabled={kaydediliyor}>
                {kaydediliyor ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Satışı Onayla
              </Buton>
            </div>
          </div>
        </Kart>
      )}
    </div>
  );
}
