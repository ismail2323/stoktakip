import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { istektenKullaniciIdAl } from "@/lib/oturum";

export async function GET(req: NextRequest) {
  const kullaniciId = await istektenKullaniciIdAl(req);
  if (!kullaniciId) return NextResponse.json({ hata: "Oturum yok." }, { status: 401 });

  const kullanici = await prisma.kullanici.findUnique({
    where: { id: kullaniciId },
    select: { id: true, kullaniciAdi: true, ad: true },
  });
  if (!kullanici) return NextResponse.json({ hata: "Kullanıcı bulunamadı." }, { status: 404 });

  return NextResponse.json(kullanici);
}
