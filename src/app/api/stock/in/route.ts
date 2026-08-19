import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mevcutKullaniciyiGetir } from "@/lib/mevcutKullanici";

type GelenKalem = {
  stokKodu: string;
  urunAdi: string;
  marka: string;
  model?: string | null;
  miktar: number;
  birimFiyat: number | null;
  satirToplami?: number | null;
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const kalemler: GelenKalem[] = Array.isArray(body.kalemler) ? body.kalemler : [];
  const tedarikciAdi: string | null = body.tedarikciAdi || null;
  const faturaNo: string | null = body.faturaNo || null;
  const faturaTarihi: string | null = body.faturaTarihi || null;
  const kaynak: string = body.kaynak === "ocr" ? "ocr" : body.kaynak === "kamera" ? "kamera" : "elle";

  if (kalemler.length === 0) {
    return NextResponse.json({ hata: "En az bir ürün kalemi gerekli." }, { status: 400 });
  }

  const kullanici = await mevcutKullaniciyiGetir(req);

  let tedarikciId: string | null = null;
  if (tedarikciAdi) {
    const mevcut = await prisma.tedarikci.findFirst({ where: { ad: tedarikciAdi } });
    tedarikciId = mevcut
      ? mevcut.id
      : (await prisma.tedarikci.create({ data: { ad: tedarikciAdi } })).id;
  }

  const gecerliTarih = faturaTarihi && !isNaN(Date.parse(faturaTarihi)) ? new Date(faturaTarihi) : new Date();

  const sonuclar = [];
  let toplamTutar = 0;
  const hareketIdleri: string[] = [];

  for (const kalem of kalemler) {
    const stokKodu = String(kalem.stokKodu || "").trim();
    const urunAdi = String(kalem.urunAdi || "").trim();
    if (!stokKodu || !urunAdi) continue;
    const miktar = Math.max(1, Math.round(Number(kalem.miktar) || 1));
    const satirToplami = kalem.satirToplami != null ? Number(kalem.satirToplami) : null;
    const birimFiyat =
      satirToplami != null && Number.isFinite(satirToplami)
        ? Math.round((satirToplami / miktar) * 100) / 100
        : kalem.birimFiyat != null
          ? Number(kalem.birimFiyat)
          : null;
    const model = kalem.model ? String(kalem.model).trim() || null : null;

    const mevcutUrun = await prisma.urun.findUnique({ where: { stokKodu } });

    const urun = mevcutUrun
      ? await prisma.urun.update({
          where: { id: mevcutUrun.id },
          data: {
            miktar: { increment: miktar },
            ...(birimFiyat != null ? { alisFiyati: birimFiyat } : {}),
            ...(tedarikciId ? { tedarikciId } : {}),
            ...(model ? { model } : {}),
          },
        })
      : await prisma.urun.create({
          data: {
            stokKodu,
            urunAdi,
            marka: kalem.marka || "Diğer",
            model,
            miktar,
            alisFiyati: birimFiyat,
            tedarikciId,
          },
        });

    const hareket = await prisma.stokHareketi.create({
      data: {
        urunId: urun.id,
        tip: "ALIS",
        miktar,
        birimFiyat,
        kaynak,
        kullaniciId: kullanici?.id ?? null,
        kullaniciAdiSnap: kullanici?.kullaniciAdi ?? null,
      },
    });

    hareketIdleri.push(hareket.id);
    toplamTutar += satirToplami != null && Number.isFinite(satirToplami) ? satirToplami : miktar * (birimFiyat ?? 0);
    sonuclar.push(urun);
  }

  if (hareketIdleri.length > 0) {
    const fatura = await prisma.fatura.create({
      data: {
        faturaNo,
        tarih: gecerliTarih,
        tedarikciId,
        toplamTutar,
        kaynak,
        kullaniciId: kullanici?.id ?? null,
      },
    });
    await prisma.stokHareketi.updateMany({
      where: { id: { in: hareketIdleri } },
      data: { faturaId: fatura.id },
    });
  }

  return NextResponse.json({ basarili: true, urunler: sonuclar });
}
