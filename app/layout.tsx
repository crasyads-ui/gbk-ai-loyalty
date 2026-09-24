import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "GBK AI Loyalty", description: "Shop, earn GBK rewards, hold, swap and transfer.", manifest: "/manifest.webmanifest" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }