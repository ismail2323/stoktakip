# Parça Depo - Yedek Parça Stok Takip Sistemi

Oto yedek parça dükkanları için: kağıt faturayı telefonla fotoğraflayıp yapay
zeka ile otomatik okuyan, stok ve satışları takip eden, telefona uygulama gibi
kurulabilen (PWA) bir stok takip sistemi.

## Özellikler

- **Ana Sayfa** — Stok değeri, günlük/haftalık satış-alış grafikleri, marka
  dağılımı, en çok satan ürünler, düşük stok uyarıları.
- **Fatura / Alış** — Kağıt faturayı fotoğrafla, Groq görsel yapay zekası
  tedarikçi, fatura no/tarihi, stok kodu, ürün adı, marka, araç modeli, adet
  ve fiyatı otomatik okur. "Elle Fatura Gir" ile aynı kapsamlı form manuel de
  doldurulabilir.
- **Satış** — Ürünü arayarak ya da **kamerayla fotoğrafını çekip** bulun,
  adedi girin, stok otomatik düşer.
- **Stok Listesi** — Marka + araç modeli (Corolla, Tucson, C Serisi vb.) ile
  filtreleme, arama, elle ekleme/düzenleme.
- **Hareketler** — Tarih aralığı ve arama filtreli, günlere gruplanmış detaylı
  log: kim, ne zaman, hangi kaynaktan (fatura okuma/kamera/elle) yaptı.
- **Tedarikçiler** — Her tedarikçinin ürün sayısı, toplam alış tutarı, sipariş
  geçmişi tek ekranda.
- **Ayarlar** — Dükkan adı, düşük stok eşiği, kullanıcı adı/şifre değiştirme.
  Teknik ayarlar (API anahtarı, model) bu ekranda gösterilmez, `.env` üzerinden
  yönetilir.
- **Giriş ekranı** — İlk açılışta yönetici hesabı oluşturulur, sonrasında
  kullanıcı adı/şifre ile giriş yapılır.
- **Koyu / Açık Tema** — Sağ üstteki simgeden değiştirilir, tercih tarayıcıda
  saklanır.
- **Mobil uygulama gibi (PWA)** — Telefonda tarayıcıdan açıp "Ana ekrana ekle"
  dediğinizde normal bir uygulama gibi çalışır (App Store/Play Store,
  geliştirici hesabı gerekmez).

## Kurulum

```bash
npm install
npx prisma migrate deploy   # veritabanını oluşturur
npm run build
npm start
```

Geliştirme sırasında `npm run dev` kullanabilirsiniz. İlk açılışta `/giris`
sayfası yönetici hesabı oluşturmanızı isteyecektir.

## Groq API Anahtarları (fatura okuma / kamera tanıma için gerekli)

1. https://console.groq.com/keys adresinden ücretsiz bir/birkaç hesapla API
   anahtarı alın.
2. Proje kökündeki `.env` dosyasını açın, şu satırı doldurun (birden fazla
   anahtarı virgülle ayırarak yazabilirsiniz):
   ```
   GROQ_API_KEYS="anahtar1,anahtar2,anahtar3"
   ```
3. Sunucuyu yeniden başlatın.

**Çoklu anahtar / otomatik yedekleme:** Birden fazla anahtar tanımlarsanız,
sistem her istekte anahtarlar arasında dönüşümlü çalışır; bir anahtar kota
limitine takılır ya da hata verirse (429/401/403/5xx), kullanıcıya hiç belli
etmeden aynı istek içinde otomatik olarak sıradaki anahtarı dener.

Groq zaman zaman model isimlerini günceller/emekliye ayırır (bu proje
`qwen/qwen3.6-27b` görsel modeliyle test edilmiştir). Fatura/ürün okuma hata
verirse `.env` dosyasındaki `GROQ_VISION_MODEL` değerini
[console.groq.com/docs/vision](https://console.groq.com/docs/vision)
adresindeki güncel model adıyla değiştirin.

## Mobil / Kamera Notları

- Fatura ve ürün fotoğrafı çekme, `<input type="file" capture="environment">`
  standardını kullanır — bu, telefonun kendi kamera uygulamasını açar ve
  hem iOS Safari hem Android Chrome/WebView'de en güvenilir yöntemdir
  (getUserMedia tabanlı özel kamera arayüzlerinden farklı olarak izin
  yönetimini işletim sistemine bırakır, HTTPS zorunluluğu yoktur).
- Sayfa, iOS/Android/tablet arası tüm ekran genişliklerinde (375px'den
  1024px+'a kadar) yatay taşma olmadan test edilmiştir; formlar iOS'ta
  otomatik yakınlaştırmayı tetiklemeyecek şekilde ayarlanmıştır.
- Telefona "Ana ekrana ekle" ile kurulduğunda çentik/ev çubuğu gibi güvenli
  alanlar (safe-area) otomatik hesaba katılır.
- Görsel tarayıcıda okunamazsa (ör. eski bir HEIC galeri fotoğrafı) sistem
  otomatik olarak orijinal dosyayı küçültmeden gönderir, kamera akışı hiçbir
  cihazda sessizce takılmaz.
- Tam üretim kullanımı için HTTPS önerilir (özellikle "Ana ekrana ekle"nin
  çevrimdışı önbellekleme kısmı için); yerel ağda düz HTTP üzerinden de
  kamera ve temel özellikler çalışır.

## Giriş / Kullanıcı Yönetimi

- İlk kez açıldığında sistem hesap yoksa `/giris` sayfası bir kurulum formu
  gösterir; girilen kullanıcı adı/şifre yönetici hesabı olur.
- Kullanıcı adı ve şifre daha sonra **Ayarlar → Giriş Bilgileri**'nden,
  mevcut şifre onaylanarak değiştirilebilir.
- `SESSION_SECRET` (.env) oturum imzalamak için kullanılır; değiştirilirse
  herkesin oturumu düşer.

## Telefona "Uygulama Gibi" Kurma

1. Sunucuyu bir bilgisayarda/sunucuda çalışır halde bırakın (aynı Wi-Fi ağında
   veya internete açık bir adreste).
2. Telefonda Chrome/Safari ile adresi açın, giriş yapın.
3. Tarayıcı menüsünden "Ana ekrana ekle" / "Add to Home Screen" seçin.
4. Artık ikon üzerinden normal bir uygulama gibi tam ekran açılır.

## Teknik Notlar

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Prisma 7 + SQLite** — veritabanı tek bir dosyada (`dev.db`), yedeklemesi
  kolay, ayrı bir veritabanı sunucusuna gerek yok.
- **Groq API** (qwen3.6-27b görsel model) — fatura ve ürün görsellerinden
  yapılandırılmış veri (JSON) çıkarır. Çoklu anahtar desteğiyle otomatik
  yedekleme yapar.
- **Kimlik doğrulama** — Node `scrypt` ile şifre hash'leme, imzalı çerez
  tabanlı oturum (`src/proxy.ts`, eski adıyla middleware, korumalı rotaları
  yönetir).
- Veritabanını yedeklemek için proje kökündeki `dev.db` dosyasını kopyalamanız
  yeterlidir.
