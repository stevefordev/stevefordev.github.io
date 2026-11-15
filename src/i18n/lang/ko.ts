import type { UIStrings } from "../types";

export default {
  nav: {
    home: "홈",
    posts: "포스트",
    tags: "태그",
    about: "소개",
    archives: "아카이브",
    search: "검색",
  },
  post: {
    publishedAt: "작성일",
    updatedAt: "수정일",
    sharePostIntro: "공유하기:",
    sharePostOn: "{{platform}}에 공유하기",
    sharePostViaEmail: "이메일로 공유하기",
    tagLabel: "태그",
    backToTop: "맨 위로",
    tableOfContents: "목차",
    goBack: "뒤로 가기",
    editPage: "페이지 수정",
    previousPost: "이전 글",
    nextPost: "다음 글",
  },
  pagination: {
    prev: "이전",
    next: "다음",
    page: "페이지",
  },
  home: {
    socialLinks: "소셜 링크",
    featured: "추천 글",
    recentPosts: "최근 글",
    allPosts: "모든 글 보기",
  },
  footer: {
    copyright: "Copyright",
    allRightsReserved: "All rights reserved.",
  },
  pages: {
    tagTitle: "태그",
    tagDesc: "해당 태그가 포함된 모든 글입니다.",

    tagsTitle: "태그",
    tagsDesc: "블로그에서 사용된 모든 태그 목록입니다.",

    postsTitle: "포스트",
    postsDesc: "작성한 모든 글 목록입니다.",

    archivesTitle: "아카이브",
    archivesDesc: "연도·월별로 정리한 전체 글 아카이브입니다.",

    searchTitle: "검색",
    searchDesc: "블로그 내 모든 글을 검색합니다.",
  },
  a11y: {
    skipToContent: "본문으로 바로가기",
    skipTableOfContents: "목차 건너뛰기",
    openMenu: "메뉴 열기",
    closeMenu: "메뉴 닫기",
    toggleTheme: "테마 전환",
    searchPlaceholder: "검색어를 입력하세요...",
    noResults: "검색 결과가 없습니다.",
    goToPreviousPage: "이전 페이지로 이동",
    goToNextPage: "다음 페이지로 이동",
  },
  notFound: {
    title: "404 Not Found",
    message: "페이지를 찾을 수 없습니다.",
    goHome: "홈으로 돌아가기",
  },
} satisfies UIStrings;
