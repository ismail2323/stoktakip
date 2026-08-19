import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sayi = await prisma.kullanici.count();
  return NextResponse.json({ kurulumTamam: sayi > 0 });
}
