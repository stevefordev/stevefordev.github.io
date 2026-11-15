import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://stevefordev.github.io/",
    title: "Steve Devlog",
    description:
      "개발에 필요한 로그 수집 — 비전공 개발자, 계속 하려면 계속 공부",
    author: "steve park",
    profile: "https://github.com/stevefordev",
    lang: "ko",
    timezone: "Asia/Seoul",
    dir: "ltr",
  },
  posts: {
    perPage: 8,
    perIndex: 6,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/stevefordev/stevefordev.github.io/edit/master/",
    },
    search: "pagefind",
    toc: true,
    // GitHub 저장소에서 Discussions를 활성화한 뒤 https://giscus.app/ko 에서 발급받은 ID를 입력하고 enabled: true 로 변경하세요.
    giscus: {
      enabled: true,
      repo: "stevefordev/stevefordev.github.io",
      repoId: "MDEwOlJlcG9zaXRvcnkxNDQ1Mzg2NTU=",
      category: "Announcements",
      categoryId: "DIC_kwDOCJ18H84DLKHe",
      mapping: "pathname",
      strict: "1",
      reactionsEnabled: "1",
      emitMetadata: "0",
      inputPosition: "bottom",
      lang: "ko",
      lightTheme: "light",
      darkTheme: "dark_dimmed",
    },
    // 방문자 통계를 사용하려면 아래 중 원하는 서비스의 식별자를 입력하세요.
    analytics: {
      // umami: {
      //   websiteId: "your-umami-website-id",
      //   src: "https://cloud.umami.is/script.js",
      // },
      // cloudflare: {
      //   token: "your-cloudflare-beacon-token",
      // },
    },
  },
  socials: [
    { name: "github", url: "https://github.com/stevefordev" },
    { name: "mail", url: "mailto:stevefordev@gmail.com" },
  ],
  shareLinks: [
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "linkedin", url: "https://www.linkedin.com/sharing/share-offsite/?url=" },
    { name: "mail", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});