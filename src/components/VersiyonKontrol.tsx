"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const KONTROL_ARALIGI_MS = 30_000;

export default function VersiyonKontrol() {
  const ilkVersiyon = useRef<string | null>(null);
  const [yeniSurumVar, setYeniSurumVar] = useState(false);

  useEffect(() => {
    let iptal = false;

    async function kontrolEt() {
      try {
        const r = await fetch("/api/version", { cache: "no-store" });
        if (!r.ok) return;
        const veri = await r.json();
        if (iptal) return;

        if (!ilkVersiyon.current) {
          ilkVersiyon.current = veri.versiyon;
          return;
        }
        if (veri.versiyon !== ilkVersiyon.current) {
          setYeniSurumVar(true);
        }
      } catch {
        // sessizce yut, bir sonraki denemede tekrar dener
      }
    }

    kontrolEt();
    const zamanlayici = setInterval(kontrolEt, KONTROL_ARALIGI_MS);
    return () => {
      iptal = true;
      clearInterval(zamanlayici);
    };
  }, []);

  if (!yeniSurumVar) return null;

  // Bilerek OTOMATIK yenilemiyoruz: bir kayit islemiyle (satis onaylama,
  // sifirlama vb.) ayni ana denk gelirse tarayicida sayfa yuklenemedi
  // hatasina yol acabiliyor. Yenileme tamamen kullanicinin tikmasiyla olur.
  return (
    <button
      onClick={() => window.location.reload()}
      className="fixed inset-x-0 top-0 z-[100] flex w-full items-center justify-center gap-2 bg-accent px-4 py-2 text-center text-sm font-medium text-accent-foreground"
    >
      <RefreshCw size={14} /> Yeni bir sürüm yayınlandı — yenilemek için dokunun
    </button>
  );
}
