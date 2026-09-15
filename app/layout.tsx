import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amy & David — 24 October 2026",
  description: "The wedding celebration of Amy & David.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
