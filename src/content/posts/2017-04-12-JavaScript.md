---
title: JavaScript 핵심 기초 — 실행 모델부터 스코프와 타입 비교까지
author: steve park
pubDatetime: 2017-04-12T09:00:00+09:00
tags:
  - javascript
  - web
description: ECMAScript 표준의 의미부터 변수 선언(var/let/const), 엄격 비교(===), 스코프, 클로저, 모듈 시스템까지 JavaScript의 핵심 기반을 정리합니다.
---

JavaScript는 웹 브라우저의 동적 스크립팅 언어로 출발했지만, 현재는 Node.js를 통한 백엔드, 데스크톱(Electron), 모바일, 정적 사이트 빌드 도구까지 아우르는 범용 언어가 되었습니다. 단편적인 문법 암기를 넘어 **언어가 실제로 어떻게 동작하는지** 핵심 기반을 정리합니다.

## ECMAScript와 JavaScript의 관계

JavaScript가 여러 브라우저에서 일관되게 동작하려면 공통 표준이 필요합니다. **Ecma International(TC39)**이 제정하는 표준 명세가 **ECMAScript(ES)**이며, JavaScript는 이 ECMAScript 사양을 기반으로 브라우저의 DOM/Web API나 Node.js의 런타임 API를 결합해 구현한 언어입니다.

- **ES5 (2009)**: `strict mode`, `JSON`, `Array.prototype.map/filter/reduce` 등 현대 JavaScript의 기틀 마련
- **ES6 / ES2015**: `let`/`const`, 화살표 함수, `class`, `Promise`, `Map`/`Set`, ES Modules(`import`/`export`) 도입
- **ES2016 이후**: 매년 새로운 표준 버전(ES2017 `async/await`, ES2020 `Optional Chaining`, ES2022 Top-level `await` 등)이 점진적으로 추가

> [!NOTE]
> HTML이 문서의 **구조**, CSS가 **표현(스타일)**을 담당한다면, JavaScript는 상태 변화와 이벤트를 제어하는 **동작** 계층을 담당합니다.

## 변수 선언: var, let, const

| 구분 | `var` | `let` | `const` |
| --- | --- | --- | --- |
| **스코프** | 함수 스코프 (Function Scope) | 블록 스코프 (Block Scope) | 블록 스코프 (Block Scope) |
| **재선언** | 가능 (의도치 않은 덮어쓰기 위험) | 불가 | 불가 |
| **재할당** | 가능 | 가능 | 불가 (단, 객체 내부 프로퍼티 변경은 가능) |
| **호이스팅 시 초기화** | `undefined`로 초기화 | TDZ(Temporal Dead Zone) 적용 | TDZ 적용 |

현업 코드에서는 **기본적으로 `const`를 사용하고, 재할당이 꼭 필요한 경우에만 `let`을 사용**하는 것이 안전합니다. `var`는 함수 밖 블록(`if`, `for`)을 무시하고 전역 또는 함수 전체에 변수를 노출시켜 버그를 유발하기 쉽습니다.

```js
const user = { name: "Steve", role: "developer" };
user.role = "engineer"; // 가능: 참조(바인딩)가 아닌 객체 내부 속성 변경
// user = {}; // TypeError: const 변수 자체의 재할당은 불가
```

## 동등 비교: `==` vs `===`

JavaScript는 동적 타입 언어이므로 비교 연산자 선택이 매우 중요합니다.

- **`==` (동등 연산자)**: 비교 전 **암묵적 형 변환(Type Coercion)**을 수행합니다.
- **`===` (일치 연산자)**: 형 변환 없이 **값과 타입이 모두 같은지** 엄격하게 비교합니다.

```js
console.log(1 == "1");      // true  (문자열 "1"이 숫자 1로 변환됨)
console.log(0 == false);    // true
console.log("" == false);   // true
console.log(null == undefined); // true

console.log(1 === "1");     // false
console.log(0 === false);   // false
console.log(null === undefined); // false
```

