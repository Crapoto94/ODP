import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import "./ui-v2.css";
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
  title: "VibeODP",
  description: "Gestion de l'Occupation du Domaine Public",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  }
};

import GlobalVersionModal from "@/components/GlobalVersionModal";
import { UiModeProvider } from "@/components/UiModeProvider";
import { getUiMode } from "@/lib/ui-mode";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const uiMode = await getUiMode();
  return (
    <html lang="en" data-ui={uiMode}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UiModeProvider mode={uiMode}>
          <GlobalVersionModal />
          {children}
        </UiModeProvider>
      </body>
    </html>
  );
}
