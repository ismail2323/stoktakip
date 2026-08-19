"use client";

import { useEffect, useRef, useState } from "react";

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

  useEffect(() => {
    if (!yeniSurumVar) return;
    const zamanlayici = setTimeout(() => window.location.reload(), 3000);
    return () => clearTimeout(zamanlayici);
  }, [yeniSurumVar]);

  if (!yeniSurumVar) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-accent px-4 py-2 text-center text-sm font-medium text-accent-foreground">
      Yeni bir sürüm yayınlandı, sayfa birazdan otomatik yenilenecek...
    </div>
  );
}
