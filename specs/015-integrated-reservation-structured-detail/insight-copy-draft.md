# Feature 015 연결 인사이트 공개 문구 초안

**상태**: 2026-09-15 사용자 명시적 content approval 완료

**작성일**: 2026-09-15

이 문서는 승인된 인터뷰 답변과 Feature 015의 사실 계약을 바탕으로 작성한 공개 구현 기준이다. 사용자는 2026-09-15에 아래 문구, 시각 자료 메타데이터, HTTPS `not-needed` 판정과 alias redirect를 명시적으로 승인했다.

## 공통 편집 경계

- 세 글은 모두 `project-case`이며 원본 기록은 `integrated-reservation-platform` 하나다.
- 프로젝트 상세는 1인 백엔드·PM/PL 역할, Core Product, 재고·결제 경계와 고객사 UAT를 프로젝트 전체 관점에서 요약한다.
- 각 인사이트는 Middleware·Guard, BFF·Origin·Cloudflare, HTTPS·비밀번호 전송이라는 질문 하나만 깊게 다룬다.
- 당시 구현·관찰과 현재 회고를 문단에서 명시적으로 분리한다.
- 실제 회사 도메인과 IP, 고객 데이터, 인증값, 시크릿, 비공개 소스 및 고객사 측 사업 여건의 세부 내용은 공개하지 않는다.
- `enterprise-bff-architecture-and-cors`는 새 글로 남기지 않고 `nextjs-nestjs-domain-separation-and-bff`로 이동하는 호환 경로로만 유지한다.

## 1. NestJS 인증은 Middleware와 Guard 중 하나를 고르는 문제가 아니었다

### 공개 메타데이터 제안

- `slug`: `nestjs-middleware-vs-guard-tradeoff`
- `title`: `NestJS 인증은 Middleware와 Guard 중 하나를 고르는 문제가 아니었다`
- `excerpt`: `Express에 익숙했던 당시에는 인증과 쿠키 갱신을 Middleware에, 관리자 등급 확인을 Guard에 나눴습니다. 구현 당시의 선택을 합리화하지 않고, 지금 다시 설계한다면 Global Auth Guard와 별도 권한 Guard로 책임을 나누겠다는 판단까지 정리했습니다.`
- `readTime`: `5 min`
- `tags`: `['Backend', 'NestJS', 'Authentication', 'Architecture', 'Retrospective']`
- `featureSlug`: `integrated-reservation-platform`
- `editorial.type`: `project-case`

### 완성 content 초안

```markdown
## 익숙한 실행 지점에서 인증을 시작했습니다

행사 호텔 예약·결제 플랫폼의 관리자 인증을 구현할 당시 저는 Node.js와 Express에는 익숙했지만 NestJS의 요청 생명주기와 권장 패턴을 충분히 비교해 본 상태는 아니었습니다. 그래서 Access·Refresh 토큰과 CSRF 값을 확인하고, 필요할 때 토큰과 쿠키를 갱신하며, 이후 로직에서 사용할 `req.user`를 주입하는 책임을 `AdminAuthMiddleware`에 두었습니다.

관리자 등급은 별도 `AdminLevelGuard`에서 확인했습니다. 즉, 당시 구현은 인증과 요청 객체 준비를 Middleware가 맡고 엔드포인트별 등급 권한을 Guard가 맡는 구조였습니다.

## 동작한 구조와 권장 구조는 같은 질문이 아니었습니다

이 책임 분리는 실제 코드에 반영됐지만, Middleware를 Guard보다 우선하는 대안을 충분히 비교한 뒤 선택한 것은 아니었습니다. 기존 글처럼 “Middleware가 더 견고했다”거나 “Guard 선언 누락을 없앴다”고 결론 내리면 당시 판단을 사후에 합리화하게 됩니다.

프로젝트에서 확인한 사실은 Middleware와 Guard를 함께 사용해 인증과 등급 권한을 나눴다는 데까지입니다. 고객사 스테이징 UAT를 진행했지만, 그것을 인증 구조의 운영 안전성이나 권한 누락 없음에 대한 검증으로 확대하지 않습니다.

## 지금 다시 설계한다면 인증을 기본값으로 둡니다

현재의 판단은 다릅니다. 다시 구성한다면 Global Auth Guard로 인증을 기본 적용하고 공개 경로만 명시적으로 제외하겠습니다. 로그인한 사용자의 세부 관리자 등급은 별도의 권한 Guard로 분리하겠습니다.

핵심은 Middleware와 Guard 중 하나를 절대적인 정답으로 고르는 것이 아니라, 인증과 권한 확인의 책임을 어디에서 기본 적용하고 어디에서 세분화할지 정하는 것입니다. 이 프로젝트의 회고에서는 기본 인증과 세부 권한을 Guard 계층에서 드러내는 편이 NestJS 구조를 읽는 사람에게 더 명확하다고 판단했습니다.

## 당시 구현과 현재 판단의 경계를 남깁니다

Global Auth Guard 구조는 이 프로젝트에서 다시 구현하거나 운영으로 검증한 결과가 아니라, 보류 이후의 개선 판단입니다. 반대로 당시 Middleware 구조가 동작했다는 사실도 그 방식이 모든 NestJS 인증에 더 적합하다는 근거는 아닙니다.

따라서 이 사례에서 가져갈 기준은 “Middleware 대신 무조건 Guard”가 아닙니다. 인증의 기본 적용, 공개 경로 예외와 관리자 등급 권한을 서로 다른 책임으로 명시하고, 프레임워크 안에서 그 경계가 가장 잘 드러나는 위치를 선택하는 것입니다.
```

