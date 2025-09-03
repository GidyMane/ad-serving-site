import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "WSDMailer – Email Analytics & Deliverability Dashboard",
    template: "%s | WSDMailer",
  },
  description:
    "Track, monitor, and analyze your email campaigns with real‑time insights into delivery, opens, clicks, bounces, and engagement.",
  applicationName: "WSDMailer",
  keywords: [
    "WSDMailer",
    "email analytics",
    "email deliverability",
    "open rates",
    "click rates",
    "email dashboard",
    "campaign tracking",
    "audience insights",
  ],
  authors: [{ name: "WSDMailer" }],
  creator: "WSDMailer",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, maxSnippet: -1, maxImagePreview: "large", maxVideoPreview: -1 },
  },
  alternates: { canonical: "/" },
  twitter: {
    card: "summary_large_image",
    title: "WSDMailer – Email Analytics & Deliverability Dashboard",
    description:
      "Monitor delivery, opens, clicks, bounces, and engagement across your email campaigns with WSDMailer.",
  },
  openGraph: {
    type: "website",
    title: "WSDMailer – Email Analytics & Deliverability Dashboard",
    description:
      "Track, monitor, and analyze your email campaigns with real‑time insights into delivery, opens, clicks, bounces, and engagement.",
    siteName: "WSDMailer",
    url: "/",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
