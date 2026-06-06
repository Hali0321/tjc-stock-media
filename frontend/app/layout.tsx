import type { Metadata } from "next";
import { Geist_Mono, Inter, Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import { AppChrome } from "@/components/AppChrome";
import { RoleProvider } from "@/components/RoleProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap"
});

const notoSansTc = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  display: "swap"
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "TJC Stock Media",
  description: "Approved media for ministry teams"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${notoSansTc.variable} ${geistMono.variable} font-sans`}>
        <RoleProvider>
          <AppChrome>{children}</AppChrome>
        </RoleProvider>
      </body>
    </html>
  );
}
