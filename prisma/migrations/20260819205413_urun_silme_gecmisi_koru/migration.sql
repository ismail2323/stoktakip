-- DropForeignKey
ALTER TABLE "StokHareketi" DROP CONSTRAINT "StokHareketi_urunId_fkey";

-- AlterTable
ALTER TABLE "StokHareketi" ADD COLUMN     "stokKoduSnap" TEXT,
ADD COLUMN     "urunAdiSnap" TEXT,
ALTER COLUMN "urunId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "StokHareketi" ADD CONSTRAINT "StokHareketi_urunId_fkey" FOREIGN KEY ("urunId") REFERENCES "Urun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DataMigration: mevcut hareketlere urun adi/stok kodu aninda goruntusunu doldur
UPDATE "StokHareketi" sh
SET "urunAdiSnap" = u."urunAdi",
    "stokKoduSnap" = u."stokKodu"
FROM "Urun" u
WHERE sh."urunId" = u.id AND sh."urunAdiSnap" IS NULL;
