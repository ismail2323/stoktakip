import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sifreyiHashle } from "@/lib/sifre";
import { oturumTokeniOlustur, OTURUM_COOKIE, OTURUM_MAX_AGE_SANIYE } from "@/lib/oturum";

export async function POST(req: NextRequest) {
  const mevcutSayi = await prisma.kullanici.count();
  if (mevcutSayi > 0) {
    return NextResponse.json({ hata: "Kurulum zaten tamamlanmış." }, { status: 409 });
  }

  const { kullaniciAdi, sifre, ad, beniHatirla } = await req.json();
  const temizKullaniciAdi = String(kullaniciAdi || "").trim();
  const temizSifre = String(sifre || "");

  if (temizKullaniciAdi.length < 3) {
    return NextResponse.json({ hata: "Kullanıcı adı en az 3 karakter olmalı." }, { status: 400 });
  }
  if (temizSifre.length < 6) {
    return NextResponse.json({ hata: "Şifre en az 6 karakter olmalı." }, { status: 400 });
  }

  const kullanici = await prisma.kullanici.create({
    data: {
      kullaniciAdi: temizKullaniciAdi,
      sifreHash: sifreyiHashle(temizSifre),
      ad: ad || null,
    },
  });

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
