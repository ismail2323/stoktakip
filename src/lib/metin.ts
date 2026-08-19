const TURKCE_KARAKTER_HARITASI: Record<string, string> = {
  ı: "i", İ: "i", ğ: "g", Ğ: "g", ü: "u", Ü: "u", ş: "s", Ş: "s", ö: "o", Ö: "o", ç: "c", Ç: "c",
};

// OCR bazen Turkce karakterleri tutarsiz yaziyor (or: "On Fren" / "Ön Fren").
// Stok kodu / urun adi karsilastirmalari bu farktan etkilenmesin diye tum
// aksanli harfleri sadelestirip, bosluk/noktalama farklarini da yok sayiyoruz.
export function normalizeEt(deger: string) {
  return deger
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİğĞüÜşŞöÖçÇ]/g, (h) => TURKCE_KARAKTER_HARITASI[h] ?? h)
    .replace(/\s+/g, " ")
    .replace(/[.,;:()[\]{}'"`]/g, "");
}
