import { NextResponse } from "next/server";
import { OTURUM_COOKIE } from "@/lib/oturum";

export async function POST() {
  const yanit = NextResponse.json({ basarili: true });
  yanit.cookies.set(OTURUM_COOKIE, "", { maxAge: 0, path: "/" });
  return yanit;
}