### 공개 editorial/visual 데이터 제안

```ts
editorial: {
  type: 'project-case',
  visualAssessment: {
    decision: 'provided',
    kind: 'architecture',
    rationale:
      '당시 Middleware와 등급 Guard의 책임 배치, 현재 Global Auth Guard와 별도 권한 Guard의 책임 배치를 같은 요청 순서에서 비교해야 하므로 before/after 시각 자료를 제공합니다.',
    question: '당시 인증·권한 책임과 현재의 개선 판단은 요청 생명주기에서 어떻게 다른가?',
    textAlternative:
      '당시 요청은 AdminAuthMiddleware에서 토큰·쿠키·CSRF 확인과 req.user 주입을 거친 뒤 AdminLevelGuard에서 관리자 등급을 확인하고 Controller로 전달됐습니다. 현재 다시 설계한다면 요청은 공개 경로를 제외한 Global Auth Guard에서 기본 인증을 거친 뒤 별도 Permission Guard에서 관리자 등급을 확인하고 Controller로 전달됩니다.',
    nonDuplicationReason:
      '작업물의 UAT workflow는 예약·결제의 사용자·시스템 순서를, Core Product 관계도는 데이터 관계를 설명합니다. 이 시각 자료는 관리자 요청에서 인증과 권한 책임이 놓이는 위치만 비교합니다.'
  }
},
visual: {
  id: 'nestjs-auth-boundary-before-after',
  variant: 'before-after',
  title: '관리자 요청의 인증·권한 책임 비교',
  question: '당시 인증·권한 책임과 현재의 개선 판단은 요청 생명주기에서 어떻게 다른가?',
  textAlternative:
    '당시 요청은 AdminAuthMiddleware에서 토큰·쿠키·CSRF 확인과 req.user 주입을 거친 뒤 AdminLevelGuard에서 관리자 등급을 확인하고 Controller로 전달됐습니다. 현재 다시 설계한다면 요청은 공개 경로를 제외한 Global Auth Guard에서 기본 인증을 거친 뒤 별도 Permission Guard에서 관리자 등급을 확인하고 Controller로 전달됩니다.',
  panels: [
    {
      id: 'before',
      title: '당시 구현',
      summary: 'Express 경험에서 출발해 인증과 요청 객체 준비를 Middleware에, 등급 확인을 Guard에 나눴습니다.',
      actors: [
        { id: 'before-request', label: '관리자 요청', role: 'source' },
        { id: 'before-middleware', label: 'AdminAuthMiddleware', role: 'boundary' },
        { id: 'before-level-guard', label: 'AdminLevelGuard', role: 'boundary' },
        { id: 'before-controller', label: 'Controller', role: 'consumer' }
      ],
      connections: [
        {
          id: 'before-request-middleware',
          from: 'before-request',
          to: 'before-middleware',
          label: '토큰·쿠키·CSRF 확인',
          scope: 'direct'
        },
        {
          id: 'before-middleware-guard',
          from: 'before-middleware',
          to: 'before-level-guard',
          label: 'req.user 주입 후 등급 확인',
          scope: 'direct'
        },
        {
          id: 'before-guard-controller',
          from: 'before-level-guard',
          to: 'before-controller',
          label: '권한 확인 후 전달',
          scope: 'direct'
        }
      ]
    },
    {
      id: 'after',
      title: '현재 개선 판단',
      summary: '인증을 Global Auth Guard의 기본값으로 두고 공개 경로와 세부 등급 권한을 분리합니다.',
      actors: [
        { id: 'after-request', label: '요청', role: 'source' },
        { id: 'after-auth-guard', label: 'Global Auth Guard', role: 'boundary' },
        { id: 'after-permission-guard', label: 'Permission Guard', role: 'boundary' },
        { id: 'after-controller', label: 'Controller', role: 'consumer' }
      ],
      connections: [
        {
          id: 'after-request-auth',
          from: 'after-request',
          to: 'after-auth-guard',
          label: '기본 인증·공개 경로 제외',
          scope: 'direct'
        },
        {
          id: 'after-auth-permission',
          from: 'after-auth-guard',
          to: 'after-permission-guard',
          label: '인증 후 관리자 등급 확인',
          scope: 'direct'
        },
        {
          id: 'after-permission-controller',
          from: 'after-permission-guard',
          to: 'after-controller',
          label: '권한 확인 후 전달',
          scope: 'direct'
        }
      ]
    }
  ]
}
```

### 작업물과의 비중복 설명

- **Long-form**: 작업물은 관리자 인증을 백엔드 구현 요소 하나로 짧게 언급한다. 이 글은 Express 경험에서 시작한 당시 선택, Middleware와 등급 Guard의 실제 책임, 현재 Global Auth Guard 개선 판단과 미검증 범위만 분석한다. 프로젝트의 Core Product·재고·결제·UAT 연대기를 반복하지 않는다.
- **Visual**: 작업물의 workflow는 예약·결제 UAT 순서를, 관계도는 상품 데이터 관계를 보여 준다. 이 글의 before/after는 관리자 요청 생명주기의 인증·권한 위치만 보여 주므로 질문과 구성 요소가 겹치지 않는다.

## 2. [Next.js x NestJS] 프론트엔드와 백엔드의 도메인 분리와 BFF 설계

### 공개 메타데이터 제안

