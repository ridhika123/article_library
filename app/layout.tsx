import type { Metadata } from "next";
import { Inter, Playfair_Display, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { LibraryProvider } from "@/components/LibraryContext";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ArticleShelf - Your Web Library",
  description: "A beautiful reading space inspired by Apple Books",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${geistMono.variable} font-sans antialiased max-w-full overflow-hidden flex h-screen bg-[#f2f2f7] dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100`}>
        <LibraryProvider>
          {/* Sidebar container */}
          <Sidebar className="w-64 flex-none border-r border-[#e5e5ea] dark:border-slate-800/60 bg-white/70 dark:bg-black/70 backdrop-blur-3xl hidden md:flex" />
          
          {/* Main Content scrollable area */}
          <div className="flex-1 overflow-y-auto w-full relative scroll-smooth bg-[#fcfcfd] dark:bg-[#050505]">
            {children}
          </div>
        </LibraryProvider>
      </body>
    </html>
  );
}
