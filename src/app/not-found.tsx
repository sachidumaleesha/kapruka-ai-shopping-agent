import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-24 text-center">
      <div className="max-w-md">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
        <Button asChild className="mt-6" variant="secondary">
          <Link href="/">{t("backHome")}</Link>
        </Button>
      </div>
    </main>
  );
}
