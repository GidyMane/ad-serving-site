import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalAdWall } from "@/components/global-ad-wall";

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
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': "large", 'max-video-preview': -1 },
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
        <GlobalAdWall
          headline="Unlock Your Email Marketing Potential"
          description="Get started with WSDMailer today and gain complete insights into your email campaigns."
          ctaText="Access Dashboard"
          ctaLink="/api/auth/login"
          imageUrl="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
          delayMs={2500}
        />
        {children}
      </body>
    </html>
  );
}
