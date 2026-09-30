import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GBK AI Loyalty",
  description: "Shop, pay, earn GBK rewards and connect with local businesses.",
  manifest: "/manifest.webmanifest",
  applicationName: "GBK Loyalty",
  appleWebApp: { capable: true, title: "GBK Loyalty", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" }
};

export const viewport: Viewport = {
  themeColor: "#6d28d9",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}