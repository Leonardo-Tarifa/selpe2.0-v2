import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SELPE Peruíbe - Secretaria de Esportes e Lazer",
  description: "Portal Oficial da Secretaria de Esportes e Lazer do Município de Peruíbe.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/selpe-logo.jpeg", type: "image/jpeg" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
