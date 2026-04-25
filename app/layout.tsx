import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Move Mountains Artisan Market",
  description: "Austin Texas pop-up artisan market series. 4 venues, 55+ vendors."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