- `slug`: `nextjs-nestjs-domain-separation-and-bff`
- `title`: `[Next.js x NestJS] 프론트엔드와 백엔드의 도메인 분리와 BFF 설계`
- `excerpt`: `A-domain.com의 브라우저가 api.A-domain.com을 직접 호출할 때 인증 쿠키의 저장·전달 실패를 확인했습니다. Next.js reverse proxy로 요청 Origin을 맞춘 뒤 새로 드러난 Cloudflare 서버 요청 경계까지, 실제 구현과 스테이징 검증 범위로 정리했습니다.`
- `readTime`: `6 min`
- `tags`: `['Architecture', 'Next.js', 'NestJS', 'Authentication', 'BFF']`
- `featureSlug`: `integrated-reservation-platform`
- `editorial.type`: `project-case`

### 완성 content 초안

```markdown
## 같은 기본 도메인에서도 브라우저의 호출 Origin은 달랐습니다

행사 호텔 예약·결제 플랫폼에서 프론트엔드는 `A-domain.com`, API는 `api.A-domain.com`에 배치했습니다. 두 주소는 같은 기본 도메인을 사용하지만 브라우저 기준으로는 서로 다른 Origin이었습니다.

처음에는 브라우저가 API Origin을 직접 호출했습니다. 이 구조에서 인증 쿠키가 저장되거나 다음 요청에 전달되지 않는 상황을 실제로 확인했습니다. 다만 당시 브라우저 설정과 네트워크 조건을 모두 분리해 정확한 실패 원인까지 기록한 것은 아니므로, 특정 브라우저 정책 하나를 원인으로 단정하지 않습니다.

## Next.js reverse proxy로 브라우저 경계를 바꿨습니다

브라우저가 API Origin을 직접 호출하는 대신 프론트엔드의 `/bff` 경로를 호출하도록 바꾸고, Next.js rewrite가 NestJS API로 요청을 전달하게 했습니다. 브라우저가 보는 요청 Origin을 프론트엔드에 맞추면서 인증 쿠키와 CSRF 값을 사용하는 요청도 이 경계를 통과하도록 구성했습니다.

당시 구현은 요청을 대신 전달하는 reverse proxy가 중심이었습니다. 응답 조합, 프론트엔드 전용 데이터 가공과 별도의 권한 정책까지 갖춘 완성형 BFF를 구현했다고 확대하지 않습니다.

## 프록시 뒤에서는 Cloudflare 경계가 새로 드러났습니다

호출 주체가 브라우저에서 Next.js 서버로 바뀐 뒤, BFF 서버가 NestJS API로 보내는 요청이 Cloudflare 봇 차단에 걸렸습니다. 저는 이 원인을 확인하고 BFF 서버의 고정 IP를 Cloudflare 허용 규칙에 등록했습니다. 그 결과 고객사 스테이징에서 서버 요청과 인증 흐름을 다시 확인할 수 있었습니다.

이 대응은 스테이징 범위에서 확인한 결과입니다. 실제 IP와 설정값은 공개하지 않으며, 전 환경 정상화나 운영 장애 해결로 표현하지 않습니다. 이 프로젝트는 정식 운영 전에 보류됐기 때문에 운영 트래픽과 성능 결과도 없습니다.

## 지금의 판단은 이름보다 실제 책임을 먼저 확인하는 것입니다

당시에 별도의 대안을 체계적으로 비교한 기록은 없습니다. 브라우저 직접 호출에서 확인한 문제를 Next.js reverse proxy로 옮기고, 그 뒤의 Cloudflare 서버 요청 경계를 해결한 구현 순서가 남아 있을 뿐입니다.

현재 이 구조를 설명할 때는 “BFF를 도입했다”는 이름보다 실제로 어디까지 책임졌는지를 먼저 밝히는 편이 정확하다고 판단합니다. 이 프로젝트의 BFF 경계는 브라우저의 Origin을 맞추고 서버가 API 요청을 중계한 범위입니다. 이 사례만으로 모든 외부 API 호출에 BFF가 필수라고 일반화하지 않습니다.

인증 쿠키와 서버 요청 경계를 함께 다뤄야 하는 이 프로젝트에서는 reverse proxy가 문제를 분리하는 데 필요했습니다. 반면 응답 조합·가공이나 프론트 전용 권한까지 수행하지 않았다면, 그 기능까지 완성한 BFF처럼 설명해서는 안 됩니다.
```

### 공개 editorial/visual 데이터 제안

