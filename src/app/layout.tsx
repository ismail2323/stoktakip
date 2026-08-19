import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import SwKaydet from "@/components/SwKaydet";
import VersiyonKontrol from "@/components/VersiyonKontrol";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parça Depo - Stok Takip",
  description: "Oto yedek parça dükkanı için fatura okuyan stok ve satış takip sistemi",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Parça Depo",
  },
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

const TEMA_SCRIPTI = `
try {
  var kayitli = localStorage.getItem('tema');
  var sistemKoyu = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var koyuMu = kayitli === 'dark' || (kayitli !== 'light' && sistemKoyu);
  if (koyuMu) document.documentElement.classList.add('dark');
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="tema-init" strategy="beforeInteractive">
          {TEMA_SCRIPTI}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <SwKaydet />
        <VersiyonKontrol />
        {children}
      </body>
    </html>
  );
}
