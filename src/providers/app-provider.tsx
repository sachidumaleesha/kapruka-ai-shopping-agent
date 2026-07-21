"use client";

import { useEffect, useState } from "react";

import { ThemeProvider } from "./theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

import NextTopLoader from "nextjs-toploader";
import { TailwindIndicator } from "@/components/shared/tailwind-indicator";

interface Props {
  children: React.ReactNode;
}

export const AppProvider = ({ children }: Props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>{children}</TooltipProvider>
      {mounted && (
        <>
          <NextTopLoader color="#FFD639" showSpinner={false} />
          <TailwindIndicator />
        </>
      )}
    </ThemeProvider>
  );
};
