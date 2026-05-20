import type { Metadata } from "next";
import "./globals.css";
import { BuckeyeHeader } from "@/components/brand/BuckeyeHeader";
import { BuckeyeFooter } from "@/components/brand/BuckeyeFooter";

export const metadata: Metadata = {
  title: {
    default: "Buckeye Chess Workshops",
    template: "%s — Buckeye Chess Workshops",
  },
  description:
    "Free chess lessons and live classroom quizzes for the Buckeye Public Library.",
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <BuckeyeHeader />
        <main className="flex-1">{children}</main>
        <BuckeyeFooter />
      </body>
    </html>
  );
}
