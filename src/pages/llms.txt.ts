import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getSortedPosts } from "@/utils/getSortedPosts";
import { getPostUrl } from "@/utils/getPostPaths";
import config from "@/config";

export const GET: APIRoute = async () => {
  const posts = await getCollection("posts");
  const sortedPosts = getSortedPosts(posts);
  const siteUrl = config.site.url.replace(/\/+$/, "");

  const postLines = sortedPosts.map(({ data, id, filePath }) => {
    const url = new URL(
      getPostUrl(id, filePath, config.site.lang),
      `${siteUrl}/`
    ).href;
    const date = new Date(data.modDatetime ?? data.pubDatetime)
      .toISOString()
      .slice(0, 10);
    return `- [${data.title}](${url}) (${date}): ${data.description}`;
  });

  const body = `# ${config.site.title}

> ${config.site.description}

- Site: ${siteUrl}/
- Author: ${config.site.author} (${config.site.profile ?? ""})
- Language: ${config.site.lang}
- RSS: ${siteUrl}/rss.xml
- Sitemap: ${siteUrl}/sitemap-index.xml

## Posts (${sortedPosts.length})

${postLines.join("\n")}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
