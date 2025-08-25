// DENTRO DE src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

// SUBSTITUA O OBJETO METADATA POR ESTE
export const metadata: Metadata = {
  title: "CineGênio Pessoal",
  description: "Seu assistente de entretenimento pessoal.",
  manifest: "/manifest.json", // Aponta para o nosso novo manifesto
  appleWebApp: {
    capable: true, // Habilita o modo de app no iOS
    statusBarStyle: "black-translucent", // Estilo da barra de status
    title: "CineGênio",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <Providers> {/* Envolva o children com os Providers */}
          {children}
        </Providers>
      </body>
    </html>
  );
}