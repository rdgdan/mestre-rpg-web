import type { Metadata } from "next";
import { Inter, Cinzel, MedievalSharp, Lato } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: '--font-cinzel',
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: '--font-lato',
});

const medieval = MedievalSharp({
  weight: "400",
  subsets: ["latin"],
  variable: '--font-medieval',
});

export const metadata: Metadata = {
  title: "Mestre-RPG Web",
  description: "Sua ferramenta completa para gerenciar campanhas e personagens de D&D.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className={`${inter.variable} ${cinzel.variable} ${lato.variable} ${medieval.variable}`} style={{
      backgroundImage: 'linear-gradient(160deg, rgba(10, 14, 40, 0.95), rgba(12, 8, 22, 0.94)), url("https://www.transparenttextures.com/patterns/dark-matter.png")',
      backgroundAttachment: 'fixed',
      minHeight: '100vh'
    }}>
      <body style={{
        background: 'transparent',
        minHeight: '100vh'
      }} className="text-rpg-parchment antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
