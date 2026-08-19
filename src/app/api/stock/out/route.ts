import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mevcutKullaniciyiGetir } from "@/lib/mevcutKullanici";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const urunId = String(body.urunId || "");
  const miktar = Math.max(1, Math.round(Number(body.miktar) || 1));
  const kaynak: string = body.kaynak === "kamera" ? "kamera" : "elle";

  if (!urunId) {
    return NextResponse.json({ hata: "Ürün seçilmedi." }, { status: 400 });
  }

  const urun = await prisma.urun.findUnique({ where: { id: urunId } });
  if (!urun) return NextResponse.json({ hata: "Ürün bulunamadı." }, { status: 404 });

  if (urun.miktar < miktar) {
    return NextResponse.json(
      { hata: `Yetersiz stok. Mevcut: ${urun.miktar} ${urun.birim}` },
      { status: 400 }
    );
  }

  const kullanici = await mevcutKullaniciyiGetir(req);

  const guncelUrun = await prisma.urun.update({
    where: { id: urunId },
    data: { miktar: { decrement: miktar } },
  });

  await prisma.stokHareketi.create({
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

  return NextResponse.json({ basarili: true, urun: guncelUrun });
}
