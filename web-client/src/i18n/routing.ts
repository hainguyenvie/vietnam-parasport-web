import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['vi', 'en'],
  defaultLocale: 'vi',
  // The public portal is Vietnamese-first. Locale changes remain available
  // through the language switcher, but browser preferences must not turn the
  // root URL into English on a fresh visit or after deployment.
  localeDetection: false
});

export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
