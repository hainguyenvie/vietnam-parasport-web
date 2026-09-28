/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXTAUTH_URL || 'https://vietnamparasports.com',
  generateRobotsTxt: true,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/api/*', '/admin/*', '/login', '/register', '/forgot-password', '/reset-password', '/profile', '/settings', '/bookmarks'],
  additionalPaths: async (config) => {
    const publicRoutes = [
      '/', '/about', '/news', '/sports', '/clubs', '/matches', '/tournaments',
      '/rankings', '/courses', '/creator-lab', '/companion', '/search',
      '/accessibility', '/faq', '/privacy', '/terms',
    ];

    const result = [];
    for (const route of publicRoutes) {
      result.push({ loc: route, priority: route === '/' ? 1.0 : 0.7, changefreq: 'daily' });
      result.push({ loc: `/en${route}`, priority: route === '/' ? 1.0 : 0.7, changefreq: 'daily' });
    }
    return result;
  },
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: path === '/' ? 1.0 : 0.7,
      lastmod: new Date().toISOString(),
      alternateRefs: [
        { href: `${config.siteUrl}${path}`, hreflang: 'vi' },
        { href: `${config.siteUrl}/en${path}`, hreflang: 'en' },
      ],
    };
  },
};
