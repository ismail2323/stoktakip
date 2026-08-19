import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const marka = searchParams.get("marka")?.trim();
  const model = searchParams.get("model")?.trim();
  const dusukStok = searchParams.get("dusukStok") === "1";
  const limit = Number(searchParams.get("limit")) || undefined;

  const urunler = await prisma.urun.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { stokKodu: { contains: q } },
                { urunAdi: { contains: q } },
                { model: { contains: q } },
              ],
            }
          : {},
        marka && marka !== "Tümü" ? { marka } : {},
        model && model !== "Tümü" ? { model } : {},
      ],
    },
    include: { tedarikci: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  const sonuc = dusukStok ? urunler.filter((u) => u.miktar <= u.minStokSeviyesi) : urunler;

  return NextResponse.json(sonuc);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.stokKodu || !body.urunAdi) {
    return NextResponse.json({ hata: "Stok kodu ve ürün adı zorunlu." }, { status: 400 });
  }

  try {
    const urun = await prisma.urun.create({
      data: {
        stokKodu: String(body.stokKodu).trim(),
        urunAdi: String(body.urunAdi).trim(),
        marka: body.marka || "Diğer",
        model: body.model || null,
        kategori: body.kategori || null,
        miktar: Math.max(0, Number(body.miktar) || 0),
        minStokSeviyesi: Math.max(0, Number(body.minStokSeviyesi) || 1),
        birim: body.birim || "adet",
        alisFiyati: body.alisFiyati != null ? Math.max(0, Number(body.alisFiyati)) : null,
        satisFiyati: body.satisFiyati != null ? Math.max(0, Number(body.satisFiyati)) : null,
        notlar: body.notlar || null,
        tedarikciId: body.tedarikciId || null,
      },
    });
    return NextResponse.json(urun, { status: 201 });
  } catch {
    return NextResponse.json({ hata: "Bu stok kodu zaten kayıtlı." }, { status: 409 });
  }
}
