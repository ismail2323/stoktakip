import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  await prisma.stokHareketi.deleteMany();
  await prisma.fatura.deleteMany();
  return NextResponse.json({ basarili: true });
}
