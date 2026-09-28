const isDev = typeof window !== 'undefined'
  ? false // browser: always suppress console in production
  : process.env.NODE_ENV === 'development';

export const logger = {
  error: (...args: any[]) => { if (isDev) console.error(...args); },
  warn: (...args: any[]) => { if (isDev) console.warn(...args); },
  log: (...args: any[]) => { if (isDev) console.log(...args); },
};
