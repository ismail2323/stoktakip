"use client";

import { useEffect, useState } from "react";
import { ScanLine, PenLine, Camera, UserRound, TrendingUp, TrendingDown, ListChecks } from "lucide-react";
import { Baslik, Kart, Secim, Girdi, Etiket, BosDurum, Yukleniyor, IstatKart, paraFormat } from "@/components/ui";

type Hareket = {
  id: string;
  tip: "ALIS" | "SATIS" | "DUZELTME_ARTIS" | "DUZELTME_AZALIS";
  miktar: number;
  birimFiyat: number | null;
  kaynak: string;
  kullaniciAdiSnap: string | null;
  createdAt: string;
  urun: { stokKodu: string; urunAdi: string; birim: string };
  fatura: { faturaNo: string | null; tedarikci: { ad: string } | null } | null;
};

type Ozet = { satisTutari: number; alisTutari: number; satisAdedi: number; alisAdedi: number; kayitSayisi: number };

const TIPLER = ["Tümü", "ALIS", "SATIS", "DUZELTME_ARTIS", "DUZELTME_AZALIS"];
const TIP_ETIKET: Record<string, { yazi: string; ton: "ok" | "danger" | "accent" }> = {
  ALIS: { yazi: "Alış", ton: "ok" },
  SATIS: { yazi: "Satış", ton: "danger" },
  DUZELTME_ARTIS: { yazi: "Düzeltme (+)", ton: "accent" },
  DUZELTME_AZALIS: { yazi: "Düzeltme (-)", ton: "accent" },
};
const KAYNAK_IKON: Record<string, React.ElementType> = { ocr: ScanLine, kamera: Camera, elle: PenLine };
const KAYNAK_ETIKET: Record<string, string> = { ocr: "Fatura okuma (AI)", kamera: "Kamera (AI)", elle: "Elle giriş" };

function gunEtiketi(tarih: string) {
  const bugun = new Date();
  const d = new Date(tarih);
  const farkGun = Math.floor((new Date(bugun.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  if (farkGun === 0) return "Bugün";
  if (farkGun === 1) return "Dün";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default function HareketlerPage() {
  const [tip, setTip] = useState("Tümü");
  const [q, setQ] = useState("");
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [hareketler, setHareketler] = useState<Hareket[] | null>(null);
  const [ozet, setOzet] = useState<Ozet | null>(null);

  useEffect(() => {
    const zamanlayici = setTimeout(() => {
      const params = new URLSearchParams();
      if (tip !== "Tümü") params.set("tip", tip);
      if (q.trim()) params.set("q", q.trim());
      if (baslangic) params.set("baslangic", baslangic);
      if (bitis) params.set("bitis", bitis);
      fetch(`/api/movements?${params.toString()}`)
        .then((r) => r.json())
        .then((veri) => {
          setHareketler(veri.hareketler);
          setOzet(veri.ozet);
        });
    }, 250);
    return () => clearTimeout(zamanlayici);
  }, [tip, q, baslangic, bitis]);

  const gruplar = new Map<string, Hareket[]>();
  for (const h of hareketler ?? []) {
    const anahtar = new Date(h.createdAt).toDateString();
    if (!gruplar.has(anahtar)) gruplar.set(anahtar, []);
    gruplar.get(anahtar)!.push(h);
  }

  return (
    <div>
      <Baslik title="Hareketler" aciklama="Tüm stok giriş ve çıkışlarının detaylı geçmişi ve logları." />

      {ozet && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <IstatKart baslik="Kayıt Sayısı" deger={String(ozet.kayitSayisi)} icon={<ListChecks size={18} />} />
          <IstatKart baslik="Satış Adedi" deger={String(ozet.satisAdedi)} altBilgi={paraFormat(ozet.satisTutari)} icon={<TrendingDown size={18} />} />
          <IstatKart baslik="Alış Adedi" deger={String(ozet.alisAdedi)} altBilgi={paraFormat(ozet.alisTutari)} icon={<TrendingUp size={18} />} />
          <IstatKart baslik="Net Tutar" deger={paraFormat(ozet.satisTutari - ozet.alisTutari)} icon={<TrendingUp size={18} />} />
        </div>
      )}

      <Kart className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Girdi
            className="min-w-[180px] flex-1"
            placeholder="Ürün adı veya stok kodu ara..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Secim className="w-auto" value={tip} onChange={(e) => setTip(e.target.value)}>
            {TIPLER.map((t) => (
              <option key={t} value={t}>{t === "Tümü" ? "Tüm Hareketler" : TIP_ETIKET[t].yazi}</option>
            ))}
          </Secim>
          <div className="flex items-center gap-2">
            <Girdi type="date" className="w-auto" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} />
            <span className="text-xs text-muted">—</span>
            <Girdi type="date" className="w-auto" value={bitis} onChange={(e) => setBitis(e.target.value)} />
          </div>
        </div>
      </Kart>

      {!hareketler ? (
        <Yukleniyor />
      ) : hareketler.length === 0 ? (
        <BosDurum mesaj="Hareket kaydı yok." />
      ) : (
        <div className="flex flex-col gap-5">
          {Array.from(gruplar.entries()).map(([gun, kayitlar]) => (
            <div key={gun}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {gunEtiketi(kayitlar[0].createdAt)}
              </div>
              <Kart className="p-0">
                <div className="flex flex-col divide-y divide-border">
                  {kayitlar.map((h) => {
                    const KaynakIkon = KAYNAK_IKON[h.kaynak] ?? PenLine;
                    return (
                      <div key={h.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{h.urun.urunAdi}</div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted">
                            <span className="font-mono">{h.urun.stokKodu}</span>
                            <span>·</span>
                            <span>{new Date(h.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                            {h.kullaniciAdiSnap && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1"><UserRound size={11} /> {h.kullaniciAdiSnap}</span>
                              </>
                            )}
                            {h.fatura?.tedarikci && (
                              <>
                                <span>·</span>
                                <span>{h.fatura.tedarikci.ad}</span>
                              </>
                            )}
                            <span>·</span>
                            <span className="inline-flex items-center gap-1" title={KAYNAK_ETIKET[h.kaynak]}>
                              <KaynakIkon size={11} />
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          {h.birimFiyat != null && (
                            <span className="hidden text-sm text-muted sm:inline">
                              {paraFormat(h.birimFiyat * h.miktar)}
                            </span>
                          )}
                          <span className="text-sm font-semibold">
                            {h.tip === "SATIS" || h.tip === "DUZELTME_AZALIS" ? "-" : "+"}
                            {h.miktar} {h.urun.birim}
                          </span>
                          <Etiket ton={TIP_ETIKET[h.tip].ton}>{TIP_ETIKET[h.tip].yazi}</Etiket>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Kart>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
