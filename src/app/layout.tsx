import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AIProvider } from "@/components/AIContext";
import AIAssistant from "@/components/AIAssistant";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "lc3.fun",
  description: "Interactive LC-3 assembly programming course with built-in simulator",
};

const aiEnabled = process.env.NEXT_PUBLIC_AI_ENABLED === 'true';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistMono.variable} antialiased bg-bg text-text`}>
        {aiEnabled ? (
          <AIProvider>
            {children}
            <AIAssistant />
          </AIProvider>
        ) : (
          children
        )}
        <Analytics />
      </body>
    </html>
  );
}
