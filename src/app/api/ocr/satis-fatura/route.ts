import { NextRequest, NextResponse } from "next/server";
import { faturaGorseliniOku, groqAnahtarlariniGetir } from "@/lib/groq";
import { ayarlariGetir } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

function normalizeEt(deger: string) {
  return deger
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ")
    .replace(/[.,;:()[\]{}'"`]/g, "");
}

function haritayaEkle<T>(harita: Map<string, T[]>, anahtar: string, deger: T) {
  if (!anahtar) return;
  const liste = harita.get(anahtar) ?? [];
  liste.push(deger);
  harita.set(anahtar, liste);
}

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
    const okuma = await faturaGorseliniOku(image, ayarlar.groqModel);

    if (okuma.kalemler.length === 0) {
      return NextResponse.json({ hata: "Görselde ürün satırı bulunamadı." }, { status: 400 });
    }

    // Tam eslestirme icin tum stogu tek seferde cek. Stok kodu ve urun adi
    // ayni urunu gosteriyorsa otomatik eslestir; supheli satirlari disarida birak.
    const tumUrunler = await prisma.urun.findMany();
    const koduHaritasi = new Map<string, typeof tumUrunler>();
    const adiHaritasi = new Map<string, typeof tumUrunler>();
    for (const urun of tumUrunler) {
      haritayaEkle(koduHaritasi, normalizeEt(urun.stokKodu), urun);
      haritayaEkle(adiHaritasi, normalizeEt(urun.urunAdi), urun);
    }

    const satirlar = okuma.kalemler.map((k) => {
      const koduAnahtar = normalizeEt(k.stokKodu);
      const adiAnahtar = normalizeEt(k.urunAdi);
      const kodVar = Boolean(koduAnahtar && koduAnahtar !== "bilinmiyor");
      const adVar = Boolean(adiAnahtar && adiAnahtar !== normalizeEt("İsimsiz Ürün"));
      const kodAdaylari = kodVar ? koduHaritasi.get(koduAnahtar) ?? [] : [];
      const isimAdaylari = adVar ? adiHaritasi.get(adiAnahtar) ?? [] : [];

      let eslesen: (typeof tumUrunler)[number] | null = null;
      let eslesmeTuru: "kod+isim" | "kod" | "isim" | null = null;
      let eslesmeNotu = "";

      if (kodAdaylari.length === 1 && isimAdaylari.length === 1 && kodAdaylari[0].id === isimAdaylari[0].id) {
        eslesen = kodAdaylari[0];
        eslesmeTuru = "kod+isim";
        eslesmeNotu = "Stok kodu ve ürün adı birebir aynı ürünü gösteriyor.";
      } else if (kodAdaylari.length === 1 && !adVar) {
        eslesen = kodAdaylari[0];
        eslesmeTuru = "kod";
        eslesmeNotu = "Stok kodu birebir eşleşti; ürün adı stokta birebir bulunamadı.";
      } else if (!kodVar && isimAdaylari.length === 1) {
        eslesen = isimAdaylari[0];
        eslesmeTuru = "isim";
        eslesmeNotu = "Ürün adı birebir eşleşti; stok kodu boş veya stokta bulunamadı.";
      } else if (kodAdaylari.length > 0 || isimAdaylari.length > 0) {
        eslesmeNotu = "Stok kodu ve ürün adı aynı üründe netleşmediği için otomatik düşülmeyecek.";
      } else {
        eslesmeNotu = "Stokta birebir eşleşme bulunamadı.";
      }

      return {
        okunanStokKodu: k.stokKodu,
        okunanUrunAdi: k.urunAdi,
        miktar: k.miktar,
        eslesmeTuru,
        eslesmeNotu,
        eslesenUrun: eslesen
          ? {
              id: eslesen.id,
              stokKodu: eslesen.stokKodu,
              urunAdi: eslesen.urunAdi,
              miktar: eslesen.miktar,
              birim: eslesen.birim,
              satisFiyati: eslesen.satisFiyati,
            }
          : null,
      };
    });

    return NextResponse.json({ satirlar, faturaNo: okuma.faturaNo, faturaTarihi: okuma.faturaTarihi });
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : "Bilinmeyen hata";
    return NextResponse.json({ hata: mesaj }, { status: 500 });
  }
}
