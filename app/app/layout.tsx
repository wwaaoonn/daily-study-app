import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Study App",
  description: "Daily English mission for quick learning challenges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
