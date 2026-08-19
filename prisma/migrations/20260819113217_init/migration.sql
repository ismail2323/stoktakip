-- CreateEnum
CREATE TYPE "HareketTipi" AS ENUM ('ALIS', 'SATIS', 'DUZELTME_ARTIS', 'DUZELTME_AZALIS');

-- CreateTable
CREATE TABLE "Kullanici" (
    "id" TEXT NOT NULL,
    "kullaniciAdi" TEXT NOT NULL,
    "sifreHash" TEXT NOT NULL,
    "ad" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kullanici_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tedarikci" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "telefon" TEXT,
    "email" TEXT,
    "adres" TEXT,
    "notlar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tedarikci_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Urun" (
    "id" TEXT NOT NULL,
    "stokKodu" TEXT NOT NULL,
    "urunAdi" TEXT NOT NULL,
    "marka" TEXT NOT NULL,
    "model" TEXT,
    "kategori" TEXT,
    "miktar" INTEGER NOT NULL DEFAULT 0,
    "minStokSeviyesi" INTEGER NOT NULL DEFAULT 1,
    "birim" TEXT NOT NULL DEFAULT 'adet',
    "alisFiyati" DOUBLE PRECISION,
    "satisFiyati" DOUBLE PRECISION,
    "notlar" TEXT,
    "tedarikciId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Urun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fatura" (
    "id" TEXT NOT NULL,
    "faturaNo" TEXT,
    "tarih" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tedarikciId" TEXT,
    "toplamTutar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kaynak" TEXT NOT NULL DEFAULT 'elle',
    "kullaniciId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StokHareketi" (
    "id" TEXT NOT NULL,
    "urunId" TEXT NOT NULL,
    "tip" "HareketTipi" NOT NULL,
    "miktar" INTEGER NOT NULL,
    "birimFiyat" DOUBLE PRECISION,
    "kaynak" TEXT NOT NULL DEFAULT 'elle',
    "aciklama" TEXT,
    "faturaId" TEXT,
    "kullaniciId" TEXT,
    "kullaniciAdiSnap" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StokHareketi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ayar" (
    "id" TEXT NOT NULL,
    "anahtar" TEXT NOT NULL,
    "deger" TEXT NOT NULL,

    CONSTRAINT "Ayar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kullanici_kullaniciAdi_key" ON "Kullanici"("kullaniciAdi");

-- CreateIndex
CREATE UNIQUE INDEX "Urun_stokKodu_key" ON "Urun"("stokKodu");

-- CreateIndex
CREATE INDEX "Urun_urunAdi_idx" ON "Urun"("urunAdi");

-- CreateIndex
CREATE INDEX "Urun_marka_idx" ON "Urun"("marka");

-- CreateIndex
CREATE INDEX "Urun_model_idx" ON "Urun"("model");

-- CreateIndex
CREATE INDEX "Fatura_tedarikciId_idx" ON "Fatura"("tedarikciId");

-- CreateIndex
CREATE INDEX "Fatura_createdAt_idx" ON "Fatura"("createdAt");

-- CreateIndex
CREATE INDEX "StokHareketi_urunId_idx" ON "StokHareketi"("urunId");

-- CreateIndex
CREATE INDEX "StokHareketi_tip_idx" ON "StokHareketi"("tip");

-- CreateIndex
CREATE INDEX "StokHareketi_createdAt_idx" ON "StokHareketi"("createdAt");

-- CreateIndex
CREATE INDEX "StokHareketi_faturaId_idx" ON "StokHareketi"("faturaId");

-- CreateIndex
CREATE UNIQUE INDEX "Ayar_anahtar_key" ON "Ayar"("anahtar");

-- AddForeignKey
ALTER TABLE "Urun" ADD CONSTRAINT "Urun_tedarikciId_fkey" FOREIGN KEY ("tedarikciId") REFERENCES "Tedarikci"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_tedarikciId_fkey" FOREIGN KEY ("tedarikciId") REFERENCES "Tedarikci"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "Kullanici"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StokHareketi" ADD CONSTRAINT "StokHareketi_urunId_fkey" FOREIGN KEY ("urunId") REFERENCES "Urun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StokHareketi" ADD CONSTRAINT "StokHareketi_faturaId_fkey" FOREIGN KEY ("faturaId") REFERENCES "Fatura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StokHareketi" ADD CONSTRAINT "StokHareketi_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "Kullanici"("id") ON DELETE SET NULL ON UPDATE CASCADE;