```ts
editorial: {
  type: 'project-case',
  visualAssessment: {
    decision: 'provided',
    kind: 'architecture',
    rationale:
      '브라우저 직접 호출과 Next.js reverse proxy 이후에는 요청 주체, Origin과 Cloudflare 경계가 달라지므로 두 네트워크 구성을 before/after로 비교합니다.',
    question: '브라우저 직접 호출에서 reverse proxy 경계로 바뀌며 쿠키와 Cloudflare 문제는 어떻게 분리됐는가?',
    textAlternative:
      '변경 전에는 A-domain.com의 브라우저가 api.A-domain.com을 직접 호출했고 인증 쿠키의 저장·전달 실패를 확인했습니다. 변경 후에는 브라우저가 A-domain.com의 /bff를 호출하고 Next.js reverse proxy가 Cloudflare를 거쳐 NestJS API로 요청했습니다. 서버 요청 차단은 BFF 서버의 고정 IP를 허용해 스테이징에서 복구했습니다.',
    nonDuplicationReason:
      '작업물의 UAT workflow는 행사 설정부터 예약·PG 테스트 결제까지의 업무 순서를 보여 줍니다. 이 시각 자료는 브라우저 Origin, Next.js 서버 중계와 Cloudflare 허용이라는 네트워크 경계만 비교합니다.'
  }
},
visual: {
  id: 'nextjs-nestjs-origin-boundary-before-after',
  variant: 'before-after',
  title: '브라우저 직접 호출과 reverse proxy 경계 비교',
  question: '브라우저 직접 호출에서 reverse proxy 경계로 바뀌며 쿠키와 Cloudflare 문제는 어떻게 분리됐는가?',
  textAlternative:
    '변경 전에는 A-domain.com의 브라우저가 api.A-domain.com을 직접 호출했고 인증 쿠키의 저장·전달 실패를 확인했습니다. 변경 후에는 브라우저가 A-domain.com의 /bff를 호출하고 Next.js reverse proxy가 Cloudflare를 거쳐 NestJS API로 요청했습니다. 서버 요청 차단은 BFF 서버의 고정 IP를 허용해 스테이징에서 복구했습니다.',
  panels: [
    {
      id: 'before',
      title: '브라우저의 API 직접 호출',
      summary: '같은 기본 도메인의 서로 다른 Origin을 직접 오가며 인증 쿠키 저장·전달 실패를 확인했습니다.',
      actors: [
        { id: 'before-browser', label: 'Browser · A-domain.com', role: 'source' },
        { id: 'before-api-origin', label: 'api.A-domain.com', role: 'server' },
        { id: 'before-nest-api', label: 'NestJS API', role: 'consumer' }
      ],
      connections: [
        {
          id: 'before-browser-api-origin',
          from: 'before-browser',
          to: 'before-api-origin',
          label: '직접 호출 · 쿠키 저장·전달 실패 확인',
          scope: 'direct'
        },
        {
          id: 'before-origin-nest-api',
          from: 'before-api-origin',
          to: 'before-nest-api',
          label: 'API 요청',
          scope: 'direct'
        }
      ]
    },
    {
      id: 'after',
      title: 'Next.js reverse proxy 이후',
      summary: '브라우저 Origin을 프론트엔드로 맞추고 서버 요청의 Cloudflare 허용 경계를 분리했습니다.',
      actors: [
        { id: 'after-browser', label: 'Browser', role: 'source' },
        { id: 'after-next-bff', label: 'A-domain.com · /bff', role: 'relay' },
        { id: 'after-cloudflare', label: 'Cloudflare', role: 'boundary' },
        { id: 'after-nest-api', label: 'NestJS API', role: 'consumer' }
      ],
      connections: [
        {
          id: 'after-browser-bff',
          from: 'after-browser',
          to: 'after-next-bff',
          label: '프론트 Origin으로 요청',
          scope: 'direct'
        },
        {
          id: 'after-bff-cloudflare',
          from: 'after-next-bff',
          to: 'after-cloudflare',
          label: '서버 요청 · 고정 IP 허용',
          scope: 'direct'
        },
        {
          id: 'after-cloudflare-nest-api',
          from: 'after-cloudflare',
          to: 'after-nest-api',
          label: '스테이징 통신 복구',
          scope: 'direct'
        }
      ]
    }
  ]
}
```

### 작업물과의 비중복 설명

- **Long-form**: 작업물은 예약 플랫폼 전체 구현 중 reverse proxy와 Cloudflare 대응을 한 단락으로 요약한다. 이 글은 쿠키 실패를 관찰한 호출 구조, reverse proxy로 바뀐 Origin, 그 뒤 드러난 Cloudflare 서버 요청 경계와 BFF 명칭의 적용 한계만 다룬다. Core Product·재고·결제 보상과 UAT 전체 흐름은 반복하지 않는다.
- **Visual**: 작업물 UAT workflow의 BFF lane은 예약 요청의 전달 순서만 표시한다. 이 글의 before/after는 브라우저/API Origin과 Cloudflare 신뢰 경계가 어떻게 달라졌는지를 비교하며, 작업물 관계도의 데이터 엔터티도 반복하지 않는다.

## 3. 구글과 네이버는 왜 비밀번호를 평문으로 보낼까? (개발자 도구의 착시와 HTTPS의 진실)

### 공개 메타데이터 제안

- `slug`: `https-and-plaintext-password-transmission`
- `title`: `구글과 네이버는 왜 비밀번호를 평문으로 보낼까? (개발자 도구의 착시와 HTTPS의 진실)`
- `excerpt`: `개발자 도구의 Request Payload를 네트워크 평문으로 오해해 비밀번호 전송용 클라이언트 암호화를 구현했다가 제거했습니다. 애플리케이션 Payload, TLS 전송과 서버 bcrypt 저장의 서로 다른 경계를 실제 경험 범위로 정리했습니다.`
- `readTime`: `5 min`
- `tags`: `['Security', 'HTTPS', 'Authentication', 'Frontend', 'Backend']`
- `featureSlug`: `integrated-reservation-platform`
- `editorial.type`: `project-case`

### 완성 content 초안

