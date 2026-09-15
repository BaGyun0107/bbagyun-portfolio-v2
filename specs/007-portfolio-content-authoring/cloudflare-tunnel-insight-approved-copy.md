# Cloudflare Tunnel 인사이트 승인 문안

**Content approval**: granted on 2026-08-27

## Title

Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다

## Excerpt

GitHub Actions에서 사내 서버로 배포하기 위해 Cloudflare Tunnel을 도입했지만,
WAF 차단과 같은 hostname의 connector 혼선을 겪었습니다. 실패 단계를 직접 분리해
확인한 뒤, 공용 진입점과 서버별 권한을 나눈 Bastion 구조로 발전시킨 기록입니다.

## Content

## 22번 포트를 열지 않는 것만으로는 충분하지 않았다

사내 하네스의 PM2·Docker 배포에서 Cloudflare Tunnel 기반 접근 경로와 Bastion
구조를 직접 설계하고 구현했습니다.

GitHub Actions에서 사내 서버로 바로 SSH 연결하려면 두 가지 부담이 있었습니다.
인바운드 22번 포트를 외부에 넓게 열거나, GitHub Actions runner의 IP 허용 범위를
계속 확인해 방화벽에 반영해야 했습니다.

당시 비교한 대안은 direct SSH와 Cloudflare Tunnel이었습니다. Self-hosted GitHub
Actions runner까지 검토한 것은 아니었습니다.

사내 서버처럼 GitHub Actions가 배포를 위해 접근해야 하지만 외부 인바운드 22번
포트를 열고 싶지 않은 경우에는 Cloudflare Tunnel을 사용하는 편이 낫다고
판단했습니다. 반면 Vercel처럼 배포 접근을 관리형 플랫폼이 담당하는 환경에는 이
구조가 필요하지 않습니다.

다만 Tunnel을 연결하는 것만으로 안전한 배포 경로가 완성되는 것은 아니었습니다.
외부에서 Bastion까지 들어오는 인증과, Bastion 이후 어느 서버에 접근할 수 있는지는
별도의 경계로 설계해야 했습니다.

## 이벤트 로그로 WAF 차단을 확인했다

2026년 4월 초기 구성에서 로컬 연결은 가능했지만 GitHub Actions workflow는
Cloudflare 접근 단계에서 실패했습니다.

오류 메시지만으로 원인을 단정하지 않고 Cloudflare 이벤트 로그를 확인했습니다.
해당 GitHub Actions 요청이 WAF에서 차단된 기록을 찾았고, 배포용 hostname에 예외를
적용한 뒤 같은 workflow를 다시 실행했습니다. 이전에 막히던 Cloudflare 접근 단계가
통과하는 것을 직접 비교해 확인했습니다.

현재 WAF 예외는 Bastion hostname을 조건으로 이후 WAF 규칙을 건너뜁니다. WAF 규칙
자체가 Service Token까지 검사하는 구조는 아닙니다. WAF 예외를 통과한 뒤 Cloudflare
Access의 Service Token 인증과 SSH 인증 계층이 실제 접근을 제한합니다.

이 경험을 통해 제품 내부 동작을 먼저 추측하기보다, 이벤트 로그와 workflow 재실행
결과를 대조해 어느 단계에서 요청이 막혔는지 분리해야 한다는 기준을 세웠습니다.

## 같은 hostname의 connector가 배포 대상을 흐렸다

WAF 문제를 해결한 뒤에는 배포 대상을 특정하는 문제가 남았습니다.

초기에는 같은 hostname을 서로 다른 서버의 Tunnel connector에 연결했습니다. 이
상태에서 요청이 의도하지 않은 connector 또는 서버 방향으로 전달되면서 SSH 연결
단계에서 실패했습니다.

실제 파일 전송이나 배포 명령 실행 전의 실패였기 때문에 잘못된 서버에 서비스가
배포되지는 않았습니다. 또한 Cloudflare가 내부에서 어떤 알고리즘으로 connector를
선택했는지는 직접 확인하지 못했으므로 특정 라우팅 방식으로 단정하지 않습니다.

당시에는 배포 대상별로 hostname을 분리했습니다. 같은 workflow를 다시 실행해 의도한
서버로 연결되고 배포가 정상 완료되는 것을 확인했습니다.

## 대상별 hostname은 해결책이면서 다음 운영 부담이 됐다

배포 대상별 hostname 분리는 어느 요청이 어느 서버로 가는지 명시적으로 구분할 수
있는 해결책이었습니다.

하지만 서버가 늘어날 때마다 Tunnel connector, hostname, Access Application과 WAF
예외도 함께 관리해야 했습니다. 개별 서버의 연결 문제는 해결했지만, 배포 대상이
늘수록 Cloudflare 설정도 반복되는 구조가 됐습니다.

