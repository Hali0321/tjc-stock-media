import type { Metadata } from "next";
import "./globals.css";
import { AppChrome } from "@/components/AppChrome";
import { RoleProvider } from "@/components/RoleProvider";

export const metadata: Metadata = {
  title: "TJC Stock Media",
  description: "Approved media for ministry teams"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RoleProvider>
          <AppChrome>{children}</AppChrome>
        </RoleProvider>
      </body>
    </html>
  );
}
