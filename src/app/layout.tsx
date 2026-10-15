import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter, Cairo } from "next/font/google";
import "./globals.css";
import { DirectionProvider } from "@/components/layout/DirectionProvider";
import { Header } from "@/components/layout/Header";
import { getSession } from "@/lib/auth/session";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-arabic",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "بورو هب | BorrowHub - نظام إدارة إعارة العتاد المعملي",
  description:
    "منصة جامعية ذكية موثوقة لإدارة وتتبع إعارة الأجهزة والمعدات المعملية بدعم ثنائي اللغة وعمليات شباك سريعة.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlexArabic.variable} ${cairo.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased text-foreground flex flex-col">
        <DirectionProvider defaultLocale="ar">
          <Header user={session} />
          <main className="flex-1 flex flex-col">{children}</main>
        </DirectionProvider>
      </body>
    </html>
  );
}
