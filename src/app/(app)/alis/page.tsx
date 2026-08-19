"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Trash2, Plus, CheckCircle2, RotateCcw, AlertCircle, Receipt, ScanSearch } from "lucide-react";
import { Baslik, Kart, Buton, Girdi, Secim, BosDurum, paraFormat } from "@/components/ui";
import { MARKALAR, modelleriGetir } from "@/lib/araclar";
import { resmiOku } from "@/lib/resim";

type Kalem = {
  stokKodu: string;
  urunAdi: string;
  marka: string;
  model: string | null;
  miktar: number;
  birimFiyat: number | null;
  satirToplami: number | null;
  kdvOrani?: number | null;
};

const BOS_KALEM = (): Kalem => ({
  stokKodu: "",
  urunAdi: "",
  marka: "Diğer",
  model: null,
  miktar: 1,
  birimFiyat: null,
  satirToplami: null,
  kdvOrani: null,
});

function bugununTarihi() {
  return new Date().toISOString().slice(0, 10);
}

export default function AlisPage() {
  const dosyaInputRef = useRef<HTMLInputElement>(null);
  const cokluDosyaInputRef = useRef<HTMLInputElement>(null);
  const kameraDosyaInputRef = useRef<HTMLInputElement>(null);
  const [resim, setResim] = useState<string | null>(null);
  const [yukleniyorOcr, setYukleniyorOcr] = useState(false);
  const [yukleniyorMesaj, setYukleniyorMesaj] = useState("");
  const [yukleniyorTanima, setYukleniyorTanima] = useState(false);
  const [kameraEslesmedi, setKameraEslesmedi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [tedarikciAdi, setTedarikciAdi] = useState("");
  const [tedarikciOnerileri, setTedarikciOnerileri] = useState<string[]>([]);
  const [faturaNo, setFaturaNo] = useState("");
  const [faturaTarihi, setFaturaTarihi] = useState(bugununTarihi());
  const [kalemler, setKalemler] = useState<Kalem[] | null>(null);
  const [kaynak, setKaynak] = useState<"ocr" | "elle" | "kamera">("elle");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [basari, setBasari] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((veri: { ad: string }[]) => setTedarikciOnerileri(veri.map((t) => t.ad)))
      .catch(() => {});
  }, []);

  async function dosyaSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const dosyalar = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (dosyalar.length === 0) return;

    setBasari(null);
    setHata(null);
    setKalemler(null);
    setYukleniyorOcr(true);

    let birlesikTedarikci = "";
    let birlesikFaturaNo = "";
    let birlesikFaturaTarihi = bugununTarihi();
    let tumKalemler: Kalem[] = [];
    let ilkResim: string | null = null;
    const hatalar: string[] = [];

    try {
      for (let i = 0; i < dosyalar.length; i++) {
        setYukleniyorMesaj(dosyalar.length > 1 ? `Fatura okunuyor (${i + 1}/${dosyalar.length})...` : "Fatura okunuyor...");
        const dataUrl = await resmiOku(dosyalar[i]);
        if (!dataUrl) {
          hatalar.push(`${i + 1}. fotoğraf okunamadı.`);
          continue;
        }
        if (!ilkResim) ilkResim = dataUrl;

        try {
          const yanit = await fetch("/api/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: dataUrl }),
          });
          const veri = await yanit.json();
          if (!yanit.ok) {
            hatalar.push(`${i + 1}. fotoğraf: ${veri.hata || "okunamadı."}`);
            continue;
          }
          if (!birlesikTedarikci && veri.tedarikciAdi) birlesikTedarikci = veri.tedarikciAdi;
          if (!birlesikFaturaNo && veri.faturaNo) birlesikFaturaNo = veri.faturaNo;
          if (veri.faturaTarihi && !isNaN(Date.parse(veri.faturaTarihi))) birlesikFaturaTarihi = veri.faturaTarihi;
          tumKalemler = tumKalemler.concat(veri.kalemler ?? []);
        } catch {
          hatalar.push(`${i + 1}. fotoğraf: sunucuya ulaşılamadı.`);
        }
      }

      if (ilkResim) setResim(ilkResim);

      if (tumKalemler.length === 0) {
        setHata(hatalar.length ? hatalar.join(" ") : "Fatura okunamadı.");
        setKaynak("elle");
        setKalemler([BOS_KALEM()]);
        return;
      }

      setTedarikciAdi(birlesikTedarikci);
      setFaturaNo(birlesikFaturaNo);
      setFaturaTarihi(birlesikFaturaTarihi);
      setKalemler(tumKalemler);
      setKaynak("ocr");
      if (hatalar.length > 0) setHata(hatalar.join(" "));
    } catch {
      setHata("Fatura okunamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.");
      setKaynak("elle");
      setKalemler([BOS_KALEM()]);
    } finally {
      setYukleniyorOcr(false);
      setYukleniyorMesaj("");
    }
  }

  function elleBaslat() {
    setResim(null);
    setHata(null);
    setBasari(null);
    setKameraEslesmedi(false);
    setTedarikciAdi("");
    setFaturaNo("");
    setFaturaTarihi(bugununTarihi());
    setKaynak("elle");
    setKalemler([BOS_KALEM()]);
  }

  async function urunFotografiSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    e.target.value = "";
    if (!dosya) return;

    setBasari(null);
    setHata(null);
    setKalemler(null);
    setKameraEslesmedi(false);
    setYukleniyorTanima(true);

    try {
      const dataUrl = await resmiOku(dosya, 1200);
      if (!dataUrl) {
        setHata("Fotoğraf okunamadı. Lütfen tekrar çekmeyi deneyin.");
        return;
      }
      setResim(dataUrl);

      const yanit = await fetch("/api/ocr/urun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const veri = await yanit.json();
      if (!yanit.ok) {
        setHata(veri.hata || "Ürün tanınamadı.");
        return;
      }

      type Eslesen = { stokKodu: string; urunAdi: string; marka: string; model: string | null; alisFiyati: number | null };
      const eslesenler: Eslesen[] = veri.eslesenler ?? [];

      if (eslesenler.length > 0) {
        setKalemler(
          eslesenler.map((u) => ({
            stokKodu: u.stokKodu,
            urunAdi: u.urunAdi,
            marka: u.marka,
            model: u.model,
            miktar: 1,
            birimFiyat: u.alisFiyati ?? null,
            satirToplami: null,
          }))
        );
      } else {
        setKameraEslesmedi(true);
        setKalemler([
          {
            ...BOS_KALEM(),
            stokKodu: veri.tanima?.stokKoduTahmini || "",
            urunAdi: veri.tanima?.urunAdiTahmini || "",
          },
        ]);
      }
      setKaynak("kamera");
    } catch {
      setHata("Ürün tanınamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setYukleniyorTanima(false);
    }
  }

  function satirGuncelle(i: number, alan: keyof Kalem, deger: string | number | null) {
    if (!kalemler) return;
    const kopya = [...kalemler];
    kopya[i] = { ...kopya[i], [alan]: deger };
    setKalemler(kopya);
  }

  function miktarGuncelle(i: number, miktar: number) {
    if (!kalemler) return;
    const kopya = [...kalemler];
    const satirToplami = kopya[i].satirToplami;
    kopya[i] = {
      ...kopya[i],
      miktar,
      birimFiyat:
        satirToplami != null && miktar > 0 ? Math.round((satirToplami / miktar) * 100) / 100 : kopya[i].birimFiyat,
    };
    setKalemler(kopya);
  }

  function satirToplamiGuncelle(i: number, satirToplami: number | null) {
    if (!kalemler) return;
    const kopya = [...kalemler];
    const miktar = kopya[i].miktar || 1;
    kopya[i] = {
      ...kopya[i],
      satirToplami,
      birimFiyat: satirToplami != null && miktar > 0 ? Math.round((satirToplami / miktar) * 100) / 100 : null,
    };
    setKalemler(kopya);
  }

  function satirSil(i: number) {
    if (!kalemler) return;
    setKalemler(kalemler.filter((_, idx) => idx !== i));
  }

  function satirEkle() {
    setKalemler([...(kalemler ?? []), BOS_KALEM()]);
  }

  const toplamTutar = (kalemler ?? []).reduce(
    (t, k) => t + (k.satirToplami ?? (k.miktar || 0) * (k.birimFiyat ?? 0)),
    0
  );
  const toplamAdet = (kalemler ?? []).reduce((t, k) => t + (k.miktar || 0), 0);

  async function stogaEkle() {
    if (!kalemler || kalemler.length === 0) return;
    const gecerliKalemler = kalemler.filter((k) => k.stokKodu.trim() && k.urunAdi.trim());
    if (gecerliKalemler.length === 0) {
      setHata("Stoğa eklemek için en az bir üründe stok kodu ve ürün adı girilmeli.");
      return;
    }

    setKaydediliyor(true);
    setHata(null);
    try {
      const yanit = await fetch("/api/stock/in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kalemler: gecerliKalemler.map((k) => ({
            ...k,
            birimFiyat:
              k.satirToplami != null && k.miktar > 0
                ? Math.round((k.satirToplami / k.miktar) * 100) / 100
                : k.birimFiyat,
          })),
          tedarikciAdi: tedarikciAdi || null,
          faturaNo: faturaNo || null,
          faturaTarihi,
          kaynak,
        }),
      });
      const veri = await yanit.json();
      if (!yanit.ok) {
        setHata(veri.hata || "Stoğa eklenirken hata oluştu.");
        return;
      }
      setBasari(`${gecerliKalemler.length} ürün stoğa eklendi (toplam ${paraFormat(toplamTutar)}).`);
      formuTemizle();
    } catch {
      setHata("Sunucuya ulaşılamadı.");
    } finally {
      setKaydediliyor(false);
    }
  }

  function formuTemizle() {
    setResim(null);
    setKalemler(null);
    setTedarikciAdi("");
    setFaturaNo("");
    setFaturaTarihi(bugununTarihi());
  }

  return (
    <div>
      <Baslik title="Fatura / Alış Girişi" aciklama="Faturayı toplu okutun, tek ürünü kamerayla tanıtın ya da elle girin." />

      {basari && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-ok-soft px-4 py-3 text-sm text-ok">
          <CheckCircle2 size={18} /> {basari}
        </div>
      )}

      {!kalemler && (
        <Kart className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="rounded-full bg-accent-soft p-4 text-accent">
            {yukleniyorOcr || yukleniyorTanima ? <Loader2 size={28} className="animate-spin" /> : <Camera size={28} />}
          </div>
          <div>
            <div className="font-medium">
              {yukleniyorOcr ? (yukleniyorMesaj || "Fatura okunuyor...") : yukleniyorTanima ? "Ürün tanınıyor..." : "Fatura fotoğrafını çekin ya da tek ürün girin"}
            </div>
            <div className="mt-1 text-sm text-muted">
              {yukleniyorOcr
                ? "Bu birkaç saniye sürebilir."
                : yukleniyorTanima
                  ? "Bu birkaç saniye sürebilir."
                  : "Kağıt faturayı net çerçeveye alın, galeriden birden çok sayfa seçin ya da tek bir ürünü kamerayla tanıtın."}
            </div>
          </div>
          {!yukleniyorOcr && !yukleniyorTanima && (
            <div className="flex flex-wrap justify-center gap-3">
              <Buton onClick={() => dosyaInputRef.current?.click()}>
                <Camera size={16} /> Fatura Fotoğrafı Çek
              </Buton>
              <Buton varyant="ikincil" onClick={() => cokluDosyaInputRef.current?.click()}>
                <Receipt size={16} /> Galeriden Çoklu Yükle
              </Buton>
              <Buton varyant="ikincil" onClick={() => kameraDosyaInputRef.current?.click()}>
                <ScanSearch size={16} /> Tek Ürün (Kamera)
              </Buton>
              <Buton varyant="ikincil" onClick={elleBaslat}>
                <Receipt size={16} /> Elle Fatura Gir
              </Buton>
            </div>
          )}
          <input
            ref={dosyaInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={dosyaSecildi}
          />
          <input
            ref={cokluDosyaInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={dosyaSecildi}
          />
          <input
            ref={kameraDosyaInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={urunFotografiSecildi}
          />
        </Kart>
      )}

      {hata && !kalemler && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertCircle size={18} className="mt-0.5 shrink-0" /> {hata}
        </div>
      )}

      {kalemler && (
        <div className="flex flex-col gap-4">
          {resim && (
            <Kart className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resim} alt={kaynak === "kamera" ? "Ürün" : "Fatura"} className="h-20 w-20 rounded-lg object-cover" />
              <div className="text-sm text-muted">
                {kaynak === "ocr" &&
                  `Faturadan ${kalemler.length} ürün çıkardım. Listeyi kontrol edin; onaylarsanız depoya/stoğa eklenecek.`}
                {kaynak === "kamera" &&
                  (kameraEslesmedi
                    ? "Stokta eşleşen ürün bulunamadı; yapay zekanın tahminiyle yeni bir ürün satırı oluşturdum, kontrol edip düzenleyin."
                    : `Stokta ${kalemler.length} eşleşen ürün buldum. Miktar/fiyatı kontrol edip onaylayın.`)}
                {kaynak === "elle" && "Fatura okunamadı, bilgileri elle girin."}
              </div>
            </Kart>
          )}

          {hata && (
            <div className="flex items-start gap-2 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
              <AlertCircle size={18} className="mt-0.5 shrink-0" /> {hata}
            </div>
          )}

          <Kart>
            <h2 className="mb-3 font-semibold">Fatura Bilgileri</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Tedarikçi</label>
                <Girdi
                  list="tedarikci-onerileri"
                  value={tedarikciAdi}
                  onChange={(e) => setTedarikciAdi(e.target.value)}
                  placeholder="Tedarikçi / depo adı"
                />
                <datalist id="tedarikci-onerileri">
                  {tedarikciOnerileri.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Fatura No</label>
                <Girdi value={faturaNo} onChange={(e) => setFaturaNo(e.target.value)} placeholder="Opsiyonel" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Fatura Tarihi</label>
                <Girdi type="date" value={faturaTarihi} onChange={(e) => setFaturaTarihi(e.target.value)} />
              </div>
            </div>
          </Kart>

          <Kart className="overflow-x-auto">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Ürün Kalemleri ({kalemler.length})</h2>
              <Buton varyant="ikincil" boyut="kucuk" onClick={satirEkle}>
                <Plus size={14} /> Satır Ekle
              </Buton>
            </div>

            <div className="flex flex-col gap-3">
              {kalemler.map((k, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 md:grid-cols-12 md:items-center md:gap-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] text-muted md:hidden">Stok Kodu</label>
                    <Girdi value={k.stokKodu} onChange={(e) => satirGuncelle(i, "stokKodu", e.target.value)} placeholder="Stok kodu" />
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <label className="mb-1 block text-[11px] text-muted md:hidden">Ürün Adı</label>
                    <Girdi value={k.urunAdi} onChange={(e) => satirGuncelle(i, "urunAdi", e.target.value)} placeholder="Ürün adı" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] text-muted md:hidden">Marka</label>
                    <Secim
                      value={k.marka}
                      onChange={(e) => satirGuncelle(i, "marka", e.target.value)}
                    >
                      {MARKALAR.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </Secim>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] text-muted md:hidden">Model</label>
                    <Girdi
                      list={`model-onerileri-${i}`}
                      value={k.model ?? ""}
                      onChange={(e) => satirGuncelle(i, "model", e.target.value)}
                      placeholder="Örn: Corolla"
                    />
                    <datalist id={`model-onerileri-${i}`}>
                      {modelleriGetir(k.marka).map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </div>
                  <div className="md:col-span-1">
                    <label className="mb-1 block text-[11px] text-muted md:hidden">Miktar</label>
                    <Girdi
                      type="number"
                      min={1}
                      value={k.miktar}
                      onChange={(e) => miktarGuncelle(i, Number(e.target.value))}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="mb-1 block text-[11px] text-muted md:hidden">Satır Tutarı</label>
                    <Girdi
                      type="number"
                      min={0}
                      step="0.01"
                      value={k.satirToplami ?? ""}
                      onChange={(e) => {
                        const satirToplami = e.target.value === "" ? null : Number(e.target.value);
                        satirToplamiGuncelle(i, satirToplami);
                      }}
                      placeholder="₺"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 md:col-span-1 md:justify-end">
                    <span className="text-xs text-muted">
                      Birim: {paraFormat(k.birimFiyat)}
                      {k.kdvOrani != null && ` · KDV %${k.kdvOrani}`}
                    </span>
                    <button onClick={() => satirSil(i)} className="rounded-lg p-2 text-danger hover:bg-danger-soft" aria-label="Satırı sil">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {kalemler.length === 0 && <BosDurum mesaj="Satır yok. Yukarıdan ekleyebilirsiniz." />}
            </div>

            {kalemler.length > 0 && (
              <div className="mt-4 flex items-center justify-end gap-6 border-t border-border pt-3 text-sm">
                <span className="text-muted">Toplam {toplamAdet} adet</span>
                <span className="font-semibold">Toplam Tutar: {paraFormat(toplamTutar)}</span>
              </div>
            )}
          </Kart>

          <div className="flex flex-wrap gap-3">
            <Buton onClick={stogaEkle} disabled={kaydediliyor}>
              {kaydediliyor ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Onayla ve Stoğa Ekle
            </Buton>
            <Buton varyant="ikincil" onClick={elleBaslat} disabled={kaydediliyor}>
              <RotateCcw size={16} /> Yeniden Başla
            </Buton>
          </div>
        </div>
      )}
    </div>
  );
}
