import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sifreDogruMu } from "@/lib/sifre";
import { oturumTokeniOlustur, OTURUM_COOKIE, OTURUM_MAX_AGE_SANIYE } from "@/lib/oturum";

export async function POST(req: NextRequest) {
  const { kullaniciAdi, sifre, beniHatirla } = await req.json();
  const temizKullaniciAdi = String(kullaniciAdi || "").trim();

  const kullanici = await prisma.kullanici.findUnique({ where: { kullaniciAdi: temizKullaniciAdi } });
  if (!kullanici || !sifreDogruMu(String(sifre || ""), kullanici.sifreHash)) {
    return NextResponse.json({ hata: "Kullanıcı adı veya şifre hatalı." }, { status: 401 });
  }

  const token = await oturumTokeniOlustur(kullanici.id);
  const yanit = NextResponse.json({ basarili: true, kullaniciAdi: kullanici.kullaniciAdi });
  yanit.cookies.set(OTURUM_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    ...(beniHatirla ? { maxAge: OTURUM_MAX_AGE_SANIYE } : {}),
    path: "/",
  });
  return yanit;
}
