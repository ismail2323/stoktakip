import { NextRequest, NextResponse } from "next/server";
import { ayarlariGetir, ayarGuncelle } from "@/lib/settings";
import { groqAnahtarlariniGetir } from "@/lib/groq";

export async function GET() {
  const ayarlar = await ayarlariGetir();
  return NextResponse.json({
    ...ayarlar,
    groqAnahtarSayisi: groqAnahtarlariniGetir().length,
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  for (const [anahtar, deger] of Object.entries(body)) {
    if (typeof deger === "string") await ayarGuncelle(anahtar, deger);
  }
  const guncel = await ayarlariGetir();
  return NextResponse.json(guncel);
}
