import type { Metadata } from "next";
import { Inter, Cinzel, MedievalSharp, Lato } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

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
    <html lang="pt-br" className={`${inter.variable} ${cinzel.variable} ${lato.variable} ${medieval.variable}`}>
      <body className="bg-rpg-dark text-rpg-parchment antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
