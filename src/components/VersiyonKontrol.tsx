"use client";

import { useEffect, useRef, useState } from "react";

const KONTROL_ARALIGI_MS = 30_000;

// Otomatik yenileme, tam da bir kayit istegi (satis onaylama, sifirlama vb.)
// devam ederken tetiklenirse riskli olabiliyor. Bunu onlemek icin aktif
// GET-disi (mutasyon) isteklerini sayan global bir sayac tutuyoruz;
// yenileme, sayac sifira donene kadar bekler.
let aktifMutasyonSayisi = 0;
let fetchYamalandi = false;

function mutasyonTakibiniKur() {
  if (fetchYamalandi || typeof window === "undefined") return;
  fetchYamalandi = true;
  const orijinalFetch = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const init = args[1];
    const metod = (init?.method || "GET").toUpperCase();
    const mutasyonMu = metod !== "GET" && metod !== "HEAD";
    if (mutasyonMu) aktifMutasyonSayisi++;
    try {
      return await orijinalFetch(...args);
    } finally {
      if (mutasyonMu) aktifMutasyonSayisi--;
    }
  };
}

export default function VersiyonKontrol() {
  const ilkVersiyon = useRef<string | null>(null);
  const [yeniSurumVar, setYeniSurumVar] = useState(false);

  useEffect(() => {
    mutasyonTakibiniKur();
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
    let iptal = false;

    async function guvenliYenile() {
      // En az 3 saniye banner gorunsun, sonra aktif bir kayit islemi
      // varsa bitmesini bekle (en fazla 30sn), sonra yenile.
      await new Promise((r) => setTimeout(r, 3000));
      let denemeler = 0;
      while (!iptal && aktifMutasyonSayisi > 0 && denemeler < 60) {
        await new Promise((r) => setTimeout(r, 500));
        denemeler++;
      }
      if (!iptal) window.location.reload();
    }

    guvenliYenile();
    return () => {
      iptal = true;
    };
  }, [yeniSurumVar]);

  if (!yeniSurumVar) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-accent px-4 py-2 text-center text-sm font-medium text-accent-foreground">
      Yeni bir sürüm yayınlandı, sayfa birazdan otomatik yenilenecek...
    </div>
  );
}
