import { NextRequest, NextResponse } from "next/server";
import { faturaGorseliniOku, groqAnahtarlariniGetir } from "@/lib/groq";
import { ayarlariGetir } from "@/lib/settings";

// Coklu satirli faturalarda Groq bazen anahtar/deneme degistirerek yeniden
// denenir; varsayilan fonksiyon suresi (bazi planlarda 10sn) buna yetmeyebilir.
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
    const sonuc = await faturaGorseliniOku(image, ayarlar.groqModel);
    return NextResponse.json(sonuc);
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : "Bilinmeyen hata";
    return NextResponse.json({ hata: mesaj }, { status: 500 });
  }
}
