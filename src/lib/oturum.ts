// Web Crypto API kullanir (Node hem de Edge/middleware ortaminda calisir).

const OTURUM_SIRRI = process.env.SESSION_SECRET || "gelistirme-ortami-varsayilan-sifresi-bunu-degistir";
const SURE_MS = 30 * 24 * 60 * 60 * 1000; // 30 gun

export const OTURUM_COOKIE = "parcadepo_oturum";

async function anahtarGetir(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey("raw", enc.encode(OTURUM_SIRRI), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecodeStr(s: string): string {
  const dolgu = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const base64 = s.replace(/-/g, "+").replace(/_/g, "/") + dolgu;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function imzala(veri: string): Promise<string> {
  const key = await anahtarGetir();
  const buf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(veri));
  return base64UrlEncode(new Uint8Array(buf));
}

export async function oturumTokeniOlustur(kullaniciId: string): Promise<string> {
  const payload = JSON.stringify({ id: kullaniciId, exp: Date.now() + SURE_MS });
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(payload));
  const imza = await imzala(payloadB64);
  return `${payloadB64}.${imza}`;
}

export async function oturumTokeniDogrula(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const [payloadB64, imza] = token.split(".");
  if (!payloadB64 || !imza) return null;

  const beklenenImza = await imzala(payloadB64);
  if (beklenenImza !== imza) return null;

  try {
    const payload = JSON.parse(base64UrlDecodeStr(payloadB64)) as { id?: string; exp?: number };
    if (typeof payload.id !== "string" || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload.id;
  } catch {
    return null;
  }
}

export const OTURUM_MAX_AGE_SANIYE = SURE_MS / 1000;

export async function istektenKullaniciIdAl(req: { cookies: { get(ad: string): { value: string } | undefined } }) {
  const token = req.cookies.get(OTURUM_COOKIE)?.value;
  return oturumTokeniDogrula(token);
}
