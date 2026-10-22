import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Great_Vibes, Jost } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { coupleNames, wedding, weddingDateLabel, weddingTitle } from "@/config/wedding";

// Texte courant
const jost = Jost({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-jost", display: "swap" });

// Titres : serif fin, esprit faire-part
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

// Prénoms des mariés uniquement
const script = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-script-face", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: weddingTitle(),
    template: `%s | ${coupleNames}`,
  },
  description: `${coupleNames} vous invitent à célébrer leur mariage le ${weddingDateLabel()} — ${wedding.venue.address}. Confirmez votre présence en ligne.`,
  // Invitation privée : elle ne doit pas apparaître dans les moteurs de recherche
  robots: { index: false, follow: false },
  openGraph: {
    title: weddingTitle(),
    description: "Votre présence nous honorera. Confirmez votre venue en quelques secondes.",
    images: [{ url: wedding.images.portrait, width: 590, height: 590 }],
    locale: "fr_FR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f0e5" },
    { media: "(prefers-color-scheme: dark)", color: "#1c120d" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${jost.variable} ${cormorant.variable} ${script.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <QueryProvider>{children}</QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