그래서 2026년 5월경 Cloudflare 진입점은 공용으로 재사용하고, 실제 배포 대상은
Bastion 이후에 명시적으로 선택하는 구조로 변경했습니다.

## 공용 진입점과 내부 대상 권한을 분리했다

현재 배포 흐름은 다음과 같습니다.

```text
2026년 4월 초기 구성

GitHub Actions
    ├─ Cloudflare WAF 차단
    │      └─ 이벤트 로그 확인
    │             └─ hostname 예외 적용 후 접근 단계 통과
    │
    └─ 같은 hostname
           ├─ connector A
           └─ connector B
                  └─ 의도하지 않은 방향으로 연결
                         └─ SSH 단계 실패
                                └─ 실제 배포 없음


2026년 5월 이후

GitHub Actions
    │
    ├─ Bastion hostname WAF 예외
    │
    ├─ Cloudflare Access
    │      └─ Service Token 인증
    │
    ├─ Cloudflare Tunnel
    │
    └─ Bastion
           ├─ 배포 전용 사용자 shell 실행 차단
           ├─ SSH 키 인증
           └─ PermitOpen 대상 제한
                  │
                  └─ ProxyJump
                         └─ 배포 서버
                                └─ 프로젝트 × 배포 서버별 SSH 키 인증
```

GitHub Actions의 `ProxyCommand`는 Cloudflare Access를 거쳐 Bastion에 연결합니다.
이후 `ProxyJump`가 실제 배포 서버로 연결하며, Bastion의 `PermitOpen`은 접근할 수
있는 서버와 포트를 제한합니다.

공용으로 재사용하는 것과 대상별로 분리하는 것은 다음처럼 구분했습니다.

| 구분 | 관리 범위 |
| --- | --- |
| 공용 진입점 | Cloudflare Tunnel, Bastion, hostname, Access Application, WAF 예외 |
| Bastion 접근 | Service Token과 Bastion SSH 인증 |
| 내부 대상 제한 | 배포 서버별 `PermitOpen` |
| 최종 서버 인증 | 프로젝트×배포 서버별 SSH 키 |
| 프로젝트 설정 | 배포 대상과 환경에 맞는 Infisical 경로 |

Tunnel과 Bastion을 프로젝트마다 새로 만들지 않고 공용으로 재사용하되, 한 프로젝트의
SSH 키가 다른 서버의 배포 권한으로 이어지지 않도록 최종 권한은 프로젝트와 배포 서버
조합별로 분리했습니다.

## 9개 프로젝트를 5대 서버에 배포하고 있다

2026-08-27 기준 9개 프로젝트가 하나의 Bastion을 경유해 5대 서버로 배포됩니다.
하나의 서버에 여러 서비스가 배포되는 경우가 있어 프로젝트 수와 서버 수는 다릅니다.

Bastion 구조로 전환한 뒤 현재까지 요청이 의도하지 않은 connector 또는 서버 방향으로
연결되는 동일 유형 문제는 다시 발견하지 못했습니다.

이는 운영 과정에서 확인한 사용자 보고값과 관찰 범위입니다. 시스템 전체의 장애율을
집계한 결과나 Cloudflare Tunnel의 보안·가용성을 보장하는 수치는 아닙니다.

## Bastion도 새로운 운영 경계가 됐다

Cloudflare 설정을 공용 진입점으로 줄였지만 Bastion 자체가 9개 프로젝트의 배포
가용성 경계가 됐습니다.

Bastion이 중단되면 연결된 프로젝트의 새 배포가 함께 막힙니다. 실행 중인 서비스는
Bastion과 런타임 통신을 하지 않지만, 실제 Bastion 중단이나 장애 상황을 테스트해
확인한 결과는 아닙니다. 현재 구조를 근거로 판단한 영향 범위입니다.

보안 운영 부담도 남아 있습니다. Bastion hostname은 WAF의 이후 규칙을 건너뛰므로
Cloudflare Access Token, Bastion SSH 인증, `PermitOpen`과 서버별 SSH 키 경계를
계속 정확하게 관리해야 합니다.

현재 가장 먼저 개선하고 싶은 부분은 새 프로젝트와 서버가 추가될 때 반복되는
`PermitOpen`, 공개키 등록과 Infisical 경로 연결을 자동화하는 것입니다. 그다음
Bastion 이중화, 대체 배포 경로와 실제 복구 절차를 검증하려고 합니다.

아직 구현하지 않은 자동화와 가용성 개선을 현재 성과로 기록하지는 않습니다. 이번
경험에서 얻은 기준은 Tunnel이라는 도구를 도입하는 데서 멈추지 않고, 외부 진입
인증과 내부 배포 대상 권한을 각각 설계하고 운영해야 한다는 점입니다.
