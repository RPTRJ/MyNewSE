import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SUT Portfolio | ระบบจัดการแฟ้มสะสมผลงาน",
  description: "ระบบจัดการแฟ้มสะสมผลงานออนไลน์ สำหรับนักศึกษามหาวิทยาลัยเทคโนโลยีสุรนารี",
  keywords: ["portfolio", "SUT", "student", "มหาวิทยาลัยเทคโนโลยีสุรนารี"],
  authors: [{ name: "Team14 SE68" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}