import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function gunBasi(tarih: Date) {
  const t = new Date(tarih);
  t.setHours(0, 0, 0, 0);
  return t;
}

function gunAnahtari(tarih: Date) {
  return tarih.toISOString().slice(0, 10);
}

export async function GET() {
  const bugunBaslangic = gunBasi(new Date());
  const yediGunOnce = new Date(bugunBaslangic);
  yediGunOnce.setDate(yediGunOnce.getDate() - 6);
  const otuzGunOnce = new Date(bugunBaslangic);
  otuzGunOnce.setDate(otuzGunOnce.getDate() - 29);

  const [urunler, sonYediGunHareketleri, sonOtuzGunHareketleri, sonHareketler, tedarikciSayisi] = await Promise.all([
    prisma.urun.findMany(),
    prisma.stokHareketi.findMany({ where: { createdAt: { gte: yediGunOnce } } }),
    prisma.stokHareketi.findMany({
      where: { createdAt: { gte: otuzGunOnce } },
      include: { urun: true },
    }),
    prisma.stokHareketi.findMany({
      include: { urun: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.tedarikci.count(),
  ]);

  const sonOtuzGunSatislar = sonOtuzGunHareketleri.filter((h) => h.tip === "SATIS");
  const sonOtuzGunAlislar = sonOtuzGunHareketleri.filter((h) => h.tip === "ALIS");

  const dusukStok = urunler.filter((u) => u.miktar <= u.minStokSeviyesi);

  const bugunHareketleri = sonYediGunHareketleri.filter((h) => h.createdAt >= bugunBaslangic);
  const bugunSatis = bugunHareketleri.filter((h) => h.tip === "SATIS");
  const bugunAlis = bugunHareketleri.filter((h) => h.tip === "ALIS");

  const haftalikSatis = sonYediGunHareketleri.filter((h) => h.tip === "SATIS");
  const haftalikAlis = sonYediGunHareketleri.filter((h) => h.tip === "ALIS");

  const stokDegeri = urunler.reduce((t, u) => t + u.miktar * (u.alisFiyati ?? 0), 0);

  // Son 7 gunun gunluk satis/alis trendi (grafik icin)
  const gunlukMap = new Map<string, { satisTutari: number; alisTutari: number; satisAdedi: number }>();
  for (let i = 0; i < 7; i++) {
    const g = new Date(bugunBaslangic);
    g.setDate(g.getDate() - (6 - i));
    gunlukMap.set(gunAnahtari(g), { satisTutari: 0, alisTutari: 0, satisAdedi: 0 });
  }
  for (const h of sonYediGunHareketleri) {
    const anahtar = gunAnahtari(gunBasi(h.createdAt));
    const kayit = gunlukMap.get(anahtar);
    if (!kayit) continue;
    const tutar = h.miktar * (h.birimFiyat ?? 0);
    if (h.tip === "SATIS") {
      kayit.satisTutari += tutar;
      kayit.satisAdedi += h.miktar;
    } else if (h.tip === "ALIS") {
      kayit.alisTutari += tutar;
    }
  }
  const gunlukTrend = Array.from(gunlukMap.entries()).map(([tarih, deger]) => ({ tarih, ...deger }));

  // Son 30 gunde en cok satan urunler
  const satisMap = new Map<string, { urunAdi: string; stokKodu: string; adet: number }>();
  for (const h of sonOtuzGunSatislar) {
    const kayit = satisMap.get(h.urunId) ?? { urunAdi: h.urun.urunAdi, stokKodu: h.urun.stokKodu, adet: 0 };
    kayit.adet += h.miktar;
    satisMap.set(h.urunId, kayit);
  }
  const enCokSatanlar = Array.from(satisMap.values())
    .sort((a, b) => b.adet - a.adet)
    .slice(0, 5);

  const markaDagilimi = new Map<string, number>();
  for (const u of urunler) {
    markaDagilimi.set(u.marka, (markaDagilimi.get(u.marka) ?? 0) + u.miktar);
  }

  return NextResponse.json({
    toplamUrunCesidi: urunler.length,
    toplamStokAdedi: urunler.reduce((t, u) => t + u.miktar, 0),
    stokDegeri,
    dusukStokSayisi: dusukStok.length,
    dusukStokUrunler: dusukStok.slice(0, 8),
    tedarikciSayisi,
    bugunSatisAdedi: bugunSatis.reduce((t, h) => t + h.miktar, 0),
    bugunSatisTutari: bugunSatis.reduce((t, h) => t + h.miktar * (h.birimFiyat ?? 0), 0),
    bugunAlisAdedi: bugunAlis.reduce((t, h) => t + h.miktar, 0),
    bugunAlisTutari: bugunAlis.reduce((t, h) => t + h.miktar * (h.birimFiyat ?? 0), 0),
    haftalikSatisTutari: haftalikSatis.reduce((t, h) => t + h.miktar * (h.birimFiyat ?? 0), 0),
    haftalikAlisTutari: haftalikAlis.reduce((t, h) => t + h.miktar * (h.birimFiyat ?? 0), 0),
    aylikSatisTutari: sonOtuzGunSatislar.reduce((t, h) => t + h.miktar * (h.birimFiyat ?? 0), 0),
    aylikAlisTutari: sonOtuzGunAlislar.reduce((t, h) => t + h.miktar * (h.birimFiyat ?? 0), 0),
    gunlukTrend,
    enCokSatanlar,
    sonHareketler,
    markaDagilimi: Array.from(markaDagilimi.entries()).map(([marka, adet]) => ({ marka, adet })),
  });
}
