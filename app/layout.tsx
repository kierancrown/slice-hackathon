import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slice AI Hackathon Presentation",
  description: "Interactive keynote-style presentation for the Slice Mobile internal AI hackathon.",
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
