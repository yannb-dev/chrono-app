import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chrono App",
  icons: {
    icon: "android-icon-foreground.png",
  },
  description: "Application de gestion d'apprentissage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="h-screen w-screen flex">{children}</body>
    </html>
  );
}
