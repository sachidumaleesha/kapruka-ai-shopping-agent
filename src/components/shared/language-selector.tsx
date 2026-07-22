"use client";

import { LanguagesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import { setUserLocale } from "@/i18n/actions";
import { APP_LANGUAGE_OPTIONS, isAppLocale } from "@/i18n/config";

export const LanguageSelector = () => {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Common");
  const [isPending, startTransition] = useTransition();
  const selectedLanguage =
    APP_LANGUAGE_OPTIONS.find((option) => option.code === locale) ??
    APP_LANGUAGE_OPTIONS[0];

  return (
    <Select
      onValueChange={(nextLanguage) => {
        if (isAppLocale(nextLanguage) && nextLanguage !== locale) {
          startTransition(async () => {
            await setUserLocale(nextLanguage);
            router.refresh();
          });
        }
      }}
      value={locale}
    >
      <SelectTrigger
        aria-label={t("selectLanguage")}
        className="transition-[color,box-shadow,background-color,transform] duration-150 active:scale-[0.97]"
        disabled={isPending}
        size="sm"
      >
        <LanguagesIcon aria-hidden="true" />
        <span lang={selectedLanguage.code}>{selectedLanguage.label}</span>
      </SelectTrigger>

      <SelectContent align="end" position="popper">
        <SelectGroup>
          <SelectLabel>{t("language")}</SelectLabel>
          {APP_LANGUAGE_OPTIONS.map((option) => (
            <SelectItem
              key={option.code}
              lang={option.code}
              value={option.code}
              className="cursor-pointer"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
