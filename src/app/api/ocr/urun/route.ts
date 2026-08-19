import { NextRequest, NextResponse } from "next/server";
import { urunGorseliniTani, groqAnahtarlariniGetir, kullaniciDostuHataMesaji } from "@/lib/groq";
import { ayarlariGetir } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json({ hata: "Görsel bulunamadı." }, { status: 400 });
    }

    if (groqAnahtarlariniGetir().length === 0) {
      return NextResponse.json(
        { hata: "Groq API anahtarı tanımlı değil. .env dosyasına GROQ_API_KEYS ekleyin." },
        { status: 500 }
      );
    }

    const ayarlar = await ayarlariGetir();
    const tanima = await urunGorseliniTani(image, ayarlar.groqModel);

    let eslesenler: Awaited<ReturnType<typeof prisma.urun.findMany>> = [];

    if (tanima.stokKoduTahmini) {
      eslesenler = await prisma.urun.findMany({ where: { stokKodu: { contains: tanima.stokKoduTahmini } } });
    }
    if (eslesenler.length === 0 && tanima.urunAdiTahmini) {
      eslesenler = await prisma.urun.findMany({ where: { urunAdi: { contains: tanima.urunAdiTahmini } } });
    }

    return NextResponse.json({ tanima, eslesenler });
  } catch (err) {
    return NextResponse.json({ hata: kullaniciDostuHataMesaji(err) }, { status: 500 });
  }
}
