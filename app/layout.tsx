import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import ApprovalNotice from "@/components/ApprovalNotice";
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EventFlow - Event Ticketing Platform",
  description: "Discover, book, and host amazing events worldwide.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <Navbar />
          <ApprovalNotice />
          <main>{children}</main>
          <Toaster position="top-center" richColors closeButton />
        </SessionProvider>
      </body>
    </html>
  );
}
