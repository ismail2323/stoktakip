import { prisma } from "@/lib/prisma";

// Gelen govdede "tedarikciAdi" varsa isimle bulup/olusturup id'sini dondurur
// (yoksa null); "tedarikciId" dogrudan verilmisse onu kullanir; hicbiri
// yoksa undefined doner (alan hic guncellenmesin diye).
export async function tedarikciIdCoz(body: Record<string, unknown>): Promise<string | null | undefined> {
  if (body.tedarikciAdi !== undefined) {
    const ad = String(body.tedarikciAdi || "").trim();
    if (!ad) return null;
    const mevcut = await prisma.tedarikci.findFirst({ where: { ad } });
    return mevcut ? mevcut.id : (await prisma.tedarikci.create({ data: { ad } })).id;
  }
  if (body.tedarikciId !== undefined) return body.tedarikciId ? String(body.tedarikciId) : null;
  return undefined;
}
