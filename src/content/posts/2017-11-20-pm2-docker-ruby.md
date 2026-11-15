---
title: Docker 컨테이너 환경에서 PM2로 멀티 프로세스 · 데몬 관리하기
author: steve park
pubDatetime: 2017-11-20T09:00:00+09:00
tags:
  - docker
  - pm2
  - infra
  - devops
description: 레거시 데몬 관리 도구의 한계를 해결하기 위해 Docker 컨테이너 내부에서 pm2-runtime과 ecosystem 설정으로 Ruby·Node.js 등 멀티 프로세스를 안정적으로 운영·모니터링하는 방법을 정리합니다.
---

백엔드 시스템을 운영하다 보면 웹 API 서버 외에도 큐 컨슈머, 스케줄러, 배치 워커 같은 백그라운드 데몬(Daemon) 프로세스를 함께 관리해야 합니다. 기존에 파일 기반 PID 관리 도구나 구형 데몬 라이브러리(예: `daemons-rails` 등)를 쓰다 보면 다음과 같은 운영상 한계에 부딪히곤 합니다.

- 프로세스가 비정상 종료되었을 때 자동 재시작과 알림이 불안정함
- 파일 기반 PID 업데이트 지연으로 실제 생존 여부 파악이 어려움
- 프로세스별 표준 출력/에러 로그가 흩어져 있어 원인 추적이 번거로움

이 글에서는 전통적인 `monit`이나 `systemd` 대신, Node.js 진영에서 검증된 프로세스 매니저 **PM2**를 **Docker 컨테이너 환경**과 결합해 Node.js뿐 아니라 **Ruby·Python 같은 타 언어 데몬까지 통합 관리하는 실전 패턴**을 정리합니다.

## 왜 PM2 + Docker 조합인가?

PM2는 본래 Node.js 프로세스 매니저로 유명하지만, `interpreter` 옵션을 통해 **Ruby, Python, 셸 스크립트 등 어떤 실행 파일이든 통합 관리**할 수 있습니다.

- 크래시 시 자동 재시작 및 지수 백오프(Exponential Backoff) 지원
- 단일 설정 파일(`ecosystem.config.cjs`)로 여러 워커와 API 서버를 선언적으로 정의
- CPU/메모리 사용량 모니터링 및 로그 통합 스트리밍

## 1. PM2 설정 파일 작성 (`ecosystem.config.cjs`)

PM2는 Node.js 스크립트 외의 인터프리터(`ruby`, `python3` 등)도 직접 실행하고 감시할 수 있습니다.

```js file="ecosystem.config.cjs"
module.exports = {
  apps: [
    {
      name: "queue-worker",
      script: "./worker.rb",
      interpreter: "ruby",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        RAILS_ENV: "development",
      },
      env_production: {
        RAILS_ENV: "production",
      },
    },
    {
      name: "api-server",
      script: "./server.js",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
```

> [!TIP]
> `exec_mode: "cluster"`는 Node.js 내장 `cluster` 모듈을 사용하므로 Node.js 앱에만 적용합니다. Ruby나 Python 워커를 여러 개 띄워야 한다면 `exec_mode: "fork"` 상태에서 `instances` 수를 지정하거나 컨테이너 레플리카(Scale-out)로 확장하세요.

## 2. Docker에서 가장 중요한 함정: `pm2 start` vs `pm2-runtime`

로컬 서버에서 쓰던 습관 그대로 `Dockerfile`의 `CMD`에 `pm2 start ecosystem.config.cjs`를 넣으면 **컨테이너가 뜨자마자 즉시 종료(Exited 0)** 됩니다.

이유는 `pm2 start`가 데몬을 백그라운드로 띄운 뒤 CLI 프로세스 자신은 종료하기 때문입니다. Docker 컨테이너는 **PID 1 포그라운드 프로세스가 종료되면 컨테이너 전체가 멈춘 것으로 간주**합니다.

따라서 Docker 컨테이너 안에서는 반드시 포그라운드로 실행되며 시그널(`SIGTERM`, `SIGINT`)을 하위 프로세스에 안전하게 전달하는 **`pm2-runtime`** 을 사용해야 합니다.

```dockerfile file="Dockerfile"
FROM ruby:3.3-slim

# Node.js 및 PM2 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl nodejs npm \
  && npm install -g pm2 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Gemfile Gemfile.lock ./
RUN bundle install --without development test

COPY . .

# 로그가 컨테이너 파일시스템 내부에 쌓이지 않고 Docker stdout/stderr로 출력되도록 설정
CMD ["pm2-runtime", "start", "ecosystem.config.cjs", "--env", "production"]
```

## 3. 운영 환경 체크리스트: 로그와 단일 책임 원칙

1. **로그는 파일이 아닌 `stdout`으로**: `pm2-runtime`은 기본적으로 관리 중인 모든 앱의 로그를 컨테이너 표준 출력으로 모아 내보냅니다. `docker logs`나 CloudWatch / Fluent Bit 같은 호스트 로그 드라이버와 자연스럽게 연동됩니다.
2. **컨테이너 설계 원칙과의 균형**: 마이크로서비스·Kubernetes 환경에서는 본래 **"컨테이너 1개 = 프로세스 1개"** 로 쪼개고 오케스트레이터(ECS, K8s)가 재시작과 스케일링을 맡는 것이 베스트 프랙티스입니다. 단일 VM + Docker Compose 환경에서 여러 보조 워커를 가볍게 묶어 통합 제어해야 할 때 `pm2-runtime`이 실용적인 대안이 됩니다.
3. **Graceful Shutdown 처리**: 컨테이너 배포 시 `pm2-runtime`이 보내는 `SIGINT`/`SIGTERM` 시그널을 앱 코드에서 받아 진행 중인 큐 작업을 마무리한 뒤 종료하도록 `kill_timeout`을 충분히 설정하세요.

## 핵심 요약

- PM2는 `interpreter` 옵션을 통해 Node.js뿐 아니라 Ruby·Python 데몬도 통합 관리할 수 있습니다.
- Docker 내부에서는 백그라운드 실행인 `pm2 start` 대신 포그라운드 PID 1 역할을 수행하는 **`pm2-runtime`** 을 사용해야 컨테이너가 꺼지지 않고 정상적인 시그널 처리가 가능합니다.
