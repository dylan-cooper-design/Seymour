import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seymour",
  description: "Functional app from Figma, local storage, and AI agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-seymour-panel text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
