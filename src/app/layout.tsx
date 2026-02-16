import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sadaqah - Donnez à votre mosquée en 3 secondes",
  description: "La plateforme de don la plus simple et la plus rapide pour les mosquées. Soutenez votre communauté en un clic.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}