```markdown
## 개발자 도구에 보인 값을 네트워크 평문으로 오해했습니다

로그인 기능을 구현하면서 브라우저 개발자 도구의 Request Payload에 입력한 비밀번호가 그대로 보이는 것을 확인했습니다. 당시에는 이 화면이 실제 네트워크 구간에서도 같은 값이 노출된다는 뜻이라고 오해했습니다.

그 오해에서 출발해 비밀번호를 브라우저에서 한 번 암호화한 뒤 서버에서 복호화하는 로직을 직접 구현했습니다. 그러나 구현을 검토하면서 개발자 도구가 보여 주는 애플리케이션 내부의 요청 데이터와 HTTPS의 TLS가 보호하는 네트워크 전송 구간은 서로 다른 경계라는 점을 이해했습니다.

## 프론트엔드에 함께 배포되는 키는 비밀이 아니었습니다

비밀번호를 클라이언트에서 복호화 가능한 방식으로 암호화하려면 브라우저 코드에도 그 처리 로직과 키 정보가 포함됩니다. 이 프로젝트에서 시도한 구조에서는 사용자가 내려받는 프론트엔드 코드에서 키를 확인할 수 있어, 비밀번호 전송에 별도의 비밀 경계를 추가했다고 보기 어려웠습니다.

구글과 네이버의 로그인 요청도 개발자 도구에서 직접 확인했습니다. 두 서비스 역시 HTTPS 위에서 비밀번호를 별도의 클라이언트 암호화 없이 요청 본문에 담아 보냈습니다. 이 관찰은 외부 서비스의 전체 보안 구조를 분석했다는 뜻이 아니라, 개발자 도구에 Payload가 보이는 것과 네트워크 구간의 보호가 같은 문제가 아니라는 점을 확인한 계기였습니다.

## 비밀번호 전송용 암호화만 제거했습니다

이후 비밀번호 전송을 위해 추가했던 클라이언트 암호화를 제거했습니다. 서버에서는 전달받은 비밀번호를 bcrypt로 해시해 저장하는 구현을 사용했습니다. 전송 구간은 HTTPS, 저장 구간은 서버의 단방향 해시라는 서로 다른 책임으로 정리했습니다.

이 결정은 클라이언트 암호화를 모두 없앴다는 뜻이 아닙니다. 현재 코드에도 예약 임시 데이터와 이메일을 `sessionStorage`에 보관할 때 사용하는 AES 유틸리티가 남아 있습니다. 제거 범위는 비밀번호 전송을 위해 별도로 추가했던 로직으로 한정합니다.

## 보이지 않게 만드는 것과 보호하는 것을 구분합니다

현재의 판단은 개발자 도구에서 값이 보이는지보다 데이터가 어느 경계를 지날 때 어떤 보호를 받는지 먼저 확인해야 한다는 것입니다. 이 프로젝트에서는 HTTPS가 적용된 전송 구간과 서버 bcrypt 저장을 기준으로 삼았고, 브라우저에 함께 배포되는 키로 비밀번호를 한 번 더 감싸는 방식은 유지하지 않았습니다.

다만 이 경험만으로 모든 애플리케이션 계층 암호화가 불필요하다고 일반화하지 않습니다. 여기서 확인하고 제거한 것은 브라우저에 키가 함께 배포되던 비밀번호 전송용 추가 암호화입니다. 과거 구현 이력은 사용자 경험에 근거한 보고값이며 현재 저장소에서는 제거 전 커밋을 다시 확인하지 못했습니다.
```

### 공개 editorial/visual 데이터 제안

```ts
editorial: {
  type: 'project-case',
  visualAssessment: {
    decision: 'not-needed',
    rationale:
      '개발자 도구의 애플리케이션 Payload, HTTPS의 TLS 전송과 서버 bcrypt 저장은 짧은 순서형 문장으로 경계를 충분히 설명할 수 있습니다. 별도 보안 다이어그램은 이 프로젝트에서 검증하지 않은 공격 방어 범위까지 시각적으로 강화하거나 정당화할 수 있어 추가하지 않습니다.'
  }
}
```

`visual` 데이터는 두지 않는다. 빈 시각 영역이나 준비 중 placeholder도 만들지 않는다.

### 작업물과의 비중복 설명

- **Long-form**: 작업물은 관리자 인증의 당시 책임과 현재 Guard 회고만 요약한다. 이 글은 비밀번호 전송용 클라이언트 암호화를 구현·제거한 경험, DevTools Payload와 TLS, 서버 bcrypt 저장, 남아 있는 예약 임시 데이터용 AES의 범위만 다룬다. 예약·결제·재고·UAT 내용은 반복하지 않는다.
- **Visual**: 이 글에는 시각 자료가 없다. 작업물의 workflow와 관계도는 각각 업무 순서와 상품 데이터 관계를 설명하므로 HTTPS 전송·저장 경계를 대신하거나 중복하지 않는다.

## 근거와 공개 문구 처분 매트릭스

