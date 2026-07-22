export const APP_LOCALES = ["en", "si", "ta"] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE_NAME = "kapruka-locale";
export const APP_TIME_ZONE = "Asia/Colombo";

export const APP_LANGUAGE_OPTIONS = [
  { code: "en", label: "English", speechLocale: "en-LK" },
  { code: "si", label: "සිංහල", speechLocale: "si-LK" },
  { code: "ta", label: "தமிழ்", speechLocale: "ta-LK" },
] as const satisfies ReadonlyArray<{
  code: AppLocale;
  label: string;
  speechLocale: string;
}>;

export const isAppLocale = (value: unknown): value is AppLocale =>
  typeof value === "string" && APP_LOCALES.includes(value as AppLocale);

export const getSpeechLocale = (locale: AppLocale) =>
  APP_LANGUAGE_OPTIONS.find((option) => option.code === locale)?.speechLocale ??
  APP_LANGUAGE_OPTIONS[0].speechLocale;
