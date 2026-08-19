import { NextRequest, NextResponse } from "next/server";
import { oturumTokeniDogrula, OTURUM_COOKIE } from "@/lib/oturum";

const ACIK_YOLLAR = new Set([
  "/giris",
  "/api/auth/giris",
  "/api/auth/ilk-kurulum",
  "/api/auth/kurulum-durumu",
  "/manifest.json",
  "/sw.js",
]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ACIK_YOLLAR.has(pathname) || pathname.startsWith("/icons/")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(OTURUM_COOKIE)?.value;
  const kullaniciId = await oturumTokeniDogrula(token);

  if (!kullaniciId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ hata: "Oturum gerekli." }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/giris";
    url.searchParams.set("devam", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
