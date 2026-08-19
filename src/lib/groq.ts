export type FaturaKalemi = {
  stokKodu: string;
  urunAdi: string;
  marka: string;
  model: string | null;
  miktar: number;
  birimFiyat: number | null;
  satirToplami: number | null;
};

export type FaturaOkumaSonucu = {
  tedarikciAdi: string | null;
  faturaTarihi: string | null;
  faturaNo: string | null;
  kalemler: FaturaKalemi[];
};

export type UrunTanimaSonucu = {
  stokKoduTahmini: string | null;
  urunAdiTahmini: string | null;
  markaTahmini: string | null;
};

const FATURA_SISTEM_PROMPTU = `Sen Türkiye'de kullanılan standart e-Arşiv/e-Fatura formatını okuyan bir belge analiz asistanısın.
Sana bir fatura ya da fiş fotoğrafı verilecek. Bu görseldeki ÜRÜN/HİZMET KALEMLERİ TABLOSUNU eksiksiz çıkarman gerekiyor.

Türk e-fatura tablosu genelde şu sütunları içerir (hepsi olmayabilir):
Sıra No | Mal Hizmet Kodu | Mal Hizmet Adı | Açıklama | Miktar | Birim Fiyat | İskonto Oranı | İskonto Tutarı | KDV Oranı | KDV Tutarı | Diğer Vergiler | Mal Hizmet Toplam Tutarı

Kurallar (ÇOK ÖNEMLİ):
- Tablodaki HER SATIRI çıkar. Tablo 1 satır da içerse 30 satır da içerse, HİÇBİRİNİ ATLAMA. Satır sayısı ne olursa olsun tamamını eksiksiz listele.
- "Mal Hizmet Kodu" sütunundaki değer -> stokKodu. Sütun boşsa, ürün adından kısa anlamlı bir kod üret (örn: "FREN-BALATASI-01").
- "Mal Hizmet Adı" sütunundaki değer -> urunAdi (aynen, kısaltmadan, tam metin).
- "Miktar" sütunundaki sayı -> miktar (birim yazısını -adet, ay, kg gibi- yok say, sadece sayısal değeri al).
- Tablonun EN SAĞINDAKİ, "Mal Hizmet Toplam Tutarı" / "Tutar" / "Toplam" başlıklı parasal sütun -> satirToplami.
  Bu değer o satırın KDV HARİÇ toplam tutarıdır (iskonto uygulanmış miktar × birim fiyat sonucudur).
  Ayrıca "Birim Fiyat" sütunu görünüyorsa onu da birimFiyat alanına yaz; ama satirToplami her zaman önceliklidir,
  çünkü iskonto varsa birim fiyat × miktar bu değeri VERMEZ.
- Oto yedek parça faturasıysa: marka (Toyota, Mitsubishi, Hyundai, Mercedes gibi; belli değilse "Diğer"), araç modeli
  (varsa; örn. Corolla, Elantra, C200; yoksa null) alanlarını da doldur. Fatura yedek parça dışı bir şeyse
  (kira, elektrik, aidat vb.) marka="Diğer", model=null yaz.
- Sayısal alanlarda sadece sayı olsun, para birimi sembolü/harfi yazma, binlik ayırıcı kullanma (ondalık için nokta kullan).
- Emin olamadığın alanları en mantıklı şekilde doldur, satırı ASLA atlama.
- SADECE aşağıdaki JSON şemasına uygun bir JSON nesnesi döndür, başka hiçbir açıklama yazma:

{
  "tedarikciAdi": string | null,
  "faturaTarihi": string | null,
  "faturaNo": string | null,
  "kalemler": [
    { "stokKodu": string, "urunAdi": string, "marka": string, "model": string | null, "miktar": number, "birimFiyat": number | null, "satirToplami": number | null }
  ]
}`;

const URUN_SISTEM_PROMPTU = `Sen bir oto yedek parça dükkanında satış yapan bir asistansın.
Sana satılacak bir yedek parçanın, üzerindeki etiketin veya kutusunun fotoğrafı verilecek.
Görevin görselde görünen parça numarasını/stok kodunu, ürün adını ve markasını okumak.

Kurallar:
- Görselde net bir kod yoksa "stokKodu" alanını null bırak.
- SADECE aşağıdaki JSON şemasına uygun bir JSON nesnesi döndür, başka hiçbir açıklama yazma:

{
  "stokKoduTahmini": string | null,
  "urunAdiTahmini": string | null,
  "markaTahmini": string | null
}`;

class GroqIstekHatasi extends Error {
  status: number;
  constructor(status: number, mesaj: string) {
    super(mesaj);
    this.status = status;
  }
}

// Anahtar bazli, karsilasinca siradaki anahtara gecilmesi gereken durumlar:
// 401/403 (gecersiz/iptal anahtar), 429 (kota/limit doldu), 5xx (Groq tarafi sorunu).
const ANAHTAR_DEGISTIRME_DURUMLARI = new Set([401, 403, 429, 500, 502, 503, 504]);