| 대상 | 주장 또는 기존 문구 | 근거와 등급 | 시간·범위 경계 | 처분 |
| --- | --- | --- | --- | --- |
| Middleware | `AdminAuthMiddleware`가 토큰·쿠키·CSRF 확인, 갱신과 `req.user` 주입을 담당 | 승인 인터뷰 + Feature 015 코드 확인값 | 2025.12–2026.03 구현 | **Accept** — 위 초안에 한정해 사용 |
| Middleware | `AdminLevelGuard`가 관리자 등급을 확인 | 승인 인터뷰 + Feature 015 코드 확인값 | 당시 구현 | **Accept** |
| Middleware | Express 경험에서 Middleware를 먼저 선택 | 승인 인터뷰, 사용자 보고값 | 당시 선택 배경 | **Accept** |
| Middleware | 현재 Global Auth Guard 기본 적용 + 공개 경로 제외 + 별도 권한 Guard 선호 | 승인 인터뷰, 현재 회고 | 이 프로젝트에서 재구현·운영 검증하지 않음 | **Accept** — 현재 판단으로 표시 |
| Middleware | Middleware가 Guard보다 더 견고하고 선언 누락을 제거 | 승인 인터뷰와 충돌 | 검증 근거 없음 | **Reject** — 삭제 |
| BFF | `A-domain.com`과 `api.A-domain.com` 직접 호출에서 쿠키 저장·전달 실패 확인 | 승인 인터뷰, 직접 관찰 사용자 보고값 | 같은 기본 도메인의 서로 다른 Origin, 개발·스테이징 단계 | **Accept** |
| BFF | 실패의 정확한 브라우저 정책·설정 원인 | 원인 분리 기록 없음 | 네트워크 캡처와 당시 브라우저 설정 필요 | **Defer** — 공개 원인 단정 없이 관찰만 사용 |
| BFF | Next.js `/bff` rewrite로 브라우저 Origin을 프론트엔드에 맞춤 | 승인 인터뷰 + Feature 015 코드 확인값 | 당시 구현 | **Accept** |
| BFF | Cloudflare 봇 차단 원인 확인 후 BFF 서버 고정 IP 허용으로 통신 복구 | 승인 인터뷰, 사용자 보고값 | 고객사 스테이징 범위 | **Accept** — 실제 IP·설정값 제외 |
| BFF | 응답 조합·가공·전용 권한·검증된 성능까지 포함한 완성형 BFF | 승인 인터뷰와 충돌 | 구현 근거 없음 | **Reject** — reverse proxy 경계로 축소 |
| BFF | 다른 최상위 도메인, 대기업 일반화, rewrite 스트리밍·내부망 성능 개선 | 승인 인터뷰와 충돌 또는 근거 없음 | 실제 프로젝트 범위 밖 | **Reject** — 삭제 |
| HTTPS | DevTools Payload를 네트워크 평문으로 오해해 비밀번호 클라이언트 암호화를 구현·제거 | 승인 인터뷰, 사용자 보고값 | 과거 구현 커밋은 현재 `dev`에서 미확인 | **Accept** — 사용자 경험 및 확인 한계 표시 |
| HTTPS | 프론트엔드 복호화 키 노출로 추가 비밀 경계의 실효성이 낮다고 판단 | 승인 인터뷰, 사용자 보고값 | 당시 비밀번호 전송 구현 | **Accept** |
| HTTPS | 구글·네이버의 HTTPS 로그인 요청을 직접 확인 | 승인 인터뷰, 직접 관찰 사용자 보고값 | 당시 개발자 도구 관찰; 외부 서비스 전체 구조 분석 아님 | **Accept** |
| HTTPS | 서버 bcrypt 저장 | Feature 015 코드 확인값 | 현재 확인된 구현 | **Accept** |
| HTTPS | 모든 클라이언트 암호화를 폐기 | 현재 예약 임시 데이터·이메일용 AES와 충돌 | 비밀번호 전송 외 범위 | **Reject** — 비밀번호 전송용 제거로 축소 |
| 공통 | 운영 안전성·운영 성능·운영 장애 해결 | 프로젝트 비운영, 근거 없음 | 고객사 스테이징·PG 테스트까지만 검증 | **Reject** |

## Project-case 의미 재검토 매트릭스

### `nestjs-middleware-vs-guard-tradeoff`

| Row | 판정과 근거 |
| --- | --- |
| Role and responsibility | **supported** — 사용자가 1인 백엔드로 관리자 인증을 포함한 백엔드 전반을 설계·구현했다는 인터뷰 |
| Problem and time | **supported** — 2025.12–2026.03 구현 중 Express 경험에서 익숙한 Middleware를 먼저 선택한 배경 |
| Constraints and criteria | **supported** — NestJS 대안을 충분히 비교하지 않았다는 한계를 기준으로 공개하며 사후 합리화를 금지 |
| Considered alternatives | **N/A** — 당시 Global Guard와 Middleware를 체계적으로 비교했다는 기록이 없으므로 대안 비교로 만들지 않음 |
| Selection and implementation | **supported** — `AdminAuthMiddleware`의 인증·쿠키·CSRF·`req.user` 책임과 `AdminLevelGuard`의 등급 책임 |
| Outcome evidence | **supported** — 코드에 구현된 책임 분리까지만 결과로 사용; UAT를 인증 구조의 운영 검증으로 확대하지 않음 |
| Limits and retrospective | **supported** — Global Auth Guard 기본 적용은 현재 개선 판단이며 프로젝트에서 재구현·운영 검증하지 않았음을 명시 |
| Project origin | **supported** — `integrated-reservation-platform`과 정확히 1개의 origin 관계를 사용; 공개 양방향 이동은 구현 후 검증 필요 |

### `nextjs-nestjs-domain-separation-and-bff`

| Row | 판정과 근거 |
| --- | --- |
| Role and responsibility | **supported** — 사용자가 1인 백엔드·PM/PL로 인증, API와 배포 환경을 담당했다는 인터뷰 |
| Problem and time | **supported** — 브라우저 직접 API 호출 중 쿠키 저장·전달 실패를 실제 확인한 당시 경험 |
| Constraints and criteria | **supported** — 같은 기본 도메인의 다른 Origin, 인증 쿠키·CSRF 요청, Cloudflare 경계와 스테이징 검증 한계 |
| Considered alternatives | **N/A** — 당시 별도 대안을 체계적으로 비교한 기록이 없고 직접 호출→proxy는 관찰과 구현 순서로만 기록 |
| Selection and implementation | **supported** — Next.js `/bff` rewrite와 Cloudflare 고정 IP 허용 대응; 완성형 BFF 기능은 제외 |
| Outcome evidence | **supported** — 사용자 보고에 따른 스테이징 통신·인증 복구 범위; 운영·성능 결과 없음 |
| Limits and retrospective | **supported** — 정확한 쿠키 실패 원인을 단정하지 않고 BFF 이름보다 구현 책임을 명시한다는 현재 판단 |
| Project origin | **supported** — `integrated-reservation-platform`과 정확히 1개의 origin 관계; legacy BFF slug는 canonical 내부 redirect 대상 |

### `https-and-plaintext-password-transmission`

