import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RapiLedge — Client context, on cue",
  description: "A CRM that remembers what matters before you pick up the phone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