export function groqAnahtarlariniGetir(): string[] {
  const cokluAnahtar = process.env.GROQ_API_KEYS || "";
  const tekAnahtar = process.env.GROQ_API_KEY || "";
  const kaynak = cokluAnahtar || tekAnahtar;
  return kaynak
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

// Ayni proses icinde ardisik cagrilari anahtarlar arasinda dondurerek
// tek bir anahtarin tum yuku tek basina tasimasini onler.
let donguIndeksi = 0;

async function tekAnahtarlaJsonIste(
  base64Image: string,
  apiKey: string,
  model: string,
  sistemPromptu: string,
  kullaniciMetni: string
): Promise<unknown> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sistemPromptu },
        {
          role: "user",
          content: [
            { type: "text", text: kullaniciMetni },
            { type: "image_url", image_url: { url: base64Image } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const hataMetni = await response.text();
    throw new GroqIstekHatasi(response.status, `Groq API hatası (${response.status}): ${hataMetni.slice(0, 500)}`);
  }

  const veri = await response.json();
  const icerik = veri.choices?.[0]?.message?.content;
  if (!icerik) throw new Error("Groq yanıtında içerik bulunamadı.");

  try {
    return JSON.parse(icerik);
  } catch {
    throw new Error("Groq yanıtı geçerli JSON değil: " + String(icerik).slice(0, 300));
  }
}

async function anahtarlarlaDeneyerekIste(
  base64Image: string,
  model: string,
  sistemPromptu: string,
  kullaniciMetni: string
): Promise<unknown> {
  const anahtarlar = groqAnahtarlariniGetir();
  if (anahtarlar.length === 0) {
    throw new Error("Hiç Groq API anahtarı tanımlı değil. .env dosyasına GROQ_API_KEYS ekleyin.");
  }

  let sonHata: unknown = null;

  for (let deneme = 0; deneme < anahtarlar.length; deneme++) {
    const anahtarIndeksi = (donguIndeksi + deneme) % anahtarlar.length;
    const anahtar = anahtarlar[anahtarIndeksi];

    try {
      const sonuc = await tekAnahtarlaJsonIste(base64Image, anahtar, model, sistemPromptu, kullaniciMetni);
      donguIndeksi = (anahtarIndeksi + 1) % anahtarlar.length;
      return sonuc;
    } catch (err) {
      sonHata = err;
      const yenidenDenenebilir = err instanceof GroqIstekHatasi && ANAHTAR_DEGISTIRME_DURUMLARI.has(err.status);
      // Anahtarla ilgisi olmayan bir hata ise (orn. bozuk JSON), diger anahtari
      // denemek sonucu degistirmez; direkt hatayi yansit.
      if (!yenidenDenenebilir) throw err;
      // Aksi halde sessizce siradaki anahtara gec.
    }
  }

  throw sonHata instanceof Error ? sonHata : new Error("Tüm Groq anahtarları başarısız oldu.");
}

export async function faturaGorseliniOku(base64Image: string, model: string): Promise<FaturaOkumaSonucu> {
  const ayrisik = await anahtarlarlaDeneyerekIste(
    base64Image,
    model,
    FATURA_SISTEM_PROMPTU,
    "Bu faturadaki tüm kalemleri JSON olarak çıkar."
  );

  const sonuc = ayrisik as Partial<FaturaOkumaSonucu> & {
    kalemler?: (FaturaKalemi & { satirToplami?: number | null })[];
  };
  const kalemler = Array.isArray(sonuc.kalemler) ? sonuc.kalemler : [];

  return {
    tedarikciAdi: sonuc.tedarikciAdi ?? null,
    faturaTarihi: sonuc.faturaTarihi ?? null,
    faturaNo: sonuc.faturaNo ?? null,
    kalemler: kalemler.map((k) => {
      const miktar = Number.isFinite(Number(k.miktar)) && Number(k.miktar) > 0 ? Math.round(Number(k.miktar)) : 1;
      const satirToplami =
        k.satirToplami != null && Number.isFinite(Number(k.satirToplami)) ? Number(k.satirToplami) : null;
      const okunanBirimFiyat = k.birimFiyat != null && Number.isFinite(Number(k.birimFiyat)) ? Number(k.birimFiyat) : null;
      // Satir toplami (KDV haric, iskonto dahil nihai tutar) varsa o her zaman
      // dogru kaynak; birim fiyat sutunu iskontoyu yansitmayabilir.
      const birimFiyat = satirToplami != null ? Math.round((satirToplami / miktar) * 100) / 100 : okunanBirimFiyat;

      return {
        stokKodu: String(k.stokKodu ?? "").trim() || "BILINMIYOR",
        urunAdi: String(k.urunAdi ?? "").trim() || "İsimsiz Ürün",
        marka: String(k.marka ?? "Diğer").trim() || "Diğer",
        model: k.model ? String(k.model).trim() || null : null,
        miktar,
        birimFiyat,
        satirToplami,
      };
    }),
  };
}

export async function urunGorseliniTani(base64Image: string, model: string): Promise<UrunTanimaSonucu> {
  const ayrisik = await anahtarlarlaDeneyerekIste(
    base64Image,
    model,
    URUN_SISTEM_PROMPTU,
    "Bu görseldeki ürünün stok kodunu, adını ve markasını JSON olarak çıkar."
  );

  const sonuc = ayrisik as Partial<UrunTanimaSonucu>;
  return {
    stokKoduTahmini: sonuc.stokKoduTahmini ? String(sonuc.stokKoduTahmini).trim() : null,
    urunAdiTahmini: sonuc.urunAdiTahmini ? String(sonuc.urunAdiTahmini).trim() : null,
    markaTahmini: sonuc.markaTahmini ? String(sonuc.markaTahmini).trim() : null,
  };
}
