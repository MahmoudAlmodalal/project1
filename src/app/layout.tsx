import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter, Cairo } from "next/font/google";
import "./globals.css";
import { DirectionProvider } from "@/components/layout/DirectionProvider";
import { Header } from "@/components/layout/Header";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["300","400","500","600","700"], variable: "--font-ibm-plex-arabic", display: "swap" });
const cairo = Cairo({ subsets: ["arabic"], weight: ["600","700","800"], variable: "--font-cairo", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const metadata: Metadata = { title: "BorrowHub | Lab Equipment Demo", description: "A polished frontend demo for university equipment borrowing." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl" className={`${ibmPlexArabic.variable} ${cairo.variable} ${inter.variable}`} suppressHydrationWarning><body className="min-h-screen bg-background font-sans antialiased text-foreground flex flex-col"><DirectionProvider defaultLocale="ar"><Header user={null} /><main className="flex-1 flex flex-col">{children}</main></DirectionProvider></body></html>;
}
