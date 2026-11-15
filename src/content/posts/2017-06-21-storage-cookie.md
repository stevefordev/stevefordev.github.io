---
title: 브라우저 저장소 완벽 비교 — Cookie · localStorage · sessionStorage · IndexedDB
author: steve park
pubDatetime: 2017-06-21T09:00:00+09:00
tags:
  - web
  - storage
  - security
description: 브라우저 클라이언트 저장소인 Cookie, localStorage, sessionStorage, IndexedDB의 용량·수명·서버 전송 여부·보안 특성(HttpOnly/SameSite/XSS)과 실무 선택 기준을 정리합니다.
---

웹 애플리케이션이 사용자 설정, 임시 입력값, 인증 상태 등을 클라이언트 측에 유지하려면 브라우저 저장소를 활용해야 합니다. 대표적인 저장소인 **Cookie, Web Storage(`localStorage` / `sessionStorage`), IndexedDB** 는 각기 탄생 목적과 보안 특성이 다릅니다.

## 브라우저 저장소 한눈에 비교하기

| 구분 | Cookie | `localStorage` | `sessionStorage` | `IndexedDB` |
| --- | --- | --- | --- | --- |
| **저장 용량** | 약 **4KB** (개수 제한 있음) | 도메인당 약 **5~10MB** | 도메인당 약 **5~10MB** | 가용 디스크에 따라 수백 MB+ |
| **만료 시점** | `Max-Age`/`Expires` 설정 (미설정 시 세션 쿠키) | 명시적 삭제 전까지 영구 | **현재 탭/창 닫을 때** 삭제 | 영구 (명시적 삭제 전까지) |
| **HTTP 요청 시 자동 전송** | **매 요청마다 헤더에 포함** | 전송 안 됨 | 전송 안 됨 | 전송 안 됨 |
| **데이터 형식** | 문자열 (Key=Value) | 문자열 (Key-Value) | 문자열 (Key-Value) | 구조화된 객체, 파일(Blob), 인덱스 |
| **JS 접근 제한** | **`HttpOnly`** 설정 시 JS 접근 차단 가능 | 항상 JS 접근 가능 | 항상 JS 접근 가능 | 항상 JS 접근 가능 |
| **동작 방식** | 동기 | 동기 (메인 스레드 블로킹 주의) | 동기 | **비동기** (트랜잭션 기반) |

## 1. Cookie (쿠키)

쿠키는 원래 상태를 유지하지 않는(Stateless) HTTP 프로토콜에서 **서버와 클라이언트가 상태를 주고받기 위해** 만들어졌습니다. 용량이 4KB로 작고 매 HTTP 요청마다 `Cookie` 헤더에 자동으로 실려 가므로, 불필요한 데이터를 쿠키에 많이 넣으면 네트워크 트래픽이 낭비됩니다.

### 반드시 알아야 할 쿠키 보안 속성

단순히 `document.cookie = "key=value"`로 다루기보다 서버의 `Set-Cookie` 응답 헤더에 보안 속성을 함께 지정하는 것이 중요합니다.

```http
Set-Cookie: session_id=abc123; Path=/; Max-Age=3600; HttpOnly; Secure; SameSite=Lax
```

- **`HttpOnly`**: JavaScript(`document.cookie`)에서 쿠키를 읽거나 수정하지 못하게 막아 **XSS 공격으로부터 세션/토큰 탈취를 방어**합니다.
- **`Secure`**: HTTPS 암호화 통신일 때만 쿠키를 전송합니다.
- **`SameSite` (`Strict` / `Lax` / `None`)**: 타 사이트에서 발생한 요청에 쿠키를 함께 보낼지 제어하여 **CSRF 공격을 방어**합니다.
- **`Max-Age` / `Expires`**: 미지정 시 브라우저 종료와 함께 사라지는 세션 쿠키가 되며, 지정 시 디스크에 유지되는 영구 쿠키가 됩니다.

## 2. Web Storage (`localStorage` & `sessionStorage`)

HTML5에서 쿠키의 작은 용량과 매 요청 자동 전송 단점을 보완하기 위해 도입된 키-값(Key-Value) 저장소입니다.

### `localStorage` vs `sessionStorage`

- **`localStorage`**: 동일한 출처(Origin: 프로토콜 + 도메인 + 포트) 내 모든 탭과 창에서 공유되며, 브라우저를 껐다 켜도 유지됩니다. 다크 모드 테마 설정, UI 레이아웃 상태 등에 적합합니다.
- **`sessionStorage`**: **브라우저 탭(세션) 단위로 격리**되며 탭을 닫으면 즉시 삭제됩니다. 다단계 결제/회원가입 폼의 임시 입력값 복구처럼 현재 탭에서만 유지할 데이터에 적합합니다.

```js
// localStorage 기본 사용법 (객체는 JSON 직렬화 필요)
const prefs = { theme: "dark", fontSize: 16 };
localStorage.setItem("user_prefs", JSON.stringify(prefs));

const saved = JSON.parse(localStorage.getItem("user_prefs") ?? "{}");
console.log(saved.theme); // "dark"

localStorage.removeItem("user_prefs");
// localStorage.clear(); // 현재 Origin의 모든 키 삭제
```

> [!WARNING]
> **민감한 정보(비밀번호, 개인정보, 탈취 위험이 큰 인증 토큰 등)는 `localStorage`에 저장하지 마세요.**
> `localStorage`는 같은 Origin에서 실행되는 모든 JavaScript가 읽을 수 있으므로, 서드파티 스크립트나 XSS 취약점이 하나라도 뚫리면 데이터가 그대로 노출됩니다. 인증용 토큰은 가능한 한 `HttpOnly` 쿠키를 활용하는 것이 안전합니다. ([자동 로그인 보안 설계 참고](/posts/2017-06-13-security-remember-me))

## 3. IndexedDB

수십 MB 이상의 대용량 구조화 데이터나 오프라인 캐싱(PWA), 파일/이미지 캐시가 필요하다면 동기식으로 메인 스레드를 막는 `localStorage` 대신 비동기 NoSQL 데이터베이스인 **IndexedDB**를 사용해야 합니다.

## 실무 선택 기준 요약

- **인증 세션 · Refresh Token** → `HttpOnly` + `Secure` + `SameSite`가 적용된 **Cookie**
- **테마, 언어, "오늘 하루 보지 않기" 등 비민감 영구 설정** → **`localStorage`**
- **현재 탭 내 임시 폼 입력값, 일회성 탐색 상태** → **`sessionStorage`**
- **대용량 오프라인 데이터, 검색 인덱스, 파일 캐시** → **`IndexedDB`**
