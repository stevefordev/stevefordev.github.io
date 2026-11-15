interface SiteConfig {
  /** Deployed URL of the site, e.g. "https://example.com" */
  url: string;
  /** Blog title shown in header and meta tags */
  title: string;
  /** Short description used in SEO meta and RSS feed */
  description: string;
  /** Default post author name */
  author: string;
  /** Author profile URL (used in structured data) */
  profile?: string;
  /** Fallback OG image filename in /public, e.g. "og.jpg" */
  ogImage?: string;
  /** HTML lang attribute, defaults to "en" */
  lang?: string;
  /** IANA timezone for post dates, e.g. "Asia/Bangkok" */
  timezone?: string;
  /** Text direction */
  dir?: "ltr" | "rtl" | "auto";
  /** Google Search Console verification meta tag value */
  googleVerification?: string;
}

interface PostsConfig {
  /** Posts per page on paginated listing pages */
  perPage?: number;
  /** Posts shown on the index/home page */
  perIndex?: number;
  /**
   * @deprecated No longer has any effect. Publishing is day-granular: a post is
   * listed from the start of its `pubDatetime` day in the site timezone, so
   * there is no sub-day boundary left for a margin to cover. Safe to remove.
   */
  scheduledPostMargin?: number;
}

export interface GiscusConfig {
  /** Enable Giscus comments on post detail pages */
  enabled: boolean;
  /** GitHub repository in owner/repo format */
  repo: string;
  /** Repository ID from giscus.app */
  repoId: string;
  /** Discussion category name */
  category: string;
  /** Discussion category ID from giscus.app */
  categoryId: string;
  /** Discussion mapping strategy */
  mapping?: "pathname" | "url" | "title" | "og:title" | "specific" | "number";
  /** Strict title matching ("0" or "1") */
  strict?: "0" | "1";
  /** Enable reactions ("0" or "1") */
  reactionsEnabled?: "0" | "1";
  /** Emit metadata ("0" or "1") */
  emitMetadata?: "0" | "1";
  /** Comment input box position */
  inputPosition?: "top" | "bottom";
  /** Giscus UI language */
  lang?: string;
  /** Light theme name */
  lightTheme?: string;
  /** Dark theme name */
  darkTheme?: string;
}

export interface AnalyticsConfig {
  /** Umami analytics configuration */
  umami?: {
    websiteId: string;
    src?: string;
  };
  /** Cloudflare Web Analytics beacon token */
  cloudflare?: {
    token: string;
  };
}

interface FeaturesConfig {
  /** Enable light/dark mode toggle. Defaults to true. */
  lightAndDarkMode?: boolean;
  /**
   * Generate dynamic OG images per post and provide `/og.png` when the static
   * `public/{site.ogImage}` file is absent. When false, that file is required
   * for the default layout OG image (build fails if missing).
   */
  dynamicOgImage?: boolean;
  /** Show the /archives page and link it in nav. Defaults to true. */
  showArchives?: boolean;
  /** Show back button on post detail pages. Defaults to true. */
  showBackButton?: boolean;
  /** "Edit page" link shown on post detail pages. */
  editPost?:
    | {
        enabled: true;
        /** Base URL for the edit link, e.g. GitHub edit URL */
        url: string;
      }
    | { enabled: false };
  /**
   * Search provider. "pagefind" ships in the base template.
   * Set to false to disable search entirely.
   */
  search?: "pagefind" | false;
  /**
   * Table of contents on posts with 2+ h2/h3 headings: beside the post from
   * 1280px, in the floating button below that. Defaults to true. Turn it off
   * for one post with `hideToc: true` in its frontmatter.
   */
  toc?: boolean;
  /** Giscus comments configuration */
  giscus?: GiscusConfig;
  /** Lightweight privacy-friendly analytics hooks */
  analytics?: AnalyticsConfig;
}

interface SocialLink {
  /**
   * Must match an SVG filename in src/assets/icons/socials/.
   * e.g. "github" → src/assets/icons/socials/github.svg
   */
  name: string;
  url: string;
  /**
   * Accessible label for the icon link (aria-label, title attribute).
   * Auto-generated if omitted: "{site.title} on GitHub", "Send an email to {site.title}", etc.
   * Override when the default wording doesn't fit.
   */
  linkTitle?: string;
}

interface ShareLink {
  /**
   * Must match an SVG filename in src/assets/icons/socials/.
   * e.g. "facebook" → src/assets/icons/socials/facebook.svg
   */
  name: string;
  /** Base share URL. The post URL will be appended as a query param. */
  url: string;
  /**
   * Accessible label for the icon link (aria-label, title attribute).
   * Auto-generated if omitted: "Share this post on Facebook", "Share this post via WhatsApp", etc.
   * Override when the default wording doesn't fit.
   */
  linkTitle?: string;
}

interface AstroPaperConfig {
  site: SiteConfig;
  posts?: PostsConfig;
  features?: FeaturesConfig;
  /** Social profile links shown in header/footer */
  socials?: SocialLink[];
  /** Share links shown on post detail pages */
  shareLinks?: ShareLink[];
}

type ResolvedSiteConfig = Required<
  Pick<
    SiteConfig,
    | "url"
    | "title"
    | "description"
    | "author"
    | "lang"
    | "timezone"
    | "dir"
    | "ogImage"
  >
> &
  Pick<SiteConfig, "profile" | "googleVerification">;

type ResolvedFeaturesConfig = Required<
  Omit<FeaturesConfig, "giscus" | "analytics">
> &
  Pick<FeaturesConfig, "giscus" | "analytics">;

export interface ResolvedAstroPaperConfig {
  site: ResolvedSiteConfig;
  posts: Required<PostsConfig>;
  features: ResolvedFeaturesConfig;
  socials: SocialLink[];
  shareLinks: ShareLink[];
}

/**
 * Type helper for astro-paper.config.ts.
 * Provides full IntelliSense without any runtime overhead.
 */
export function defineAstroPaperConfig(
  config: AstroPaperConfig
): AstroPaperConfig {
  return config;
}