| Row | 판정과 근거 |
| --- | --- |
| Role and responsibility | **supported** — 사용자가 로그인과 관리자 인증을 포함한 백엔드 구현을 담당하고 클라이언트 암호화도 직접 구현·제거했다는 인터뷰 |
| Problem and time | **supported** — 구현 당시 DevTools Request Payload를 네트워크 평문으로 오해한 경험 |
| Constraints and criteria | **supported** — TLS 전송 경계, 브라우저에 포함되는 키, 서버 bcrypt 저장과 남아 있는 예약 임시 데이터용 AES 범위 |
| Considered alternatives | **supported** — 실제로 구현한 비밀번호 클라이언트 암호화와 HTTPS 전송·서버 해시 책임을 비교; 다른 알고리즘 대안은 추가하지 않음 |
| Selection and implementation | **supported** — 비밀번호 전송용 추가 암호화 제거는 사용자 보고값, bcrypt 저장과 현재 AES 유틸리티는 코드 확인값으로 분리 |
| Outcome evidence | **supported** — 제거 범위와 현재 코드 상태까지만 사용; 보안 사고 감소나 공격 방어 성과를 주장하지 않음 |
| Limits and retrospective | **supported** — 모든 애플리케이션 암호화가 불필요하다고 일반화하지 않고 제거 전 커밋 미확인을 명시 |
| Project origin | **supported** — `integrated-reservation-platform`과 정확히 1개의 origin 관계를 사용; 공개 양방향 이동은 구현 후 검증 필요 |

## 시각 자료 필요성 인벤토리

### 공통 원본 작업물 판정

**Visual decision: provided —** 원본 작업물은 고객사 UAT의 시간 순서를 보여 주는 workflow와 Core Product 데이터 관계를 보여 주는 architecture를 제공한다. 두 자료는 프로젝트 전체 맥락을 설명하며 각 인사이트의 요청 생명주기·네트워크 경계 질문을 대신하지 않는다.

**Existing visual disposition:** retain existing UAT workflow and Core Product relationship architecture.

### Middleware·Guard 인사이트

| Inventory row | 관계 | 근거 판정 |
| --- | --- | --- |
| Actors and components | present | **supported** — 요청, 인증 Middleware/Guard, 권한 Guard와 Controller의 책임 경계 |
| Parallel paths | absent | **N/A** — 병렬 실행이 질문이 아니며 근거도 없음 |
| Failure paths | absent | **N/A** — 실패 분기나 오류 결과를 시각화할 근거가 없음 |
| Retry paths | absent | **N/A** — 재시도 구현을 다루지 않음 |
| Recovery paths | absent | **N/A** — 장애 복구 흐름을 다루지 않음 |
| Data relationships | absent | **N/A** — 엔터티·저장 관계가 질문이 아님 |
| Alternatives | absent | **supported** — 당시 체계적 대안 비교가 없으므로 before/after를 당시 대안 비교로 표현하지 않음 |
| Time evolution | present | **supported** — 당시 구현과 현재 개선 판단의 두 단계 |
| Existing source visual | present | **supported** — 원본 UAT workflow와 Core Product 관계도는 각각 업무 순서와 데이터 관계이며 이 글과 질문이 다름 |

**Visual decision: provided —** 인증과 권한 책임의 위치가 네 구성 요소를 지나며 당시/현재 두 단계로 달라지므로 before/after architecture가 문장보다 비교를 명확하게 만든다.

**Existing visual disposition:** no existing insight visual; provide the approved before/after only after content approval.

### BFF 인사이트

| Inventory row | 관계 | 근거 판정 |
| --- | --- | --- |
| Actors and components | present | **supported** — Browser, Next.js reverse proxy, Cloudflare와 NestJS API 경계 |
| Parallel paths | absent | **N/A** — 직접 호출과 proxy는 시간에 따른 전후 구조이지 병렬 운영 경로로 확인되지 않음 |
| Failure paths | present | **supported** — 쿠키 저장·전달 실패와 Cloudflare 서버 요청 차단 |
| Retry paths | absent | **N/A** — 재시도 정책을 구현·검증했다는 근거가 없음 |
| Recovery paths | present | **supported** — 고정 IP 허용 뒤 스테이징 통신·인증 복구 사용자 보고값 |
| Data relationships | absent | **N/A** — 데이터 엔터티와 cardinality가 질문이 아님 |
| Alternatives | absent | **supported** — 당시 체계적 대안 비교가 없으므로 직접 호출과 proxy를 평가표로 만들지 않음 |
| Time evolution | present | **supported** — 브라우저 직접 호출에서 reverse proxy와 Cloudflare 허용 경계로 바뀐 순서 |
| Existing source visual | present | **supported** — 작업물 UAT workflow의 BFF lane은 업무 전달 순서만 다루며 Origin 전후 비교가 아님 |

**Visual decision: provided —** 네트워크 요청 주체와 신뢰 경계가 세 개 이상의 구성 요소에서 달라지고 실패·복구 위치도 나뉘므로 before/after architecture를 제공한다.

**Existing visual disposition:** no existing canonical insight visual; replace the two existing text-only BFF narratives with one canonical before/after only after content approval.

### HTTPS 인사이트

| Inventory row | 관계 | 근거 판정 |
| --- | --- | --- |
| Actors and components | present | **supported** — 브라우저 애플리케이션, TLS 전송과 서버 저장의 세 경계는 본문에 존재 |
| Parallel paths | absent | **N/A** — 병렬 경로가 없음 |
| Failure paths | absent | **N/A** — 공격이나 전송 실패를 재현·검증한 글이 아님 |
| Retry paths | absent | **N/A** — 재시도 흐름 없음 |
| Recovery paths | absent | **N/A** — 복구 흐름 없음 |
| Data relationships | absent | **N/A** — 엔터티 관계가 질문이 아님 |
| Alternatives | present | **supported** — 실제로 구현한 추가 클라이언트 암호화와 HTTPS·서버 해시 책임을 비교 |
| Time evolution | present | **supported** — 오해, 구현, 제거와 현재 범위 확인의 순서 |
| Existing source visual | present | **supported** — 원본 작업물의 workflow·관계도는 비밀번호 전송 경계를 다루지 않음 |

