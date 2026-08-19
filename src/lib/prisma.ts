import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

// Serverless'te (Vercel) her cagri yeni bir baglanti acabildigi icin dogrudan
// Postgres baglantisi ara sira yavas/zaman asimina ugrayabiliyor. ACCELERATE_URL
// tanimliysa Prisma'nin havuzlanmis/onbellekli proxy'sini kullan; tanimli
// degilse (yerel gelistirme) dogrudan baglantiya devam et.
function prismaOlustur(): PrismaClient {
  const accelerateUrl = process.env.ACCELERATE_URL;
  if (accelerateUrl) {
    return new PrismaClient({ accelerateUrl }).$extends(withAccelerate()) as unknown as PrismaClient;
  }
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaOlustur();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
