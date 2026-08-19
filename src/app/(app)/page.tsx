"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  ScanLine,
  Wallet,
  Truck,
  CalendarRange,
  Trophy,
  PackageX,
  RotateCcw,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Baslik, Kart, IstatKart, Etiket, Yukleniyor, BosDurum, Buton, paraFormat } from "@/components/ui";

type UrunOzet = { id: string; stokKodu: string; urunAdi: string; miktar: number; minStokSeviyesi: number; birim: string };
type Hareket = {
  id: string;
  tip: "ALIS" | "SATIS" | "DUZELTME_ARTIS" | "DUZELTME_AZALIS";
  miktar: number;
  birimFiyat: number | null;
  kaynak: string;
  kullaniciAdiSnap: string | null;
  createdAt: string;
  urun: UrunOzet | null;
  urunAdiSnap: string | null;
  stokKoduSnap: string | null;
};
type GunlukTrend = { tarih: string; satisTutari: number; alisTutari: number; satisAdedi: number };
type EnCokSatan = { urunAdi: string; stokKodu: string; adet: number };
type DashboardVerisi = {
  toplamUrunCesidi: number;
  toplamStokAdedi: number;
  stokDegeri: number;
  dusukStokSayisi: number;
  dusukStokUrunler: UrunOzet[];
  tukenenSayisi: number;
  tedarikciSayisi: number;
  bugunSatisAdedi: number;
  bugunSatisTutari: number;
  bugunAlisAdedi: number;
  bugunAlisTutari: number;
  haftalikSatisTutari: number;
  haftalikAlisTutari: number;
  aylikSatisTutari: number;
  aylikAlisTutari: number;
  gunlukTrend: GunlukTrend[];
  enCokSatanlar: EnCokSatan[];
  sonHareketler: Hareket[];
  markaDagilimi: { marka: string; adet: number }[];
};

const HAREKET_ETIKET: Record<Hareket["tip"], { yazi: string; ton: "ok" | "danger" | "accent" }> = {
  ALIS: { yazi: "Alış", ton: "ok" },
  SATIS: { yazi: "Satış", ton: "danger" },
  DUZELTME_ARTIS: { yazi: "Düzeltme (+)", ton: "accent" },
  DUZELTME_AZALIS: { yazi: "Düzeltme (-)", ton: "accent" },
};

const PASTA_RENKLERI = ["var(--accent)", "#5b8def", "#34d399", "#fbbf24", "#a78bfa", "#f472b6"];

