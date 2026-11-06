import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, Spectral } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { VerifyDialog } from "@/components/VerifyDialog";
import { VigilProvider } from "@/lib/store";

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Vigil", template: "%s | Vigil" },
  description: "News that stays only as long as verified people keep it burning.",
};

export const viewport: Viewport = {
  themeColor: "#16203a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spectral.variable} ${schibsted.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <VigilProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-flame focus:px-4 focus:py-2 focus:text-night"
          >
            Skip to stories
          </a>
          <Header />
          {children}
          <Footer />
          <VerifyDialog />
        </VigilProvider>
      </body>
    </html>
  );
}
