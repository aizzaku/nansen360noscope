import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nansen 360 NoScope",
  description: "Learn Nansen through five guided cases, then investigate wallets, traders, tokens, signals, and DeFi exposure.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
