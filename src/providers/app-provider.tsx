"use client";

import NextTopLoader from "nextjs-toploader";
import { useEffect, useState } from "react";
import { TailwindIndicator } from "@/components/shared/tailwind-indicator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./theme-provider";

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
