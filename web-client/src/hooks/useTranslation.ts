"use client";

import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';

export function useTranslation(namespace: string = 'common') {
  const t = useTranslations(namespace);
  const locale = useLocale();

  return { t, language: locale };
}

export function useLanguage() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const setLanguage = (lang: string) => {
    router.replace(pathname, { locale: lang });
  };

  return { t, language: locale, setLanguage };
}
