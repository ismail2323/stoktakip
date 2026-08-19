"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Search, Plus, Pencil, Trash2, X, Loader2, Car } from "lucide-react";
import { Baslik, Kart, Buton, Girdi, Secim, Etiket, BosDurum, Yukleniyor, paraFormat } from "@/components/ui";
import { MARKALAR, modelleriGetir } from "@/lib/araclar";

type Tedarikci = { id: string; ad: string };
type Urun = {
  id: string;
  stokKodu: string;
  urunAdi: string;
  marka: string;
  model: string | null;
  kategori: string | null;
  miktar: number;
  minStokSeviyesi: number;
  birim: string;
  alisFiyati: number | null;
  satisFiyati: number | null;
  notlar: string | null;
  tedarikci: Tedarikci | null;
};

const MARKA_FILTRE = ["Tümü", ...MARKALAR];

const BOS_FORM = {
  stokKodu: "",
  urunAdi: "",
  marka: "Diğer",
  model: "",
  kategori: "",
  miktar: 0,
  minStokSeviyesi: 2,
  birim: "adet",
  alisFiyati: "",
  satisFiyati: "",
  notlar: "",
};

export default function StokPage() {
  const [urunler, setUrunler] = useState<Urun[] | null>(null);
  const [sorgu, setSorgu] = useState("");
  const [marka, setMarka] = useState("Tümü");
  const [model, setModel] = useState("Tümü");
  const [sadeceDusuk, setSadeceDusuk] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("dusukStok") === "1"
  );
  const [duzenlenen, setDuzenlenen] = useState<Urun | null>(null);
  const [yeniAcik, setYeniAcik] = useState(false);
  const [form, setForm] = useState({ ...BOS_FORM });
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const filtreModelleri = useMemo(() => (marka === "Tümü" ? [] : modelleriGetir(marka)), [marka]);
  const formModelleri = useMemo(() => modelleriGetir(form.marka), [form.marka]);

  const listele = useCallback(() => {
    const params = new URLSearchParams();
    if (sorgu.trim()) params.set("q", sorgu.trim());
    if (marka !== "Tümü") params.set("marka", marka);
    if (model !== "Tümü") params.set("model", model);
    if (sadeceDusuk) params.set("dusukStok", "1");
    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then(setUrunler);
  }, [sorgu, marka, model, sadeceDusuk]);

  useEffect(() => {
    const zamanlayici = setTimeout(listele, 250);
    return () => clearTimeout(zamanlayici);
  }, [listele]);

  function markaDegisti(yeniMarka: string) {
    setMarka(yeniMarka);
    setModel("Tümü");
  }

  function duzenlemeyiAc(u: Urun) {
    setDuzenlenen(u);
    setForm({
      stokKodu: u.stokKodu,
      urunAdi: u.urunAdi,
      marka: u.marka,
      model: u.model || "",
      kategori: u.kategori || "",
      miktar: u.miktar,
      minStokSeviyesi: u.minStokSeviyesi,
      birim: u.birim,
      alisFiyati: u.alisFiyati?.toString() ?? "",
      satisFiyati: u.satisFiyati?.toString() ?? "",
      notlar: u.notlar || "",
    });
    setHata(null);
  }

  function yeniyiAc() {
    setForm({ ...BOS_FORM });
    setYeniAcik(true);
    setHata(null);
  }

  function panelKapat() {
    setDuzenlenen(null);
    setYeniAcik(false);
  }

  async function kaydet() {
    if (!form.stokKodu.trim() || !form.urunAdi.trim()) {
      setHata("Stok kodu ve ürün adı zorunlu.");
      return;
    }
    setKaydediliyor(true);
    setHata(null);
    const govde = {
      stokKodu: form.stokKodu.trim(),
      urunAdi: form.urunAdi.trim(),
      marka: form.marka,
      model: form.model.trim() || null,
      kategori: form.kategori || null,
      miktar: Number(form.miktar),
      minStokSeviyesi: Number(form.minStokSeviyesi),
      birim: form.birim || "adet",
      alisFiyati: form.alisFiyati === "" ? null : Number(form.alisFiyati),
      satisFiyati: form.satisFiyati === "" ? null : Number(form.satisFiyati),
      notlar: form.notlar || null,
    };
    try {
      const yanit = duzenlenen
        ? await fetch(`/api/products/${duzenlenen.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(govde),
          })
        : await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(govde),
          });
      const veri = await yanit.json();
      if (!yanit.ok) {
        setHata(veri.hata || "Kaydedilemedi.");
        return;
      }
      panelKapat();
      listele();
    } catch {
      setHata("Sunucuya ulaşılamadı.");
    } finally {
      setKaydediliyor(false);
    }
  }

  async function sil() {
    if (!duzenlenen) return;
    if (!confirm(`"${duzenlenen.urunAdi}" ürününü silmek istediğinize emin misiniz?`)) return;
    setKaydediliyor(true);
    try {
      await fetch(`/api/products/${duzenlenen.id}`, { method: "DELETE" });
      panelKapat();
      listele();
    } finally {
      setKaydediliyor(false);
    }
  }

  const panelAcik = Boolean(duzenlenen) || yeniAcik;

  return (
    <div>
      <Baslik
        title="Stok Listesi"
        aciklama="Tüm ürünleri görüntüleyin, arayın ve gerekirse elle düzenleyin."
        sag={
          <Buton onClick={yeniyiAc}>
            <Plus size={16} /> Yeni Ürün
          </Buton>
        }
      />

      <Kart className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Girdi className="pl-9" placeholder="Stok kodu, ürün adı veya model ara..." value={sorgu} onChange={(e) => setSorgu(e.target.value)} />
          </div>
          <Secim className="w-auto" value={marka} onChange={(e) => markaDegisti(e.target.value)}>
            {MARKA_FILTRE.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Secim>
          {filtreModelleri.length > 0 && (
            <Secim className="w-auto" value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="Tümü">Tüm Modeller</option>
              {filtreModelleri.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Secim>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sadeceDusuk} onChange={(e) => setSadeceDusuk(e.target.checked)} />
            Sadece düşük stok
          </label>
        </div>
      </Kart>

      {!urunler ? (
        <Yukleniyor />
      ) : urunler.length === 0 ? (
        <BosDurum mesaj="Kayıtlı ürün bulunamadı." />
      ) : (
        <Kart className="overflow-x-auto p-0">
          <table className="w-full min-w-[940px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">Tedarikçi</th>
                <th className="px-4 py-3 font-medium">Stok Kodu</th>
                <th className="px-4 py-3 font-medium">Ürün Adı</th>
                <th className="px-4 py-3 font-medium">Marka / Model</th>
                <th className="px-4 py-3 font-medium">Stok</th>
                <th className="px-4 py-3 font-medium">Alış</th>
                <th className="px-4 py-3 font-medium">Satış</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {urunler.map((u) => (
                <tr key={u.id} className="hover:bg-surface-2">
                  <td className="px-4 py-3 text-muted">{u.tedarikci?.ad ?? "-"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{u.stokKodu}</td>
                  <td className="px-4 py-3 font-medium">{u.urunAdi}</td>
                  <td className="px-4 py-3 text-muted">
                    <div className="flex items-center gap-1.5">
                      <span>{u.marka}</span>
                      {u.model && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs">
                          <Car size={11} /> {u.model}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Etiket ton={u.miktar <= 0 ? "danger" : u.miktar <= u.minStokSeviyesi ? "warn" : "ok"}>
                      {u.miktar} {u.birim}
                    </Etiket>
                  </td>
                  <td className="px-4 py-3 text-muted">{paraFormat(u.alisFiyati)}</td>
                  <td className="px-4 py-3 text-muted">{paraFormat(u.satisFiyati)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => duzenlemeyiAc(u)} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-foreground">
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Kart>
      )}

      {panelAcik && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <div className="absolute inset-0 bg-black/40" onClick={panelKapat} />
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-surface p-5 md:rounded-2xl"
            style={{ paddingBottom: "calc(1.25rem + var(--safe-bottom))" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{duzenlenen ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</h2>
              <button onClick={panelKapat} className="text-muted"><X size={20} /></button>
            </div>

            {hata && <div className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{hata}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 md:col-span-1">
                <label className="mb-1 block text-xs text-muted">Stok Kodu</label>
                <Girdi value={form.stokKodu} onChange={(e) => setForm({ ...form, stokKodu: e.target.value })} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="mb-1 block text-xs text-muted">Marka</label>
                <Secim
                  value={form.marka}
                  onChange={(e) => setForm({ ...form, marka: e.target.value, model: "" })}
                >
                  {MARKALAR.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Secim>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-muted">Ürün Adı</label>
                <Girdi value={form.urunAdi} onChange={(e) => setForm({ ...form, urunAdi: e.target.value })} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="mb-1 block text-xs text-muted">Araç Modeli</label>
                <Girdi
                  list="model-onerileri"
                  placeholder="Örn: Corolla, C200..."
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
                <datalist id="model-onerileri">
                  {formModelleri.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="mb-1 block text-xs text-muted">Kategori</label>
                <Girdi
                  placeholder="Örn: Fren, Motor, Filtre..."
                  value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Miktar</label>
                <Girdi type="number" value={form.miktar} onChange={(e) => setForm({ ...form, miktar: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Min. Stok Uyarısı</label>
                <Girdi type="number" value={form.minStokSeviyesi} onChange={(e) => setForm({ ...form, minStokSeviyesi: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Alış Fiyatı</label>
                <Girdi type="number" step="0.01" value={form.alisFiyati} onChange={(e) => setForm({ ...form, alisFiyati: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Satış Fiyatı</label>
                <Girdi type="number" step="0.01" value={form.satisFiyati} onChange={(e) => setForm({ ...form, satisFiyati: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-muted">Notlar</label>
                <Girdi value={form.notlar} onChange={(e) => setForm({ ...form, notlar: e.target.value })} />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              {duzenlenen ? (
                <Buton varyant="tehlike" onClick={sil} disabled={kaydediliyor}>
                  <Trash2 size={16} /> Sil
                </Buton>
              ) : <div />}
              <div className="flex gap-2">
                <Buton varyant="ikincil" onClick={panelKapat} disabled={kaydediliyor}>Vazgeç</Buton>
                <Buton onClick={kaydet} disabled={kaydediliyor}>
                  {kaydediliyor && <Loader2 size={16} className="animate-spin" />} Kaydet
                </Buton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
