import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tedarikci = await prisma.tedarikci.findUnique({
    where: { id },
    include: {
      urunler: { orderBy: { updatedAt: "desc" } },
      faturalar: { orderBy: { tarih: "desc" }, take: 20, include: { hareketler: { include: { urun: true } } } },
    },
  });
  if (!tedarikci) return NextResponse.json({ hata: "Tedarikçi bulunamadı." }, { status: 404 });
  return NextResponse.json(tedarikci);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const veri: Record<string, unknown> = {};
  for (const alan of ["ad", "telefon", "email", "adres", "notlar"]) {
    if (body[alan] !== undefined) veri[alan] = body[alan] || null;
  }

  try {
    const tedarikci = await prisma.tedarikci.update({ where: { id }, data: veri });
    return NextResponse.json(tedarikci);
  } catch {
    return NextResponse.json({ hata: "Güncelleme başarısız." }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.tedarikci.delete({ where: { id } });
    return NextResponse.json({ basarili: true });
  } catch {
    return NextResponse.json({ hata: "Silme başarısız. Bu tedarikçiye bağlı ürünler olabilir." }, { status: 400 });
  }
}
