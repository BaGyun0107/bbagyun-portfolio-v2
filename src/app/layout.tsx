import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BbaGyun's Portfolio",
  description: "구조를 설계하고 흐름을 만드는 개발자 박윤신의 포트폴리오입니다.",
  icons: {
    icon: "/BbaGyun_white_logo.png",
    apple: "/BbaGyun_white_logo.png",
  },
  openGraph: {
    title: "BbaGyun's Portfolio",
    description: "구조를 설계하고 흐름을 만드는 개발자 박윤신의 포트폴리오입니다.",
    url: "https://www.bbagyun.com/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BbaGyun's Portfolio",
    description: "구조를 설계하고 흐름을 만드는 개발자 박윤신의 포트폴리오입니다.",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/BbaGyun_white_logo.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
