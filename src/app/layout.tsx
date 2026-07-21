import type { Metadata } from "next";

import "./styles/globals.css";
import { cn } from "@/lib/utils";
import { geistMono, geistSans, manrope } from "@/constants/fonts";

import { AppProvider } from "@/providers/app-provider";

export const metadata: Metadata = {
  title: "AI Shopping Agent - Kapruka",
  description: "Kapruka AI Shopping Agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        manrope.variable,
      )}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
