---
title: JavaScript 성능 최적화 실전 가이드
author: steve park
pubDatetime: 2017-07-10T09:00:00+09:00
featured: true
tags:
  - javascript
  - performance
  - web
description: 체감 성능에 영향을 미치지 않는 미세 문법 트릭 대신, DOM 접근 최소화, 이벤트 위임, Debounce/Throttle, 메모리 누수 방지, Web Worker 등 실효성 있는 JavaScript 최적화 전략을 정리합니다.
---

JavaScript 성능을 이야기할 때 "`for` 문 길이를 캐싱하라"거나 "`||` 단축 평가로 코드량을 줄이라" 같은 미세 문법 트릭이 자주 언급되곤 합니다. 하지만 현대의 JIT(Just-In-Time) 엔진(V8 등)은 이러한 마이크로 패턴을 이미 알아서 최적화합니다.

실제 웹 애플리케이션에서 병목이 발생하는 지점은 문법 한두 줄이 아니라 **DOM 조작, 과도한 이벤트 호출, 메모리 누수, 그리고 메인 스레드 블로킹**입니다.

## 1. DOM 조작과 리플로우(Reflow) 최소화

JavaScript 실행 자체보다 **JavaScript가 DOM을 읽고 수정할 때 발생하는 레이아웃 재계산(Reflow)** 이 수십~수백 배 더 비쌉니다. ([브라우저 렌더링 파이프라인 참고](/posts/2017-07-06-browser-rendering))

### DOM 업데이트 일괄 처리 (`DocumentFragment`)

반복문 안에서 매번 `appendChild()`를 호출하면 매 순회마다 DOM 트리가 수정됩니다. 오프스크린 컨테이너인 `DocumentFragment`에 먼저 노드를 모은 뒤 한 번에 삽입하세요.

```js
// Bad: 반복문마다 실제 DOM에 삽입
const list = document.getElementById("list");
for (let i = 0; i < 1000; i++) {
  const li = document.createElement("li");
  li.textContent = `Item ${i}`;
  list.appendChild(li);
}

// Good: DocumentFragment에 모아서 단 1회만 DOM에 반영
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  const li = document.createElement("li");
  li.textContent = `Item ${i}`;
  fragment.appendChild(li);
}
list.appendChild(fragment);
```

### Layout Thrashing(강제 동기 레이아웃) 피하기

스타일을 변경한 직후에 `offsetHeight`, `getBoundingClientRect()` 같은 레이아웃 속성을 읽으면 브라우저는 정확한 값을 계산하기 위해 강제로 레이아웃을 동기 실행합니다. **읽기(Read)와 쓰기(Write) 작업을 묶어서 분리**해야 합니다.

```js
// Bad: 읽기 -> 쓰기 -> 읽기 -> 쓰기 반복 (매번 강제 리플로우 발생)
cards.forEach(card => {
  const height = card.offsetHeight;
  card.style.height = `${height + 10}px`;
});

// Good: 모든 읽기를 먼저 끝낸 뒤 일괄 쓰기
const heights = cards.map(card => card.offsetHeight);
cards.forEach((card, i) => {
  card.style.height = `${heights[i] + 10}px`;
});
```

## 2. 이벤트 최적화: 위임, Debounce, Throttle

### 이벤트 위임 (Event Delegation)

리스트 항목 1,000개에 각각 `click` 리스너를 붙이면 메모리 사용량이 늘고 동적 요소 추가 시마다 리스너를 재등록해야 합니다. 이벤트 버블링을 이용해 **공통 부모 요소 하나에만 리스너를 등록**하세요.

```js
document.getElementById("todo-list").addEventListener("click", event => {
  const button = event.target.closest("button[data-action='delete']");
  if (!button) return;

  const itemId = button.closest("li").dataset.id;
  deleteTodo(itemId);
});
```

### Debounce vs Throttle

`scroll`, `resize`, `input` 이벤트는 초당 수십~수백 번 발생합니다.

| 기법 | 동작 방식 | 적합한 사용처 |
| --- | --- | --- |
| **Debounce** | 연속 호출이 멈춘 뒤 지정 시간(예: 300ms) 후 **마지막 1회**만 실행 | 검색창 자동완성 API, 폼 입력 유효성 검사 |
| **Throttle** | 지정 주기(예: 100ms)마다 **최대 1회**만 실행 | 스크롤 위치 추적, 무한 스크롤 감지, 버튼 연타 방지 |

```js
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function throttle(fn, interval = 100) {
  let lastTime = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn(...args);
    }
  };
}
```

> [!TIP]
> 스크롤 애니메이션이나 DOM 위치 갱신에는 `setTimeout` 기반 Throttle보다 디스플레이 주사율(60Hz/120Hz)에 맞춰 실행되는 **`requestAnimationFrame`** 을 사용하는 것이 프레임 드랍(Jank)을 줄이는 데 훨씬 효과적입니다.

## 3. 엔진 친화적 코드와 자료구조 선택

- **객체의 형태(Shape / Hidden Class) 일관 유지**: V8 같은 엔진은 객체 프로퍼티 순서와 타입이 일정할 때 인라인 캐싱(Inline Caching)으로 고속 접근합니다. 생성자에서 모든 속성을 초기화하고, 동적으로 속성을 추가하거나 `delete`로 제거하기보다 `null`/`undefined` 할당이나 `Map`을 사용하세요.
- **빈번한 조회에는 `Set`/`Map` 활용**: 수만 건 이상의 데이터에서 존재 여부를 반복 확인할 때 `Array.includes()`는 $O(N)$이지만 `Set.has()`와 `Map.get()`은 평균 $O(1)$입니다.

## 4. 메모리 누수(Memory Leak) 예방

가비지 컬렉터가 동작하더라도 참조가 끊어지지 않으면 메모리는 계속 쌓입니다.

1. **해제되지 않은 타이머·이벤트 리스너**: SPA 라우트 이동이나 컴포넌트 언마운트 시 `removeEventListener`, `clearInterval`, `IntersectionObserver.disconnect()`를 호출합니다.
2. **Detached DOM 노드 참조**: 화면에서 제거된 DOM 요소를 전역 배열이나 클로저 변수가 여전히 가리키고 있으면 DOM 트리 전체가 메모리에 남습니다. 객체 메타데이터 매핑에는 `WeakMap`을 활용하세요.

## 5. 메인 스레드 부하 분산: Code Splitting & Web Worker

- **번들 분할(Dynamic `import()`)**: 초기 진입에 당장 필요 없는 무거운 라이브러리(차트, PDF 뷰어 등)는 사용자가 해당 기능을 열 때 비동기로 불러와 초기 파싱/실행 시간(TBT/INP)을 단축합니다.
- **Web Worker**: 대용량 CSV 파싱, 암호화, 이미지 필터링처럼 수백 ms 이상 걸리는 CPU 집약 연산은 Web Worker로 분리해 UI 응답성(메인 스레드)이 멈추지 않도록 합니다.

## 핵심 요약

최적화의 첫 번째 원칙은 **"측정 먼저 하기(Measure First)"** 입니다. Chrome DevTools의 **Performance**와 **Memory** 탭으로 실제 병목(Long Task, Layout Shift, Heap 증가)을 프로파일링한 뒤, DOM 일괄 처리, 이벤트 제어, 번들 분할 등 파급력이 큰 지점부터 개선하세요.
