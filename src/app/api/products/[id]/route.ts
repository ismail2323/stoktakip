import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mevcutKullaniciyiGetir } from "@/lib/mevcutKullanici";
import { tedarikciIdCoz } from "@/lib/tedarikci";

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
  for (const alan of ["stokKodu", "urunAdi", "marka", "model", "kategori", "birim", "notlar"]) {
    if (body[alan] !== undefined) veri[alan] = body[alan] || null;
  }
  const tedarikciId = await tedarikciIdCoz(body);
  if (tedarikciId !== undefined) veri.tedarikciId = tedarikciId;
  if (body.miktar !== undefined) {
    veri.miktar = Math.max(0, Math.round(Number(body.miktar) || 0));
  }
  if (body.minStokSeviyesi !== undefined) {
    veri.minStokSeviyesi = Math.max(0, Math.round(Number(body.minStokSeviyesi) || 0));
  }
  for (const alan of ["alisFiyati", "satisFiyati"]) {
    if (body[alan] !== undefined) {
      veri[alan] = body[alan] === null ? null : Math.max(0, Number(body[alan]));
    }
  }

  try {
    const mevcutUrun = veri.miktar !== undefined ? await prisma.urun.findUnique({ where: { id } }) : null;

    const urun = await prisma.urun.update({ where: { id }, data: veri });

    // Miktar bu panelden degistiyse, denetim izinin (audit trail) kopmamasi
    // icin otomatik bir duzeltme hareketi olustur.
    if (mevcutUrun && typeof veri.miktar === "number" && veri.miktar !== mevcutUrun.miktar) {
      const fark = veri.miktar - mevcutUrun.miktar;
      const kullanici = await mevcutKullaniciyiGetir(req);
      await prisma.stokHareketi.create({
        data: {
          urunId: id,
          urunAdiSnap: urun.urunAdi,
          stokKoduSnap: urun.stokKodu,
          tip: fark > 0 ? "DUZELTME_ARTIS" : "DUZELTME_AZALIS",
          miktar: Math.abs(fark),
          kaynak: "elle",
          aciklama: "Ürün düzenleme panelinden miktar değişikliği",
          kullaniciId: kullanici?.id ?? null,
          kullaniciAdiSnap: kullanici?.kullaniciAdi ?? null,
        },
      });
    }

    return NextResponse.json(urun);
  } catch {
    return NextResponse.json({ hata: "Güncelleme başarısız." }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const urun = await prisma.urun.findUnique({ where: { id } });
    if (!urun) return NextResponse.json({ hata: "Ürün bulunamadı." }, { status: 404 });

    // Bu urune ait, henuz aninda goruntusu (snapshot) olmayan eski
    // hareketleri silmeden once yedekle - iliski SET NULL oldugu icin urun
    // silinse bile gecmis hareketler (satis/alis loglari, ciro hesaplari)
    // kaybolmaz, sadece urun baglantisi kesilir.
    await prisma.stokHareketi.updateMany({
      where: { urunId: id, urunAdiSnap: null },
      data: { urunAdiSnap: urun.urunAdi, stokKoduSnap: urun.stokKodu },
    });

    await prisma.urun.delete({ where: { id } });
    return NextResponse.json({ basarili: true });
  } catch {
    return NextResponse.json({ hata: "Silme başarısız." }, { status: 400 });
  }
}