**Visual decision: not-needed —** 애플리케이션 Payload, TLS 전송과 서버 bcrypt 저장은 짧은 순서형 문장으로 충분하다. 공격·방어 architecture를 그리거나 추천하면 이 프로젝트에서 검증하지 않은 보안 효과까지 시각적으로 강화하거나 정당화할 수 있으므로 추가하지 않는다.

**Existing visual disposition:** no existing insight visual; keep the article text-only.

## 공개 검증 매트릭스 — 구현·production 검증 완료

2026-09-15 사용자 승인 원고를 공개 데이터에 반영한 뒤 production build와 별도 12117 서버에서 아래 행을 확인했다. `supported`는 실제 route·DOM·키보드·viewport 검증 또는 고정된 편집 계약으로 확인한 항목이며, `N/A`는 의도적으로 제공하지 않는 기능이다.

| Row | Middleware | BFF canonical + alias | HTTPS |
| --- | --- | --- | --- |
| Route response | **supported** — `/insights/nestjs-middleware-vs-guard-tradeoff`가 승인 제목·본문으로 200 응답 | **supported** — canonical이 200 응답하고 `/insights/enterprise-bff-architecture-and-cors`는 canonical 상대 경로로 308 응답 | **supported** — `/insights/https-and-plaintext-password-transmission`이 승인 제목·본문으로 200 응답 |
| Public list entry | **supported** — `/insights`에 canonical 제목 1건 노출 | **supported** — canonical 제목만 1건 노출되고 alias href는 0건 | **supported** — `/insights`에 canonical 제목 1건 노출 |
| Source to insight | **supported** — 통합 예약 작업물에서 canonical 제목 링크로 진입 | **supported** — 작업물에는 canonical href만 노출 | **supported** — 통합 예약 작업물에서 canonical 제목 링크로 진입 |
| Insight to source | **supported** — `연관된 기록`의 `행사 호텔 예약·결제 통합 플랫폼` 링크로 복귀 | **supported** — canonical 및 alias 진입 후 같은 작업물 링크로 복귀 | **supported** — `연관된 기록`의 같은 작업물 링크로 복귀 |
| Semantic link names | **supported** — 글 링크 이름은 `NestJS 인증은 Middleware와 Guard 중 하나를 고르는 문제가 아니었다`, visual trigger는 `관리자 요청의 인증·권한 책임 비교 크게 보기` | **supported** — 글 링크 이름은 `[Next.js x NestJS] 프론트엔드와 백엔드의 도메인 분리와 BFF 설계`, visual trigger는 `브라우저 직접 호출과 reverse proxy 경계 비교 크게 보기`; alias는 목록 링크 없이 canonical 제목으로 도착 | **supported** — 글 링크 이름은 `구글과 네이버는 왜 비밀번호를 평문으로 보낼까? (개발자 도구의 착시와 HTTPS의 진실)`, 복귀 링크는 작업물 제목 |
| Keyboard focus and activation | **supported** — 작업물↔글 링크를 Enter로 왕복하고 Dialog를 Enter/Space로 연 뒤 Escape 시 trigger focus 복귀 | **supported** — canonical 양방향 링크와 확대 Dialog의 Enter/Space·Escape·focus 복귀 확인; alias는 HTTP 308 뒤 canonical focus 순서 사용 | **supported** — 양방향 링크의 focus·Enter 왕복 확인; visual trigger는 **N/A** |
| Responsive widths | **supported** — 320/768/1024/1440px에서 본문·preview·Dialog, actor/connection과 document overflow 확인 | **supported** — 네 폭에서 본문·preview·Dialog, actor/connection과 document overflow 확인 | **supported** — 네 폭에서 본문과 document overflow를 확인하고 visual·빈 placeholder가 없음을 확인 |
| Long-form duplication | **supported** — 작업물은 예약·결제 UAT, 글은 인증·권한 책임 비교만 다루도록 최종 대조 | **supported** — 작업물은 업무 흐름, 글은 Origin·proxy·Cloudflare 경계만 다루며 중복 SeedInsight 제거 확인 | **supported** — 작업물과 달리 Payload·TLS·bcrypt 경계만 다루며 장문 반복 0건 확인 |
| Visual duplication | **supported** — 작업물 workflow·관계도와 다른 `관리자 요청 인증·권한 책임` 질문의 before/after 1건 | **supported** — 작업물 두 visual과 다른 `브라우저 Origin·서버 중계·Cloudflare` 질문의 before/after 1건 | **N/A** — `not-needed` 결정대로 visual과 빈 placeholder 모두 0건 |

## 승인 결과

사용자는 2026-09-15에 다음 범위를 한 번에 검토하고 공개 적용을 승인했다.

1. 세 글의 제목·excerpt·본문 전체와 readTime/tags
2. Middleware·Guard 및 BFF before/after의 질문, 패널 문구와 텍스트 대안
3. HTTPS 시각 자료 `not-needed` 판단과 텍스트 전용 구성
4. 당시 사실과 현재 회고의 공개 강도
5. 세 글이 작업물 전체 설명을 반복하지 않는 분리 방식

이 승인과 공개 검증 매트릭스를 Feature 015의 콘텐츠 정본으로 사용한다.
