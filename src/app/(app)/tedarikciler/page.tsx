"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Phone, MapPin, Mail, Package, Receipt, Calendar } from "lucide-react";
import { Baslik, Kart, Buton, Girdi, BosDurum, Yukleniyor, paraFormat } from "@/components/ui";

type Tedarikci = {
  id: string;
  ad: string;
  telefon: string | null;
  email: string | null;
  adres: string | null;
  notlar: string | null;
  urunSayisi: number;
  toplamAlisTutari: number;
  faturaSayisi: number;
  sonSiparisTarihi: string | null;
};

type TedarikciDetay = Tedarikci & {
  urunler: { id: string; stokKodu: string; urunAdi: string; miktar: number; birim: string }[];
  faturalar: { id: string; faturaNo: string | null; tarih: string; toplamTutar: number; kaynak: string }[];
};

const BOS_FORM = { ad: "", telefon: "", email: "", adres: "", notlar: "" };

export default function TedarikcilerPage() {
  const [liste, setListe] = useState<Tedarikci[] | null>(null);
  const [duzenlenen, setDuzenlenen] = useState<Tedarikci | null>(null);
  const [detay, setDetay] = useState<TedarikciDetay | null>(null);
  const [detayYukleniyor, setDetayYukleniyor] = useState(false);
  const [yeniAcik, setYeniAcik] = useState(false);
  const [form, setForm] = useState({ ...BOS_FORM });
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const listele = () => fetch("/api/suppliers").then((r) => r.json()).then(setListe);

  useEffect(() => {
    listele();
  }, []);

  async function kartaTikla(t: Tedarikci) {
    setDetay(null);
    setDetayYukleniyor(true);
    try {
      const veri = await fetch(`/api/suppliers/${t.id}`).then((r) => r.json());
      setDetay(veri);
    } finally {
      setDetayYukleniyor(false);
    }
  }

  function duzenlemeyiAc(t: Tedarikci, e?: React.MouseEvent) {
    e?.stopPropagation();
    setDuzenlenen(t);
    setForm({ ad: t.ad, telefon: t.telefon || "", email: t.email || "", adres: t.adres || "", notlar: t.notlar || "" });
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
    if (!form.ad.trim()) {
      setHata("Tedarikçi adı zorunlu.");
      return;
    }
    setKaydediliyor(true);
    setHata(null);
    try {
      const yanit = duzenlenen
        ? await fetch(`/api/suppliers/${duzenlenen.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })
        : await fetch("/api/suppliers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
      if (!yanit.ok) {
        const veri = await yanit.json();
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
    if (!confirm(`"${duzenlenen.ad}" tedarikçisini silmek istediğinize emin misiniz?`)) return;
    setKaydediliyor(true);
    try {
      const yanit = await fetch(`/api/suppliers/${duzenlenen.id}`, { method: "DELETE" });
      if (!yanit.ok) {
        const veri = await yanit.json();
        setHata(veri.hata || "Silinemedi.");
        return;
      }
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
        title="Tedarikçiler"
        aciklama="Parça sağlayıcı depo ve tedarikçilerinizi, sipariş geçmişleriyle birlikte yönetin."
        sag={
          <Buton onClick={yeniyiAc}>
            <Plus size={16} /> Yeni Tedarikçi
          </Buton>
        }
      />

      {!liste ? (
        <Yukleniyor />
      ) : liste.length === 0 ? (
        <BosDurum mesaj="Henüz tedarikçi eklenmedi. Fatura onaylarken de otomatik eklenir." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {liste.map((t) => (
            <Kart key={t.id} className="flex cursor-pointer flex-col gap-3 hover:border-accent" >
              <div onClick={() => kartaTikla(t)} className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="font-medium">{t.ad}</div>
                  <button onClick={(e) => duzenlemeyiAc(t, e)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-foreground">
                    <Pencil size={14} />
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  {t.telefon && (
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Phone size={12} /> {t.telefon}
                    </div>
                  )}
                  {t.email && (
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Mail size={12} /> {t.email}
                    </div>
                  )}
                  {t.adres && (
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <MapPin size={12} /> {t.adres}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
                  <div>
                    <div className="text-[11px] text-muted">Ürün</div>
                    <div className="text-sm font-semibold">{t.urunSayisi}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted">Toplam Alış</div>
                    <div className="text-sm font-semibold">{paraFormat(t.toplamAlisTutari)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted">Fatura Sayısı</div>
                    <div className="text-sm font-semibold">{t.faturaSayisi}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted">Son Sipariş</div>
                    <div className="text-sm font-semibold">
                      {t.sonSiparisTarihi ? new Date(t.sonSiparisTarihi).toLocaleDateString("tr-TR") : "-"}
                    </div>
                  </div>
                </div>
              </div>
            </Kart>
          ))}
        </div>
      )}

      {/* Duzenle / Yeni panel */}
      {panelAcik && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <div className="absolute inset-0 bg-black/40" onClick={panelKapat} />
          <div
            className="relative w-full max-w-md rounded-t-2xl bg-surface p-5 md:rounded-2xl"
            style={{ paddingBottom: "calc(1.25rem + var(--safe-bottom))" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{duzenlenen ? "Tedarikçiyi Düzenle" : "Yeni Tedarikçi"}</h2>
              <button onClick={panelKapat} className="text-muted"><X size={20} /></button>
            </div>

            {hata && <div className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{hata}</div>}

            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted">Tedarikçi Adı</label>
                <Girdi value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Telefon</label>
                <Girdi value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">E-posta</label>
                <Girdi type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Adres</label>
                <Girdi value={form.adres} onChange={(e) => setForm({ ...form, adres: e.target.value })} />
              </div>
              <div>
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

      {/* Detay paneli */}
      {(detay || detayYukleniyor) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetay(null)} />
          <div
            className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-surface p-5 md:rounded-2xl"
            style={{ paddingBottom: "calc(1.25rem + var(--safe-bottom))" }}
          >
            {detayYukleniyor && (
              <div className="flex justify-center py-10 text-muted">
                <Loader2 className="animate-spin" size={24} />
              </div>
            )}
            {detay && !detayYukleniyor && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold">{detay.ad}</h2>
                  <button onClick={() => setDetay(null)} className="text-muted"><X size={20} /></button>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-surface-2 p-3">
                  <div>
                    <div className="text-[11px] text-muted">Toplam Alış</div>
                    <div className="text-sm font-semibold">{paraFormat(detay.toplamAlisTutari)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted">Fatura Sayısı</div>
                    <div className="text-sm font-semibold">{detay.faturaSayisi}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Package size={15} /> Ürünler ({detay.urunler.length})
                  </div>
                  {detay.urunler.length === 0 ? (
                    <BosDurum mesaj="Bu tedarikçiden alınmış ürün yok." />
                  ) : (
                    <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
                      {detay.urunler.slice(0, 8).map((u) => (
                        <div key={u.id} className="flex items-center justify-between px-3 py-2 text-sm">
                          <div>
                            <div className="font-medium">{u.urunAdi}</div>
                            <div className="text-xs text-muted">{u.stokKodu}</div>
                          </div>
                          <span className="text-xs text-muted">{u.miktar} {u.birim}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Receipt size={15} /> Son Faturalar
                  </div>
                  {detay.faturalar.length === 0 ? (
                    <BosDurum mesaj="Fatura kaydı yok." />
                  ) : (
                    <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
                      {detay.faturalar.map((f) => (
                        <div key={f.id} className="flex items-center justify-between px-3 py-2 text-sm">
                          <div className="flex items-center gap-1.5 text-xs text-muted">
                            <Calendar size={12} /> {new Date(f.tarih).toLocaleDateString("tr-TR")}
                            {f.faturaNo && <span>· {f.faturaNo}</span>}
                          </div>
                          <span className="font-medium">{paraFormat(f.toplamTutar)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
