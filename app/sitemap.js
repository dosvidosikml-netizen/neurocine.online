const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://neurocine.online";

const routes = [
  "",
  "/studio",
  "/storyboard",
  "/cartoon",
  "/series",
];

export default function sitemap() {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
