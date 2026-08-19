import { prisma } from "@/lib/prisma";

export const VARSAYILAN_AYARLAR = {
  dukkanAdi: "Yedek Parça Deposu",
  groqModel: process.env.GROQ_VISION_MODEL || "qwen/qwen3.6-27b",
  varsayilanMinStok: "2",
  markalar: "Toyota,Mitsubishi,Hyundai,Mercedes,Diğer",
};

export type AyarAnahtari = keyof typeof VARSAYILAN_AYARLAR;

export async function ayarlariGetir(): Promise<Record<AyarAnahtari, string>> {
  const kayitlar = await prisma.ayar.findMany();
  const map = new Map(kayitlar.map((k) => [k.anahtar, k.deger]));
  const sonuc = {} as Record<AyarAnahtari, string>;
  for (const anahtar of Object.keys(VARSAYILAN_AYARLAR) as AyarAnahtari[]) {
    sonuc[anahtar] = map.get(anahtar) ?? VARSAYILAN_AYARLAR[anahtar];
  }
  return sonuc;
}

export async function ayarGuncelle(anahtar: string, deger: string) {
  return prisma.ayar.upsert({
    where: { anahtar },
    update: { deger },
    create: { anahtar, deger },
  });
}
