import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tedarikciler = await prisma.tedarikci.findMany({
    include: {
      _count: { select: { urunler: true } },
      faturalar: { select: { toplamTutar: true, tarih: true }, orderBy: { tarih: "desc" } },
    },
    orderBy: { ad: "asc" },
  });

  const sonuc = tedarikciler.map((t) => ({
    id: t.id,
    ad: t.ad,
    telefon: t.telefon,
    email: t.email,
    adres: t.adres,
    notlar: t.notlar,
    createdAt: t.createdAt,
    urunSayisi: t._count.urunler,
    toplamAlisTutari: t.faturalar.reduce((s, f) => s + f.toplamTutar, 0),
    faturaSayisi: t.faturalar.length,
    sonSiparisTarihi: t.faturalar[0]?.tarih ?? null,
  }));

  return NextResponse.json(sonuc);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.ad) return NextResponse.json({ hata: "Tedarikçi adı zorunlu." }, { status: 400 });

  const tedarikci = await prisma.tedarikci.create({
    data: {
      ad: String(body.ad).trim(),
      telefon: body.telefon || null,
      email: body.email || null,
      adres: body.adres || null,
      notlar: body.notlar || null,
    },
  });
  return NextResponse.json(tedarikci, { status: 201 });
}
