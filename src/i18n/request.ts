import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import {
  APP_TIME_ZONE,
  DEFAULT_LOCALE,
  isAppLocale,
  LOCALE_COOKIE_NAME,
} from "@/i18n/config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requestedLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const locale = isAppLocale(requestedLocale)
    ? requestedLocale
    : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: APP_TIME_ZONE,
  };
});
