"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

function abone(geriCagir: () => void) {
  window.addEventListener("tema-degisti", geriCagir);
  return () => window.removeEventListener("tema-degisti", geriCagir);
}
function anlikDurum() {
  return document.documentElement.classList.contains("dark");
}
function sunucuDurumu() {
  return false;
}

export default function TemaDegistirici({ className = "" }: { className?: string }) {
  const koyuMu = useSyncExternalStore(abone, anlikDurum, sunucuDurumu);

  function degistir() {
    const yeni = !koyuMu;
    document.documentElement.classList.toggle("dark", yeni);
    localStorage.setItem("tema", yeni ? "dark" : "light");
    // useSyncExternalStore anlik DOM durumunu okur; sinifi degistirdikten sonra
    // React'in yeniden okumasini tetiklemek icin bir olay yayinlamak yeterli.
    window.dispatchEvent(new Event("tema-degisti"));
  }

  return (
    <button
      onClick={degistir}
      aria-label="Temayı değiştir"
      className={`flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground ${className}`}
    >
      {koyuMu ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
