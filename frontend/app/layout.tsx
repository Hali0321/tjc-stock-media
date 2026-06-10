import type { Metadata } from "next";
import { Crimson_Text, Geist_Mono, Noto_Sans_TC, Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import "./dam-v3-final.css";
import "./dam-enterprise.css";
import { AppChrome } from "@/components/AppChrome";
import { RoleProvider } from "@/components/RoleProvider";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap"
});

const crimsonText = Crimson_Text({
  variable: "--font-crimson-text",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap"
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
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
  title: "True Jesus Church Media Library",
  description: "Approved media for ministry teams"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sourceSans.variable} ${crimsonText.variable} ${playfairDisplay.variable} ${notoSansTc.variable} ${geistMono.variable} font-sans`}>
        <RoleProvider>
          <AppChrome>{children}</AppChrome>
        </RoleProvider>
      </body>
    </html>
  );
}
