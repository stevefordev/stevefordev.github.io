---
title: 웹폰트(Web Font) 동작 원리와 FOIT/FOUT 최적화 전략
author: steve park
pubDatetime: 2017-07-27T09:00:00+09:00
tags:
  - web
  - webfont
  - performance
description: 웹폰트 로딩 과정에서 발생하는 FOIT/FOUT 현상의 원인을 이해하고, font-display, WOFF2, unicode-range 서브세팅, preconnect/preload를 통해 렌더링 속도를 높이는 실전 방법을 정리합니다.
---

웹폰트(Web Font)는 방문자의 OS나 기기에 해당 서체가 설치되어 있지 않아도 서버에서 폰트 파일을 내려받아 **모든 환경에서 일관된 타이포그래피와 브랜드 감성**을 표현할 수 있게 해줍니다. 하지만 특히 용량이 큰 한글 웹폰트를 잘못 적용하면 화면이 한참 빈칸으로 멈추거나 글자가 깜빡이는 심각한 UX 저하를 겪게 됩니다.

## 웹폰트 로딩 중 발생하는 문제: FOIT vs FOUT

네트워크로 폰트를 내려받는 동안 브라우저가 텍스트를 어떻게 처리할지에 따라 두 가지 현상이 나타납니다.

- **FOIT (Flash of Invisible Text)**: 폰트가 다운로드될 때까지 텍스트를 아예 **투명하게 숨겼다가** 로딩이 끝나면 한 번에 보여줍니다. 네트워크가 느릴 경우 사용자가 빈 화면만 보게 되는 문제가 있습니다.
- **FOUT (Flash of Unstyled Text)**: 먼저 시스템 기본 폰트로 텍스트를 즉시 보여준 뒤, 웹폰트가 로드되면 **교체**합니다. 콘텐츠를 바로 읽을 수 있지만 교체 순간 글꼴 크기 차이로 레이아웃이 흔들릴(CLS) 수 있습니다.

## 웹폰트 로딩 최적화 실전 전략

### 1. `font-display` 속성으로 동작 제어하기

CSS `@font-face`에 `font-display`를 지정하면 FOIT/FOUT 전략을 명시적으로 제어할 수 있습니다.

| `font-display` 값 | Block 기간 (숨김) | Swap 기간 (교체) | 권장 용도 |
| --- | --- | --- | --- |
| `auto` | 브라우저 기본값 | 브라우저 기본값 | 미지정 시 기본 동작 |
| `block` | 약 3초 | 무한 | 아이콘 폰트(대체 글자 불가) |
| **`swap`** | 극히 짧음 (~100ms) | 무한 | **일반 본문·제목(콘텐츠 우선 노출)** |
| `fallback` | 극히 짧음 (~100ms) | 약 3초 | 네트워크 느리면 기본 폰트 유지 |
| `optional` | 극히 짧음 (~100ms) | 없음 (캐시 없을 때만) | 극단적 성능 및 CLS 0 최우선 |

```css
@font-face {
  font-family: "Pretendard";
  src: url("/fonts/Pretendard-Regular.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
```

### 2. 최신 압축 포맷 WOFF2 우선 사용

구형 포맷(`TTF`, `OTF`, `EOT`)은 용량이 매우 큽니다. 현대의 모든 주요 브라우저는 Brotli 기반 압축으로 기존 WOFF보다 약 30% 이상 더 가벼운 **WOFF2**를 지원하므로 `format("woff2")`를 최우선으로 제공하세요.

### 3. 한글 웹폰트의 핵심: 서브세팅(Subsetting)과 `unicode-range`

영문 폰트는 알파벳·숫자·기호만 있어 수십 KB 수준이지만, 완성형 한글 11,172자를 모두 담은 폰트는 수 MB에 달합니다.

- **서브셋 폰트**: 실제로 자주 쓰이는 KS X 1001 기준 2,350자 등 필요한 글리프만 추출해 용량을 1/5 이하로 줄입니다.
- **다이나믹 서브세팅(`unicode-range`)**: Google Fonts나 Pretendard Dynamic Subset처럼 전체 폰트를 사용 빈도별로 쪼개 놓고, 현재 페이지에 실제로 등장한 글자의 유니코드 범위에 해당하는 조각 파일만 선택적으로 내려받도록 구성합니다.

### 4. `@import` 대신 `<link>`와 `preconnect` / `preload` 활용

CSS 파일 내부에서 `@import`로 폰트를 불러오면 CSS를 파싱한 뒤에야 폰트 요청이 시작되어 직렬 병목(Waterfall)이 생깁니다. HTML `<head>` 상단에서 직접 연결하고, 외부 CDN을 쓴다면 `preconnect`로 DNS·TLS 핸드셰이크를 미리 맺어두세요.

```html
<head>
  <!-- 외부 폰트 CDN 연결 지연 단축 -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap"
    rel="stylesheet"
  />
</head>
```

> [!TIP]
> 꼭 필요한 **자체 호스팅 핵심 폰트 1~2개**만 `<link rel="preload" as="font" type="font/woff2" crossorigin>`으로 미리 당겨오세요. 너무 많은 폰트 굵기(Weight)를 한꺼번에 로드하면 오히려 이미지나 핵심 스크립트의 대역폭을 빼앗습니다.

### 5. 대체 폰트(Fallback Font)와의 크기 조율로 CLS 줄이기

FOUT 발생 시 기본 폰트(`sans-serif`, `Apple SD Gothic Neo`, `Malgun Gothic`)와 웹폰트 간의 자간·행간 차이가 크면 레이아웃 시프트(CLS)가 발생합니다. `size-adjust`, `ascent-override` 등의 CSS 디스크립터를 활용하면 교체 시 텍스트 영역의 출렁임을 최소화할 수 있습니다.

## 핵심 요약

- 웹폰트는 **WOFF2 포맷 + 서브셋(`unicode-range`) + `font-display: swap`** 조합이 실무의 표준입니다.
- `@import`를 피하고 본문·제목에 꼭 필요한 최소 웨이트(보통 Regular 400, Bold 700 2종)만 로드하세요.
- 대체 서체(Serif: 명조 계열 / Sans-serif: 고딕 계열)를 지정할 때는 웹폰트와 톤이 맞는 시스템 폰트를 함께 선언해 FOUT 이질감을 줄이는 것이 좋습니다.
