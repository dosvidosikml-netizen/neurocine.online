export default function robots() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://neurocine.online";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account",
          "/auth",
          "/director",
          "/projects",
          "/api",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
