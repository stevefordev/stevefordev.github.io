import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import satori from "satori";
import sharp from "sharp";
import { getOgFonts } from "@/utils/ogFonts";
import { getPostSlug } from "@/utils/getPostPaths";
import { postFilter } from "@/utils/postFilter";
import config from "@/config";

export async function getStaticPaths() {
  if (!config.features.dynamicOgImage) {
    return [];
  }

  const posts = await getCollection("posts").then(p =>
    p.filter(post => postFilter(post) && !post.data.ogImage)
  );

  return posts.map(post => ({
    params: { slug: getPostSlug(post.id, post.filePath) },
    props: post,
  }));
}

export const GET: APIRoute = async ({ props, url }) => {
  if (!config.features.dynamicOgImage) {
    return new Response(null, { status: 404, statusText: "Not found" });
  }

  const ogFonts = await getOgFonts(url);

  const svg = await satori(
    {
      key: null,
      type: "div",
      props: {
        style: {
          background: "#f5f5f7",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: '"Google Sans Code", "NanumGothic"',
          color: "#1d1d1f",
        },
        children: {
          type: "div",
          props: {
            style: {
              boxSizing: "border-box",
              border: "1px solid #d2d2d7",
              background: "#ffffff",
              borderRadius: "28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "56px 64px",
              width: "88%",
              height: "80%",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    width: "56px",
                    height: "6px",
                    borderRadius: "999px",
                    background: "#0066cc",
                  },
                },
              },
              {
                type: "p",
                props: {
                  style: {
                    fontSize: props.data.title.length > 38 ? 50 : 58,
                    fontWeight: "bold",
                    margin: 0,
                    maxHeight: "65%",
                    overflow: "hidden",
                    lineHeight: 1.3,
                    color: "#1d1d1f",
                    wordBreak: "keep-all",
                    overflowWrap: "break-word",
                  },
                  children: props.data.title,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    fontSize: 26,
                    color: "#5e5e63",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        children: `by ${props.data.author}`,
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: { fontWeight: "bold", color: "#0066cc" },
                        children: config.site.title,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
    {
      width: 1200,
      height: 630,
      embedFont: true,
      fonts: ogFonts,
    }
  );

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(new Uint8Array(pngBuffer), {
    headers: { "Content-Type": "image/png" },
  });
};
