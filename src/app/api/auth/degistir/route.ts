import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sifreDogruMu, sifreyiHashle } from "@/lib/sifre";
import { istektenKullaniciIdAl } from "@/lib/oturum";

export async function PATCH(req: NextRequest) {
  const kullaniciId = await istektenKullaniciIdAl(req);
  if (!kullaniciId) return NextResponse.json({ hata: "Oturum yok." }, { status: 401 });

  const { mevcutSifre, yeniKullaniciAdi, yeniSifre, yeniAd } = await req.json();

  const kullanici = await prisma.kullanici.findUnique({ where: { id: kullaniciId } });
  if (!kullanici) return NextResponse.json({ hata: "Kullanıcı bulunamadı." }, { status: 404 });

  if (!sifreDogruMu(String(mevcutSifre || ""), kullanici.sifreHash)) {
    return NextResponse.json({ hata: "Mevcut şifre hatalı." }, { status: 401 });
  }

  const veri: Record<string, string> = {};

  if (yeniKullaniciAdi && String(yeniKullaniciAdi).trim() !== kullanici.kullaniciAdi) {
    const temiz = String(yeniKullaniciAdi).trim();
    if (temiz.length < 3) {
      return NextResponse.json({ hata: "Kullanıcı adı en az 3 karakter olmalı." }, { status: 400 });
    }
    const cakisan = await prisma.kullanici.findUnique({ where: { kullaniciAdi: temiz } });
    if (cakisan && cakisan.id !== kullaniciId) {
      return NextResponse.json({ hata: "Bu kullanıcı adı zaten kullanılıyor." }, { status: 409 });
    }
    veri.kullaniciAdi = temiz;
  }

  if (yeniSifre) {
    if (String(yeniSifre).length < 6) {
      return NextResponse.json({ hata: "Yeni şifre en az 6 karakter olmalı." }, { status: 400 });
    }
    veri.sifreHash = sifreyiHashle(String(yeniSifre));
  }

  if (yeniAd !== undefined) {
    veri.ad = String(yeniAd || "");
  }

  const guncel = await prisma.kullanici.update({ where: { id: kullaniciId }, data: veri });
  return NextResponse.json({ basarili: true, kullaniciAdi: guncel.kullaniciAdi, ad: guncel.ad });
}
