import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top Valley Admin",
  description: "Admin panel for Top Valley Driving Center",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
