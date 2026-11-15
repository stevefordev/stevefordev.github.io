# Steve Devlog

Jekyll(Hydejack) 기반에서 **Astro + AstroPaper**로 전면 개편된 개인 기술 블로그입니다.
기존 Jekyll 버전의 전체 상태는 `archive/jekyll` 브랜치에 보존되어 있습니다.

## 주요 기술 스택

- **프레임워크**: Astro 7 + Tailwind CSS v4 + TypeScript
- **테마**: AstroPaper v7 기반 한국어 커스터마이징
- **검색**: Pagefind (빌드 타임 정적 전문 검색)
- **댓글**: Giscus (GitHub Discussions 기반, 라이트/다크 테마 동기화)
- **콘텐츠 확장**: MDX, Shiki 코드 하이라이팅, KaTeX 수식(`$...$`, `$$...$$`), Mermaid 다이어그램(` ```mermaid `)
- **OG 이미지**: Satori + Sharp 기반 동적 PNG 생성 (`NanumGothic` 한글 폰트 포함)
- **배포**: GitHub Actions (`.github/workflows/deploy.yml`) → GitHub Pages

## 개발 및 빌드 명령어

```bash
pnpm install        # 의존성 설치
pnpm run dev        # 로컬 개발 서버 실행
pnpm run build      # astro check + astro build + Pagefind 인덱싱
pnpm run preview    # 빌드 결과 로컬 프리뷰
pnpm run lint       # ESLint 검사
pnpm run format:check
```

## 새 글 작성

`src/content/posts/` 아래에 `.md` 또는 `.mdx` 파일을 추가합니다.

```yaml
---
title: "포스트 제목"
author: steve park
pubDatetime: 2026-11-15T09:00:00+09:00
tags:
  - devlog
description: "요약 설명"
draft: false
---
```

## 배포 후 활성화 체크리스트

1. **GitHub Pages 소스 전환**:
   `Settings → Pages → Build and deployment → Source`를 **GitHub Actions**로 설정합니다.
2. **Giscus 댓글 활성화**:
   저장소 `Settings → Features → Discussions`를 활성화한 뒤 [giscus.app](https://giscus.app/ko)에서 `repoId`와 `categoryId`를 발급받아 `astro-paper.config.ts`의 `features.giscus`에 입력하고 `enabled: true`로 변경합니다.
3. **방문자 통계 (선택)**:
   `astro-paper.config.ts`의 `features.analytics`에 Umami(`websiteId`) 또는 Cloudflare Web Analytics(`token`)를 입력하면 자동 활성화됩니다.
