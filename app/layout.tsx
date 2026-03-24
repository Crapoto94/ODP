import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import changelog from "../backend/changelog.json";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Domaine Public",
  description: "Gestion de l'Occupation du Domaine Public",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="fixed top-2 left-2 z-[9999] text-xs font-mono text-zinc-500 opacity-50 pointer-events-none select-none">
          v{changelog.version}
        </div>
        {children}
      </body>
    </html>
  );
}
