import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { istektenKullaniciIdAl } from "@/lib/oturum";

export async function mevcutKullaniciyiGetir(req: NextRequest) {
  const id = await istektenKullaniciIdAl(req);
  if (!id) return null;
  return prisma.kullanici.findUnique({ where: { id }, select: { id: true, kullaniciAdi: true } });
}
