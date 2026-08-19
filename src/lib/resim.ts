// Kamera/galeriden gelen fotografi once tarayicida kucultmeye calisir (daha
// hizli yukleme, daha az veri). Bazi cihazlarda (ozellikle Android'de HEIC
// formatinda secilen eski galeri fotograflarinda) tarayici goruntuyu
// <canvas>'a cizemeyebilir; boyle durumda kucultmeden vazgecip orijinal
// dosyayi oldugu gibi gonderir, boylece kamera akisi hicbir cihazda
// sessizce basarisiz olmaz.
export function resmiOku(dosya: File, maxKenar = 1600): Promise<string> {
  return new Promise((resolve) => {
    const dosyayiOlduguGibiOku = () => {
      const ham = new FileReader();
      ham.onload = () => resolve(ham.result as string);
      ham.onerror = () => resolve("");
      ham.readAsDataURL(dosya);
    };

    const reader = new FileReader();
    reader.onerror = dosyayiOlduguGibiOku;
    reader.onload = () => {
      const img = new Image();
      img.onerror = dosyayiOlduguGibiOku;
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxKenar || height > maxKenar) {
            const oran = Math.min(maxKenar / width, maxKenar / height);
            width = Math.round(width * oran);
            height = Math.round(height * oran);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return dosyayiOlduguGibiOku();
          ctx.drawImage(img, 0, 0, width, height);
          const sonuc = canvas.toDataURL("image/jpeg", 0.82);
          // Bazi tarayicilarda decode basarisiz oldugunda toDataURL bos/gecersiz
          // bir deger uretebilir; boyle durumda da orijinali gonder.
          if (!sonuc || sonuc === "data:,") return dosyayiOlduguGibiOku();
          resolve(sonuc);
        } catch {
          dosyayiOlduguGibiOku();
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(dosya);
  });
}