export default function Dashboard() {
  const [veri, setVeri] = useState<DashboardVerisi | null>(null);
  const [sifirlaAcik, setSifirlaAcik] = useState(false);
  const [sifirlaniyor, setSifirlaniyor] = useState(false);
  const [sifirlaHata, setSifirlaHata] = useState<string | null>(null);

  const veriYenile = () => {
    fetch("/api/dashboard").then((r) => r.json()).then(setVeri);
  };

  useEffect(() => {
    veriYenile();
  }, []);

  async function istatistikleriSifirla() {
    setSifirlaniyor(true);
    setSifirlaHata(null);
    try {
      const yanit = await fetch("/api/dashboard/reset", { method: "POST" });
      if (!yanit.ok) {
        setSifirlaHata("Sıfırlanamadı. Lütfen tekrar deneyin.");
        return;
      }
      setSifirlaAcik(false);
      veriYenile();
    } catch {
      setSifirlaHata("Sunucuya ulaşılamadı.");
    } finally {
      setSifirlaniyor(false);
    }
  }

  if (!veri) return <Yukleniyor />;

  const trendVeri = veri.gunlukTrend.map((g) => ({
    ...g,
    gun: new Date(g.tarih).toLocaleDateString("tr-TR", { weekday: "short" }),
  }));

  const enBuyukEnCokSatan = Math.max(1, ...veri.enCokSatanlar.map((e) => e.adet));

  return (
    <div>
      <Baslik
        title="Ana Sayfa"
        aciklama="Depo durumuna genel bakış"
        sag={
          <Link href="/alis">
            <Buton>
              <ScanLine size={16} /> Fatura Ekle
            </Buton>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <IstatKart baslik="Ürün Çeşidi" deger={String(veri.toplamUrunCesidi)} icon={<Package size={18} />} />
        <IstatKart baslik="Toplam Stok Adedi" deger={String(veri.toplamStokAdedi)} icon={<Package size={18} />} />
        <IstatKart baslik="Stok Değeri" deger={paraFormat(veri.stokDegeri)} icon={<Wallet size={18} />} />
        <IstatKart
          baslik="Düşük Stok"
          deger={String(veri.dusukStokSayisi)}
          altBilgi={veri.dusukStokSayisi > 0 ? "İncelenmeli" : "Her şey yolunda"}
          icon={<AlertTriangle size={18} />}
        />
        <IstatKart
          baslik="Bugünkü Satış"
          deger={String(veri.bugunSatisAdedi)}
          altBilgi={paraFormat(veri.bugunSatisTutari)}
          icon={<ShoppingCart size={18} />}
        />
        <IstatKart
          baslik="Bugünkü Alış"
          deger={String(veri.bugunAlisAdedi)}
          altBilgi={paraFormat(veri.bugunAlisTutari)}
          icon={<ScanLine size={18} />}
        />
        <IstatKart
          baslik="Haftalık Satış"
          deger={paraFormat(veri.haftalikSatisTutari)}
          altBilgi="Son 7 gün"
          icon={<CalendarRange size={18} />}
        />
        <IstatKart
          baslik="Aylık Satış"
          deger={paraFormat(veri.aylikSatisTutari)}
          altBilgi="Son 30 gün"
          icon={<CalendarRange size={18} />}
        />
        <IstatKart
          baslik="Haftalık Net"
          deger={paraFormat(veri.haftalikSatisTutari - veri.haftalikAlisTutari)}
          altBilgi="Satış − Alış (7 gün)"
          icon={<Wallet size={18} />}
        />
        <IstatKart
          baslik="Aylık Net"
          deger={paraFormat(veri.aylikSatisTutari - veri.aylikAlisTutari)}
          altBilgi="Satış − Alış (30 gün)"
          icon={<Wallet size={18} />}
        />
        <IstatKart baslik="Tedarikçi" deger={String(veri.tedarikciSayisi)} icon={<Truck size={18} />} />
        <IstatKart
          baslik="Tükenen Ürün"
          deger={String(veri.tukenenSayisi)}
          altBilgi={veri.tukenenSayisi > 0 ? "Stok sıfır" : "Tükenen yok"}
          icon={<PackageX size={18} />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Kart className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" />
            <h2 className="font-semibold">Son 7 Gün Satış / Alış Trendi</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendVeri} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="satisGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="alisGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5b8def" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#5b8def" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="gun" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(deger) => paraFormat(Number(deger))}
                />
                <Area type="monotone" dataKey="satisTutari" name="Satış" stroke="var(--accent)" fill="url(#satisGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="alisTutari" name="Alış" stroke="#5b8def" fill="url(#alisGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Kart>

        <Kart>
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" />
            <h2 className="font-semibold">Marka Dağılımı</h2>
          </div>
          {veri.markaDagilimi.length === 0 ? (
            <BosDurum mesaj="Henüz ürün yok." />
          ) : (
            <>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={veri.markaDagilimi}
                      dataKey="adet"
                      nameKey="marka"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {veri.markaDagilimi.map((_, i) => (
                        <Cell key={i} fill={PASTA_RENKLERI[i % PASTA_RENKLERI.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                {[...veri.markaDagilimi]
                  .sort((a, b) => b.adet - a.adet)
                  .map((m, i) => (
                    <div key={m.marka} className="flex items-center gap-2 text-xs">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: PASTA_RENKLERI[i % PASTA_RENKLERI.length] }}
                      />
                      <span className="flex-1 truncate">{m.marka}</span>
                      <span className="text-muted">{m.adet} adet</span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </Kart>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Kart className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Düşük Stoktaki Ürünler</h2>
            <Link href="/stok?dusukStok=1" className="text-xs font-medium text-accent">
              Tümünü Gör
            </Link>
          </div>
          {veri.dusukStokUrunler.length === 0 ? (
            <BosDurum mesaj="Düşük stokta ürün yok." />
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {veri.dusukStokUrunler.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-sm font-medium">{u.urunAdi}</div>
                    <div className="text-xs text-muted">{u.stokKodu}</div>
                  </div>
                  <Etiket ton="warn">
                    {u.miktar} / {u.minStokSeviyesi} {u.birim}
                  </Etiket>
                </div>
              ))}
            </div>
          )}
        </Kart>

        <Kart>
          <div className="mb-3 flex items-center gap-2">
            <Trophy size={16} className="text-accent" />
            <h2 className="font-semibold">En Çok Satanlar (30 gün)</h2>
          </div>
          {veri.enCokSatanlar.length === 0 ? (
            <BosDurum mesaj="Henüz satış yok." />
          ) : (
            <div className="flex flex-col gap-3">
              {veri.enCokSatanlar.map((e) => (
                <div key={e.stokKodu}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="truncate font-medium">{e.urunAdi}</span>
                    <span className="text-muted">{e.adet} adet</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.max(4, (e.adet / enBuyukEnCokSatan) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Kart>
      </div>

      <Kart className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Son Hareketler</h2>
          <Link href="/hareketler" className="text-xs font-medium text-accent">
            Tümünü Gör
          </Link>
        </div>
        {veri.sonHareketler.length === 0 ? (
          <BosDurum mesaj="Henüz hareket kaydı yok." />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {veri.sonHareketler.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="text-sm font-medium">
                    {h.urun?.urunAdi ?? h.urunAdiSnap ?? "Silinmiş ürün"}
                  </div>
                  <div className="text-xs text-muted">
                    {h.urun?.stokKodu ?? h.stokKoduSnap ?? "-"} · {new Date(h.createdAt).toLocaleString("tr-TR")}
                    {h.kullaniciAdiSnap && <> · {h.kullaniciAdiSnap}</>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Etiket ton={HAREKET_ETIKET[h.tip].ton}>{HAREKET_ETIKET[h.tip].yazi}</Etiket>
                  <span className="text-sm font-medium">{h.miktar} {h.urun?.birim ?? "adet"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Kart>

      <div className="mt-6 flex justify-end">
        <Buton
          varyant="ikincil"
          boyut="kucuk"
          onClick={() => {
            setSifirlaHata(null);
            setSifirlaAcik(true);
          }}
          className="text-danger"
        >
          <RotateCcw size={14} /> İstatistikleri Sıfırla
        </Buton>
      </div>

      {sifirlaAcik && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !sifirlaniyor && setSifirlaAcik(false)} />
          <div
            className="relative w-full max-w-sm rounded-t-2xl bg-surface p-5 md:rounded-2xl"
            style={{ paddingBottom: "calc(1.25rem + var(--safe-bottom))" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">İstatistikleri Sıfırla</h2>
              <button onClick={() => !sifirlaniyor && setSifirlaAcik(false)} className="text-muted">
                <X size={20} />
              </button>
            </div>

            <p className="mb-4 text-sm text-muted">
              Emin misiniz? Tüm alış/satış/düzeltme hareketleri ve faturalar kalıcı olarak silinecek; ana
              sayfadaki ciro/istatistikler sıfırdan hesaplanmaya başlayacak. Ürünler, tedarikçiler ve mevcut
              stok miktarları etkilenmeyecek. Bu işlem geri alınamaz.
            </p>

            {sifirlaHata && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                <AlertCircle size={16} /> {sifirlaHata}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Buton varyant="ikincil" onClick={() => setSifirlaAcik(false)} disabled={sifirlaniyor}>
                Vazgeç
              </Buton>
              <Buton varyant="tehlike" onClick={istatistikleriSifirla} disabled={sifirlaniyor}>
                {sifirlaniyor && <Loader2 size={16} className="animate-spin" />}
                Evet, Sıfırla
              </Buton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
