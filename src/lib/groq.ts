export type FaturaKalemi = {
  stokKodu: string;
  urunAdi: string;
  marka: string;
  model: string | null;
  miktar: number;
  birimFiyat: number | null;
  satirToplami: number | null;
  kdvOrani: number | null;
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
Fotoğraf uzaktan/eğik/az ışıkta çekilmiş olabilir — küçük, bulanık veya kısmen kesilmiş yazıları da en olası
okumayla doldur; hiçbir alanı sırf emin olamadığın için boş BIRAKMA, en mantıklı tahminini yaz.

Türk e-fatura tablosu genelde şu sütunları içerir (hepsi olmayabilir):
Sıra No | Mal Hizmet Kodu | Mal Hizmet Adı | Açıklama | Miktar | Birim Fiyat | İskonto Oranı | İskonto Tutarı | KDV Oranı | KDV Tutarı | Diğer Vergiler | Mal Hizmet Toplam Tutarı

Kurallar (ÇOK ÖNEMLİ):
- Tablodaki HER SATIRI çıkar. Tablo 1 satır da içerse 30 satır da içerse, HİÇBİRİNİ ATLAMA. Satır sayısı ne olursa olsun tamamını eksiksiz listele.
- "Mal Hizmet Kodu" sütunundaki değer -> stokKodu. Sütun boşsa, ürün adından kısa anlamlı bir kod üret (örn: "FREN-BALATASI-01").
- "Mal Hizmet Adı" sütunundaki değer -> urunAdi (aynen, kısaltmadan, tam metin).
- "Miktar" sütunundaki sayı -> miktar (birim yazısını -adet, ay, kg gibi- yok say, sadece sayısal değeri al).
- "Birim Fiyat" sütunu -> birimFiyat. Bu sütun görselde bulanık/kesik olsa bile, KDV Tutarı, KDV Oranı ve
  Toplam Tutar sütunlarından TERSİNE HESAPLA (örn. toplam ve KDV oranı biliniyorsa KDV hariç tutarı miktara
  bölerek bul); birimFiyat alanını sırf sütun net görünmüyor diye null bırakma, mutlaka bir sayı üretmeye çalış.
- "KDV Oranı" sütunundaki yüzde değeri -> kdvOrani (örn. %20 için 20, %10 için 10 yaz; sütun yoksa/okunamıyorsa
  Türkiye'de oto yedek parça için en yaygın oran olan 20 yaz, null bırakma).
- Tablonun EN SAĞINDAKİ, "Mal Hizmet Toplam Tutarı" / "Tutar" / "Toplam" başlıklı parasal sütun -> satirToplami.
  Bu değer o satırın KDV HARİÇ toplam tutarıdır (iskonto uygulanmış miktar × birim fiyat sonucudur).
  satirToplami her zaman birimFiyat'tan önceliklidir, çünkü iskonto varsa birim fiyat × miktar bu değeri VERMEZ.
- "tedarikciAdi" için: e-Arşiv faturalarında SAYFANIN EN ÜSTÜNDE (adres/telefon/VKN bilgileriyle birlikte,
  "SAYIN" satırından ÖNCE) yazan firma SATICI/TEDARİKÇİdir — bunu yaz. "SAYIN:" satırından SONRA yazan firma
  ise ALICIdır (faturayı alan taraf) — bunu ASLA tedarikciAdi olarak yazma. "Vergi Dairesi", "... VD.",
  "... Vergi Dairesi Müdürlüğü" gibi bir devlet dairesi adı ASLA tedarikciAdi DEĞİLDİR — bu sadece firmanın
  bağlı olduğu vergi dairesini belirtir; bu satırı firma adı sanıp yazma. Gerçek bir firma unvanı (LTD ŞTİ,
  A.Ş., TİC., SAN. gibi ifadeler içeren ya da normal bir şirket/şahıs ismi gibi görünen bir satır) yoksa/
  görselde kadraj dışındaysa tedarikciAdi'ni null bırak — vergi dairesi adını ya da başka bir tahmini asla
  firma adı yerine kullanma. Firma unvanı kısmen bulanıksa bile okuyabildiğin kısmı (ör. "... OTO YEDEK PARÇA
  LTD ŞTİ") aynen yaz, tamamen boş bırakma. Bu alan için tek bir hızlı karar ver, aynı konuyu tekrar tekrar
  analiz etme.
- Oto yedek parça faturasıysa "marka" ve "model" alanlarını doldur. Türkiye'de yaygın TÜM otomobil, ticari araç ve
  kamyon/çekici markalarını tanı: Toyota, Renault, Fiat, Ford, Volkswagen, Opel, Peugeot, Citroën, Hyundai, Kia,
  Mercedes-Benz, BMW, Audi, Skoda, Seat, Dacia, Honda, Nissan, Mazda, Mitsubishi, Suzuki, Chevrolet, Volvo,
  Land Rover, Jeep, Isuzu, Iveco, MAN, Scania, DAF, Tofaş gibi markalar dahil. Ürün adında/açıklamasında sadece
  bir model kodu geçiyorsa (ör. "B200 4x2", "C200", "Doblo 1.3 Multijet", "Transit Custom") bunu en olası
  marka+model ikilisine çevir (ör. "B200 4x2" -> marka: "Mercedes-Benz", model: "B200 4x2"; "Doblo" -> marka:
  "Fiat", model: "Doblo"). Marka net değilse model kodundan/parça tipinden en olası markayı tahmin et, boş
  bırakma; hiçbir ipucu yoksa marka="Diğer", model=null yaz. Fatura yedek parça dışı bir şeyse (kira, elektrik,
  aidat vb.) marka="Diğer", model=null yaz.
- Hiçbir alan için uzun iç tartışma yapma / aynı kararı defalarca sorgulama. Her satır ve alan için TEK GEÇİŞTE karar
  ver ve JSON'u üretmeye geç; aksi halde çıktı yarıda kesilir ve satırlar kaybolur.
- Sayısal alanlarda sadece sayı olsun, para birimi sembolü/harfi yazma, binlik ayırıcı kullanma (ondalık için nokta kullan).
- Emin olamadığın alanları en mantıklı şekilde doldur, satırı ASLA atlama.
- SADECE aşağıdaki JSON şemasına uygun bir JSON nesnesi döndür, başka hiçbir açıklama yazma:

{
  "tedarikciAdi": string | null,
  "faturaTarihi": string | null,
  "faturaNo": string | null,
  "kalemler": [
    { "stokKodu": string, "urunAdi": string, "marka": string, "model": string | null, "miktar": number, "birimFiyat": number | null, "satirToplami": number | null, "kdvOrani": number | null }
  ]
}`;

const URUN_SISTEM_PROMPTU = `Sen bir oto yedek parça dükkanında satış yapan bir asistansın.
Sana satılacak bir yedek parçanın, üzerindeki etiketin veya kutusunun fotoğrafı verilecek.
Görevin görselde görünen parça numarasını/stok kodunu, ürün adını ve markasını okumak.

Kurallar:
- Görselde net bir kod yoksa "stokKodu" alanını null bırak.
- "markaTahmini" için Türkiye'de yaygın TÜM otomobil, ticari araç ve kamyon/çekici markalarını tanı: Toyota,
  Renault, Fiat, Ford, Volkswagen, Opel, Peugeot, Citroën, Hyundai, Kia, Mercedes-Benz, BMW, Audi, Skoda, Seat,
  Dacia, Honda, Nissan, Mazda, Mitsubishi, Suzuki, Chevrolet, Volvo, Land Rover, Jeep, Isuzu, Iveco, MAN, Scania,
  DAF, Tofaş gibi markalar dahil. Etikette sadece bir model kodu görünüyorsa (ör. "B200 4x2") en olası
  marka+model ikilisine çevir; hiçbir ipucu yoksa null bırak.
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

// API/anahtar sorunlarini ("kotan doldu", "anahtar gecersiz") gorsel kalitesi
// sorunlarindan ("net degildi, tekrar cek") ayirt eden, kullaniciya gosterilecek
// Turkce mesaj uretir. Kullanicinin "hata API'den mi gorselden mi kaynaklandi
// bilmiyorum" sorusuna dogrudan cevap vermek icin var.
export function kullaniciDostuHataMesaji(err: unknown): string {
  if (err instanceof GroqIstekHatasi) {
    if (err.status === 401 || err.status === 403) {
      return "Groq API anahtarı geçersiz veya süresi dolmuş. Bu fotoğrafın kalitesiyle ilgisi yok — Ayarlar'dan/.env dosyasından GROQ_API_KEYS'i kontrol edin.";
    }
    if (err.status === 429 || err.status === 413) {
      return "Groq API kotası/dakikalık limiti doldu. Bu fotoğrafın kalitesiyle ilgisi yok — birkaç dakika sonra tekrar deneyin ya da .env dosyasına yeni bir Groq anahtarı ekleyin.";
    }
    if (err.status >= 500) {
      return "Groq sunucu tarafında geçici bir sorun oluştu. Bu fotoğrafın kalitesiyle ilgisi yok — birkaç saniye sonra tekrar deneyin.";
    }
  }
  if (err instanceof GroqYarimKalmaHatasi) {
    return "Fatura çok uzun/karmaşık göründüğü için yapay zekanın yanıtı yarıda kesildi. Daha az satır görünecek şekilde (ör. faturayı ikiye bölüp) ya da daha net bir fotoğrafla tekrar deneyin.";
  }
  const mesaj = err instanceof Error ? err.message : String(err);
  if (mesaj.includes("geçerli JSON değil") || mesaj.includes("içerik bulunamadı")) {
    return "Fotoğraf yeterince net okunamadı. Faturayı/ürünü daha net, iyi ışıkta ve tüm satırlar görünecek şekilde tekrar çekip deneyin.";
  }
  return mesaj;
}

// Yanit token sinirina takilip yarim kaldiginda (finish_reason: "length")
// firlatilir; bu da anahtar/deneme degistirerek yeniden denenmeli.
class GroqYarimKalmaHatasi extends Error {}

// Anahtar bazli, karsilasinca siradaki anahtara gecilmesi gereken durumlar:
// 401/403 (gecersiz/iptal anahtar), 429/413 (kota/dakikalik token limiti doldu -
// Groq bunu bazen 429 yerine 413 ile de dondurebiliyor), 5xx (Groq tarafi sorunu).
const ANAHTAR_DEGISTIRME_DURUMLARI = new Set([401, 403, 413, 429, 500, 502, 503, 504]);

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
      // "Dusunen" modeller (qwen3.6-27b gibi) JSON'u yazmadan once epey
      // "reasoning" tokeni harcar; bu sinir dusuk olursa cikti yarida kesilip
      // gecersiz/eksik JSON doner (bazi fatura satirlari sessizce kaybolur).
      // NOT: Groq'un dakikalik token limiti (TPM) bu degeri istek + tahmini
      // gorsel maliyetiyle birlikte on-kontrolde rezerve ediyor; cok yuksek
      // tutmak ucretsiz hesaplarda 413/429 riskini artirir. 4000, ~15-20
      // satirlik bir faturaya rahatça yeter.
      max_completion_tokens: 6000,
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
    // Groq bazen token siniri dolarken 200/finish_reason:"length" yerine
    // dogrudan 400 "json_validate_failed" donuyor (ayni kok sebep, farkli
    // gorunum). Bu durumda da diger anahtarla/denemeyle yeniden dene.
    if (response.status === 400 && /json_validate_failed|max completion tokens/i.test(hataMetni)) {
      throw new GroqYarimKalmaHatasi("Groq yanıtı token sınırına takılıp 400 ile gecersiz JSON döndü.");
    }
    throw new GroqIstekHatasi(response.status, `Groq API hatası (${response.status}): ${hataMetni.slice(0, 500)}`);
  }

  const veri = await response.json();
  const secim = veri.choices?.[0];
  const icerik = secim?.message?.content;
  if (!icerik) throw new Error("Groq yanıtında içerik bulunamadı.");

  // "length" = model token siniri dolarken kesildi. response_format:json_object
  // bazen bu durumda bile SENTAKS OLARAK GECERLI ama EKSIK bir JSON dondurebilir
  // (orn. 4 satirlik faturadan sadece 1 satir icin kapatilmis dizi). Bu, JSON.parse'i
  // gecer ama veri sessizce kaybolmus olur - bu yuzden burada acikca hata sayiyoruz.
  if (secim?.finish_reason === "length") {
    throw new GroqYarimKalmaHatasi("Groq yanıtı token sınırına takılıp yarım kaldı.");
  }

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
      const yenidenDenenebilir =
        (err instanceof GroqIstekHatasi && ANAHTAR_DEGISTIRME_DURUMLARI.has(err.status)) ||
        err instanceof GroqYarimKalmaHatasi;
      // Anahtarla ilgisi olmayan bir hata ise (orn. bozuk JSON), diger anahtari
      // denemek sonucu degistirmez; direkt hatayi yansit.
      if (!yenidenDenenebilir) throw err;
      // Aksi halde sessizce siradaki anahtara/denemeye gec (farkli anahtar/model
      // durumu, ayni istegi bir kez daha uretme sansi verir).
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

      const kdvOrani =
        (k as { kdvOrani?: number | null }).kdvOrani != null &&
        Number.isFinite(Number((k as { kdvOrani?: number | null }).kdvOrani))
          ? Number((k as { kdvOrani?: number | null }).kdvOrani)
          : null;

      return {
        stokKodu: String(k.stokKodu ?? "").trim() || "BILINMIYOR",
        urunAdi: String(k.urunAdi ?? "").trim() || "İsimsiz Ürün",
        marka: String(k.marka ?? "Diğer").trim() || "Diğer",
        model: k.model ? String(k.model).trim() || null : null,
        miktar,
        birimFiyat,
        satirToplami,
        kdvOrani,
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
