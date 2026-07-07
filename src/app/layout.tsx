import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Look & Feel — Presentation-Ready Design Decks",
  description:
    "Turn a client brief and a list of spaces into a presentation-ready, space-by-space look & feel deck in under two minutes. Built for design-and-build firms.",
  keywords: [
    "look and feel",
    "interior design",
    "design and build",
    "mood board",
    "presentation deck",
    "AI interior design",
  ],
  openGraph: {
    title: "Look & Feel — Presentation-Ready Design Decks",
    description:
      "Presentation-ready, space-by-space look & feel decks in under two minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
