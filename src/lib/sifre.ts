import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function sifreyiHashle(sifre: string): string {
  const tuz = randomBytes(16).toString("hex");
  const hash = scryptSync(sifre, tuz, 64).toString("hex");
  return `${tuz}:${hash}`;
}

export function sifreDogruMu(sifre: string, saklananHash: string): boolean {
  const [tuz, hash] = saklananHash.split(":");
  if (!tuz || !hash) return false;
  const denenen = scryptSync(sifre, tuz, 64);
  const gercek = Buffer.from(hash, "hex");
  if (denenen.length !== gercek.length) return false;
  return timingSafeEqual(denenen, gercek);
}
