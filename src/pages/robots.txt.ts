import type { APIRoute } from "astro";

const aiCrawlers = [
  "GPTBot",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
];

const getRobotsTxt = (sitemapURL: URL) => `User-agent: *
Allow: /

${aiCrawlers.map(bot => `User-agent: ${bot}\nAllow: /`).join("\n\n")}

Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL("sitemap-index.xml", site);
  return new Response(getRobotsTxt(sitemapURL), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
