import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mevcutKullaniciyiGetir } from "@/lib/mevcutKullanici";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const urunId = String(body.urunId || "");
  const yon: "artis" | "azalis" = body.yon === "azalis" ? "azalis" : "artis";
  const miktar = Math.max(1, Math.round(Number(body.miktar) || 0));
  const not_: string | null = body.not ? String(body.not).trim() || null : null;

  if (!urunId) {
    return NextResponse.json({ hata: "Ürün seçilmedi." }, { status: 400 });
  }

  const urun = await prisma.urun.findUnique({ where: { id: urunId } });
  if (!urun) return NextResponse.json({ hata: "Ürün bulunamadı." }, { status: 404 });

  if (yon === "azalis" && urun.miktar < miktar) {
    return NextResponse.json(
      { hata: `Yetersiz stok. Mevcut: ${urun.miktar} ${urun.birim}` },
      { status: 400 }
    );
  }

  const kullanici = await mevcutKullaniciyiGetir(req);

  const guncelUrun = await prisma.urun.update({
    where: { id: urunId },
    data: { miktar: yon === "artis" ? { increment: miktar } : { decrement: miktar } },
  });

  await prisma.stokHareketi.create({
    data: {
      urunId,
      tip: yon === "artis" ? "DUZELTME_ARTIS" : "DUZELTME_AZALIS",
      miktar,
      kaynak: "elle",
      aciklama: not_,
      kullaniciId: kullanici?.id ?? null,
      kullaniciAdiSnap: kullanici?.kullaniciAdi ?? null,
    },
  });

  return NextResponse.json({ basarili: true, urun: guncelUrun });
}
