import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tip = searchParams.get("tip");
  const q = searchParams.get("q")?.trim();
  const baslangic = searchParams.get("baslangic");
  const bitis = searchParams.get("bitis");
  const limit = Number(searchParams.get("limit")) || 300;

  const kosullar: Prisma.StokHareketiWhereInput[] = [];

  if (tip && tip !== "Tümü") {
    kosullar.push({ tip: tip as "ALIS" | "SATIS" | "DUZELTME_ARTIS" | "DUZELTME_AZALIS" });
  }
  if (q) {
    kosullar.push({
      OR: [
        { urun: { OR: [{ urunAdi: { contains: q } }, { stokKodu: { contains: q } }] } },
        { urunAdiSnap: { contains: q } },
        { stokKoduSnap: { contains: q } },
      ],
    });
  }
  if (baslangic) {
    kosullar.push({ createdAt: { gte: new Date(baslangic) } });
  }
  if (bitis) {
    const bitisTarihi = new Date(bitis);
    bitisTarihi.setHours(23, 59, 59, 999);
    kosullar.push({ createdAt: { lte: bitisTarihi } });
  }

  const hareketler = await prisma.stokHareketi.findMany({
    where: kosullar.length > 0 ? { AND: kosullar } : {},
    include: { urun: true, fatura: { include: { tedarikci: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const ozet = {
    satisTutari: hareketler.filter((h) => h.tip === "SATIS").reduce((t, h) => t + h.miktar * (h.birimFiyat ?? 0), 0),
    alisTutari: hareketler.filter((h) => h.tip === "ALIS").reduce((t, h) => t + h.miktar * (h.birimFiyat ?? 0), 0),
    satisAdedi: hareketler.filter((h) => h.tip === "SATIS").reduce((t, h) => t + h.miktar, 0),
    alisAdedi: hareketler.filter((h) => h.tip === "ALIS").reduce((t, h) => t + h.miktar, 0),
    kayitSayisi: hareketler.length,
  };

  return NextResponse.json({ hareketler, ozet });
}
