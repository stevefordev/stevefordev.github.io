---
title: 유지보수하기 좋은 React 컴포넌트 설계 — 순수 UI와 상태의 분리
author: steve park
pubDatetime: 2017-05-24T09:00:00+09:00
tags:
  - react
  - javascript
  - architecture
description: 과거 Stateless/Stateful 구분에서 현대 React(함수형 컴포넌트 + Custom Hooks)로 이어지는 핵심 설계 원칙인 표현(UI)과 상태·비즈니스 로직의 분리 전략을 정리합니다.
---

React로 애플리케이션을 개발하다 보면 자연스럽게 다음과 같은 설계 고민을 마주하게 됩니다.

> "이 컴포넌트 안에 상태(`state`)와 API 호출을 직접 넣을까, 아니면 `props`만 받아서 그리는 순수 컴포넌트로 분리할까?"

결론부터 말하면 **가능한 한 UI를 그리는 컴포넌트는 상태와 부수 효과(Side Effect)를 갖지 않는 순수한 형태(Stateless / Presentational)로 유지하는 편이 테스트, 재사용, 유지보수 모든 면에서 유리합니다.**

## 과거의 구분에서 현대의 패턴으로

React 16.8 이전에는 상태를 가지려면 `class` 컴포넌트를, 상태가 없으면 함수형 컴포넌트(SFC: Stateless Functional Component)를 써야 했기 때문에 문법 자체가 두 역할을 강하게 구분해 주었습니다.

오늘날에는 **Hooks(`useState`, `useEffect` 등)** 의 등장으로 모든 컴포넌트를 함수형으로 작성할 수 있게 되었지만, **UI 렌더링 책임과 상태/데이터 페칭 책임을 분리한다**는 본질적인 설계 원칙은 여전히 유효하며 오히려 **Custom Hook**을 통해 더욱 깔끔해졌습니다.

## 순수 UI(Presentational) 컴포넌트가 주는 4가지 이점

### 1. 예측 가능성과 디버깅 용이성

상태와 외부 의존성이 없는 컴포넌트는 `UI = f(props)`라는 순수 함수에 가깝습니다. 동일한 `props`를 넘기면 언제나 동일한 JSX가 반환되므로, 화면 버그가 발생했을 때 원인을 추적하기가 매우 쉽습니다.

### 2. 나쁜 컴포넌트 구조의 조기 발견

컴포넌트가 너무 많은 `props`(예: 10개 이상)를 받기 시작하면 **"이 컴포넌트가 너무 많은 책임을 지고 있지는 않은가?"** 또는 **"전달하는 데이터 모델이 잘못 묶여 있지 않은가?"** 라는 코드 스멜(Code Smell)을 즉시 알아차릴 수 있습니다. 자연스럽게 작은 컴포넌트로 분해하거나 `children` 합성(Composition) 패턴으로 리팩토링하게 됩니다.

### 3. 목업(Mock) 없는 쉬운 테스트

API 클라이언트나 전역 스토어를 직접 호출하는 컴포넌트는 단위 테스트 작성 시 무거운 모킹(Mocking)이 필요합니다. 반면 `props`와 콜백 함수만 받는 순수 UI 컴포넌트는 원하는 데이터만 인자로 넘겨 렌더링 결과를 바로 검증할 수 있고, Storybook 같은 UI 카탈로그 도구에도 손쉽게 등록할 수 있습니다.

### 4. 렌더링 최적화와 재사용성

UI 컴포넌트가 특정 API 스펙이나 전역 상태 라이브러리에 묶여 있지 않으므로 다른 페이지나 디자인 시스템에서도 그대로 재사용할 수 있습니다. 필요한 경우 `React.memo`를 적용하기도 훨씬 명확합니다.

## 실전 리팩토링: 로직과 UI 분리하기

### 개선 전: UI와 데이터 페칭/상태가 한곳에 뒤섞인 컴포넌트

```tsx
function UserProfileCard({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setIsLoading(false);
      });
  }, [userId]);

  if (isLoading) return <div className="spinner">로딩 중...</div>;
  if (!user) return <div>사용자를 찾을 수 없습니다.</div>;

  return (
    <section className="card">
      <h2>{user.name}</h2>
      <p>{user.role}</p>
    </section>
  );
}
```

### 개선 후: Custom Hook + 순수 UI 컴포넌트로 분리

```tsx
// 1. 상태 및 데이터 페칭 책임을 Custom Hook으로 분리
function useUserProfile(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);

    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (!ignore) {
          setUser(data);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true; // 경쟁 상태(Race Condition) 방지
    };
  }, [userId]);

  return { user, isLoading };
}

// 2. 순수 UI 컴포넌트: props만 받아 렌더링
interface UserCardProps {
  name: string;
  role: string;
}

function UserCard({ name, role }: UserCardProps) {
  return (
    <section className="card">
      <h2>{name}</h2>
      <p>{role}</p>
    </section>
  );
}

// 3. 조합(Container) 계층
function UserProfileContainer({ userId }: { userId: string }) {
  const { user, isLoading } = useUserProfile(userId);

  if (isLoading) return <div className="spinner">로딩 중...</div>;
  if (!user) return <div>사용자를 찾을 수 없습니다.</div>;

  return <UserCard name={user.name} role={user.role} />;
}
```

> [!TIP]
> **모든 상태**를 무조건 바깥으로 빼야 하는 것은 아닙니다. 모달의 열림/닫힘, 드롭다운 토글, 입력 중인 임시 폼 값처럼 **오직 해당 UI 내부에서만 소비되는 지역 UI 상태**는 컴포넌트 내부에 두는 것이 오히려 결합도를 낮추는 올바른 선택입니다.

## 핵심 요약

- React 생태계가 클래스에서 Hooks, 서버 컴포넌트로 진화해도 **"비즈니스/데이터 로직과 순수 UI 표현을 분리한다"** 는 핵심 원칙은 변하지 않습니다.
- 재사용해야 하는 UI 컴포넌트는 상태와 API 의존성을 걷어내고 `props` 기반의 순수 컴포넌트로 설계하세요.