예외적으로 `null`과 `undefined`를 동시에 걸러내는 `value == null` 패턴을 제외하면, **항상 `===`와 `!==`를 사용하는 것이 원칙**입니다. 또한 `NaN`은 자기 자신과도 `===` 비교 시 `false`를 반환하므로 `Number.isNaN(value)`로 판별해야 합니다.

## 객체와 순회

JavaScript에서 원시 타입(`string`, `number`, `boolean`, `undefined`, `null`, `symbol`, `bigint`)을 제외한 거의 모든 값은 객체입니다. 객체의 키-값을 순회할 때는 `for...in` 대신 `Object.entries()` / `Object.keys()`를 사용하면 프로토타입 체인의 의도치 않은 속성까지 순회하는 문제를 피할 수 있습니다.

```js
const scores = { alice: 95, bob: 82, carol: 90 };

for (const [name, score] of Object.entries(scores)) {
  console.log(`${name}: ${score}`);
}
```

## 스코프와 클로저(Closure) 맛보기

클로저는 **함수가 선언된 렉시컬 스코프를 기억하여, 함수가 그 스코프 밖에서 실행되더라도 해당 변수에 접근할 수 있는 성질**입니다.

과거 `var`로 반복문을 작성할 때 흔히 겪던 함정을 보면 스코프의 중요성이 명확해집니다.

```js
// var는 함수 스코프이므로 콜백 5개가 모두 같은 변수 i(최종값 5)를 참조
const legacyHandlers = [];
for (var i = 0; i < 5; i++) {
  legacyHandlers.push(() => i);
}
console.log(legacyHandlers.map(fn => fn())); // [5, 5, 5, 5, 5]

// let은 반복마다 새로운 블록 스코프 바인딩을 생성
const modernHandlers = [];
for (let j = 0; j < 5; j++) {
  modernHandlers.push(() => j);
}
console.log(modernHandlers.map(fn => fn())); // [0, 1, 2, 3, 4]
```

## 함수 컨텍스트와 `call` / `apply` / `bind`

JavaScript에서 `this`는 함수가 **어떻게 호출되었는지**에 따라 동적으로 결정됩니다(화살표 함수 제외). 특정 객체를 `this` 컨텍스트로 명시적 바인딩해야 할 때는 아래 세 메서드를 사용합니다.

```js
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

const person = { name: "Steve" };

console.log(greet.call(person, "Hello", "!"));       // "Hello, Steve!"
console.log(greet.apply(person, ["Hi", "~"]));       // "Hi, Steve~"

const boundGreet = greet.bind(person, "Welcome");
console.log(boundGreet("."));                        // "Welcome, Steve."
```

- `call`: 인자를 쉼표로 나열해 **즉시 호출**
- `apply`: 인자를 배열로 전달해 **즉시 호출**
- `bind`: `this`가 고정된 **새 함수를 반환** (이벤트 핸들러나 콜백 전달 시 유용)

## 모듈(Module)로 코드 분리하기

애플리케이션 규모가 커지면 하나의 파일에 모든 로직을 둘 수 없습니다. 코드를 의미 있는 작은 단위로 분리하면 다음 이점을 얻습니다.

1. **캡슐화 및 전역 오염 방지**: 모듈 내부 변수가 전역 스코프와 충돌하지 않습니다.
2. **재사용성과 유지보수성**: 독립된 책임을 가진 모듈은 테스트와 교체가 쉽습니다.
3. **의존성 명확화**: `import` / `export` 선언을 통해 파일 간 의존 관계를 정적으로 파악할 수 있어 번들러의 Tree-shaking이 가능해집니다.

```js file="math.js"
export const add = (a, b) => a + b;
export const multiply = (a, b) => a * b;
```

```js file="main.js"
import { add } from "./math.js";
console.log(add(2, 3)); // 5
```

## 핵심 요약

- 재할당이 없으면 `const`, 필요할 때만 `let`을 사용하고 `var`는 지양합니다.
- 암묵적 형 변환으로 인한 버그를 막기 위해 항상 `===` / `!==`로 비교합니다.
- 스코프, 클로저, `this` 바인딩, ES Modules의 동작 원리를 이해하면 프레임워크나 런타임에 구애받지 않는 견고한 JavaScript 코드를 작성할 수 있습니다.
