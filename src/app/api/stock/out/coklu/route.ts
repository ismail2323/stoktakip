import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mevcutKullaniciyiGetir } from "@/lib/mevcutKullanici";

type GelenKalem = { urunId: string; miktar: number; okunanStokKodu?: string; okunanUrunAdi?: string };

function normalizeEt(deger: string) {
  return deger
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ")
    .replace(/[.,;:()[\]{}'"`]/g, "");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const gelenKalemler: GelenKalem[] = Array.isArray(body.kalemler) ? body.kalemler : [];
  const kaynak: string = body.kaynak === "ocr" ? "ocr" : "elle";

  if (gelenKalemler.length === 0) {
    return NextResponse.json({ hata: "En az bir ürün gerekli." }, { status: 400 });
  }

  const kullanici = await mevcutKullaniciyiGetir(req);

  const urunIdleri = [...new Set(gelenKalemler.map((k) => k.urunId))];
  const urunler = await prisma.urun.findMany({ where: { id: { in: urunIdleri } } });
  const urunMap = new Map(urunler.map((u) => [u.id, u]));

  // Karisik miktarlari ayni urun icin topla (ayni satir birden fazla kez
  // eslesmis olabilir), sonra tum stok yeterliligini TEK satirda dogrula.
  const toplamMiktar = new Map<string, number>();
  for (const k of gelenKalemler) {
    const miktar = Math.max(1, Math.round(Number(k.miktar) || 1));
    toplamMiktar.set(k.urunId, (toplamMiktar.get(k.urunId) ?? 0) + miktar);
  }

  const hatalar: string[] = [];
  for (const k of gelenKalemler) {
    const urun = urunMap.get(k.urunId);
    if (!urun) continue;
    const okunanKod = normalizeEt(String(k.okunanStokKodu || ""));
    const okunanAd = normalizeEt(String(k.okunanUrunAdi || ""));
    const stokKod = normalizeEt(urun.stokKodu);
    const stokAd = normalizeEt(urun.urunAdi);
    const kodVar = okunanKod && okunanKod !== "bilinmiyor";
    const adVar = Boolean(okunanAd);

    if (kaynak === "ocr" && kodVar && adVar && (okunanKod !== stokKod || okunanAd !== stokAd)) {
      hatalar.push(`${urun.urunAdi}: OCR satırı stok kodu ve ürün adıyla birebir doğrulanamadı.`);
    } else if (kaynak === "ocr" && kodVar && !adVar && okunanKod !== stokKod) {
      hatalar.push(`${urun.urunAdi}: OCR stok kodu birebir doğrulanamadı.`);
    } else if (kaynak === "ocr" && !kodVar && adVar && okunanAd !== stokAd) {
      hatalar.push(`${urun.urunAdi}: OCR ürün adı birebir doğrulanamadı.`);
    } else if (kaynak === "ocr" && !kodVar && !adVar) {
      hatalar.push(`${urun.urunAdi}: OCR doğrulaması için stok kodu veya ürün adı yok.`);
    }
  }

  for (const [urunId, miktar] of toplamMiktar) {
    const urun = urunMap.get(urunId);
    if (!urun) {
      hatalar.push("Bir ürün bulunamadı.");
      continue;
    }
    if (urun.miktar < miktar) {
      hatalar.push(`${urun.urunAdi}: yetersiz stok (istenen ${miktar}, mevcut ${urun.miktar} ${urun.birim}).`);
    }
  }
  if (hatalar.length > 0) {
    return NextResponse.json({ hata: hatalar.join(" ") }, { status: 400 });
  }

  const sonuc = await prisma.$transaction(async (tx) => {
    const guncellenenler = [];
    for (const [urunId, miktar] of toplamMiktar) {
      const urun = urunMap.get(urunId)!;
      const guncelUrun = await tx.urun.update({
        where: { id: urunId },
        data: { miktar: { decrement: miktar } },
      });
      await tx.stokHareketi.create({
        data: {
          urunId,
          tip: "SATIS",
          miktar,
          birimFiyat: urun.satisFiyati ?? null,
          kaynak,
          kullaniciId: kullanici?.id ?? null,
          kullaniciAdiSnap: kullanici?.kullaniciAdi ?? null,
        },
      });
      guncellenenler.push(guncelUrun);
    }
    return guncellenenler;
  });

  return NextResponse.json({ basarili: true, urunler: sonuc });
}
