import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const urun = await prisma.urun.findUnique({ where: { id }, include: { tedarikci: true } });
  if (!urun) return NextResponse.json({ hata: "Ürün bulunamadı." }, { status: 404 });
  return NextResponse.json(urun);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const veri: Record<string, unknown> = {};
  for (const alan of ["stokKodu", "urunAdi", "marka", "model", "kategori", "birim", "notlar", "tedarikciId"]) {
    if (body[alan] !== undefined) veri[alan] = body[alan] || null;
  }
  for (const alan of ["miktar", "minStokSeviyesi", "alisFiyati", "satisFiyati"]) {
    if (body[alan] !== undefined) veri[alan] = body[alan] === null ? null : Number(body[alan]);
  }

  try {
    const urun = await prisma.urun.update({ where: { id }, data: veri });
    return NextResponse.json(urun);
  } catch {
    return NextResponse.json({ hata: "Güncelleme başarısız." }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.urun.delete({ where: { id } });
    return NextResponse.json({ basarili: true });
  } catch {
    return NextResponse.json({ hata: "Silme başarısız." }, { status: 400 });
  }
}
