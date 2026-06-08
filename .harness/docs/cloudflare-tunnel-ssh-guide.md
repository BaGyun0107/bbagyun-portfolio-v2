# Cloudflare Tunnel + Bastion SSH 배포 가이드

22포트 인바운드를 전역 개방하지 않고, **Cloudflare Tunnel 1개 + Bastion 서버 1대**로 다수의 배포 서버에 SSH 배포하는 구조.

이 구성은 선택 사항이다. PM2/Docker 워크플로우는 기본적으로 direct SSH를 사용하며,
PM2/Docker workflow env에 `USE_CLOUDFLARE_TUNNEL: "true"`를 설정한 프로젝트만 이
가이드를 따른다. Cloudflare Access credentials는 계속 Shared-Secrets에서 가져오지만,
터널 사용 여부 boolean은 Infisical secret으로 관리하지 않는다.

## 아키텍처

```
GitHub Actions
   │ ① cloudflared access ssh (Cloudflare Access Service Token)
   ▼
Cloudflare Edge → Tunnel
   │
   ▼
[Bastion 서버: vpn-1-ga-1.hipasshub.com:9806]
   │ ② sshd 키 인증 (deploy 사용자, 셸 차단/ProxyJump 전용)
   │
   │ ③ ProxyJump (TCP 포워딩만)
   ▼
[배포 서버 A: 133.186.216.12:22]   ← rocky 사용자
[배포 서버 B: 10.x.x.x:22]          ← rocky 사용자
[배포 서버 C: ...]
```

3중 보호:

1. **Cloudflare Access Service Token** — 토큰 없으면 터널 접근 자체 차단
2. **Bastion sshd 키 인증** — 터널 통과해도 bastion `deploy` 사용자 키 없으면 차단
3. **배포 서버 sshd 키 인증** — bastion 통과해도 배포 서버에 키 없으면 차단

## 핵심 설계 원칙

- **Tunnel은 도메인당 bastion 1개** — 프로젝트/배포 서버마다 새로 만들지 않는다
- **Service Token도 도메인당 1개** — `Shared-Secrets/cloudflare/{domain}/{subdomain}`에 한 번만 저장
- **bastion의 `deploy` 사용자는 셸 차단** — `usermod -s /usr/sbin/nologin` 로 SSH 셸을 막고 ProxyJump(TCP 포워딩) 만 허용
- **bastion에는 점프용 키를 두지 않는다** — ProxyJump는 클라이언트 키를 그대로 들고 다음 서버에서 다시 인증한다
- **SSH 키는 "프로젝트 × 배포 서버" 조합당 1개** (★ 권장) — 키 노출 시 영향 범위를 그 서버 1대로 한정. 키 회전 시 모든 서버를 갱신할 필요 없이 해당 서버 1대의 `authorized_keys`만 교체하면 됨
- **배포 서버 추가 시 Cloudflare 설정은 변경 없음** — bastion sshd config의 `PermitOpen`에 한 줄 + 새 키 페어 발급 + 배포 서버 authorized_keys에 새 공개키 + bastion authorized_keys에 새 공개키 추가

## 리소스 관계도

```
Infisical
├── Shared-Secrets/cloudflare/hipasshub-com/vpn-1-ga-1-token
│     ├── CF_ACCESS_CLIENT_ID                ← 도메인당 1개
│     └── CF_ACCESS_CLIENT_SECRET            ← 도메인당 1개
│
└── 프로젝트별 /backend/github-actions, /frontend/github-actions
      ├── BACK_SSH_TUNNEL_HOST   = vpn-1-ga-1.hipasshub.com   ← bastion hostname (공통)
      ├── BACK_BASTION_USER      = deploy                     ← bastion 사용자 (공통)
      ├── BACK_BASTION_PORT      = 9806                       ← bastion sshd 포트 (공통)
      ├── BACK_TARGET_HOST       = 133.186.216.12             ← 환경별 배포 서버 IP (dev/prod 다른 값 가능)
      ├── BACK_TARGET_PORT       = 22                         ← 배포 서버 포트
      ├── BACK_SERVER_USER       = rocky                      ← 배포 서버 사용자
      ├── BACK_SSH_PRIVATE_KEY   = (프로젝트 × 배포서버 키)   ← 환경별로 다른 값 (dev 키 ≠ prod 키)
      └── BACK_DEPLOY_DIR, BACK_APP_NAME, BACK_TAR_FILE 등

   ※ Infisical은 dev/prod 환경별로 같은 키 이름에 다른 값을 저장한다.
     codi-live-view-dev 서버용 키는 dev 환경에, codi-live-view-prod 서버용 키는 prod 환경에 각각 저장.

Cloudflare Zero Trust (hipasshub.com 도메인)
├── Service Token: vpn-1-ga-1-token                    ← 도메인당 1개
│
├── Tunnel: GITHUB_ACTIONS_1                            ← bastion당 1개
│     └── Public Hostname: vpn-1-ga-1.hipasshub.com → ssh://localhost:9806
│
├── Access Application: vpn-1-ga-1.hipasshub.com        ← bastion당 1개
│     └── 정책: Service Auth → Service Token
│
└── WAF 예외: vpn-1-ga-1.hipasshub.com                  ← bastion당 1개

Bastion 서버 (vpn-1-ga-1.hipasshub.com 자체)
├── /etc/ssh/sshd_config.d/50-deploy.conf
│     └── Match User deploy: PermitOpen 133.186.216.12:22 10.x.x.x:22 ...
│         (배포 서버 추가 시 여기에 한 줄씩 추가)
│
└── /home/deploy/.ssh/authorized_keys     ← 모든 (프로젝트 × 배포서버) 공개키가 누적됨
      ├── # project: codi-live-view, target: dev (133.186.216.12)
      ├── ssh-ed25519 AAAA... liveview-dev-deploy
      ├── # project: codi-live-view, target: prod (133.186.216.13)
      ├── ssh-ed25519 AAAA... liveview-prod-deploy
      ├── # project: 다른프로젝트, target: dev
      └── ssh-ed25519 AAAA... ...

배포 서버 N대 (각각 독립)
└── /home/rocky/.ssh/authorized_keys      ← 그 서버를 가리키는 공개키만 등록
      └── 해당 (프로젝트 × 이 서버) 조합의 공개키 1개
```

## 리소스별 재사용 범위

| 리소스                        | 범위                        | 새 프로젝트 추가 시      | 새 배포 서버 추가 시 (기존 프로젝트) | 저장 위치                                             |
| ----------------------------- | --------------------------- | ------------------------ | ------------------------------------ | ----------------------------------------------------- |
| **Service Token**             | 도메인당 1개                | 재사용                   | 재사용                               | `Shared-Secrets/cloudflare/{domain}/{subdomain}`      |
| **Tunnel**                    | bastion당 1개               | 재사용                   | 재사용                               | Cloudflare 대시보드                                   |
| **Access Application**        | bastion당 1개               | 재사용                   | 재사용                               | Cloudflare 대시보드                                   |
| **WAF 예외 규칙**             | bastion당 1개               | 재사용                   | 재사용                               | Cloudflare 대시보드                                   |
| **bastion sshd config**       | bastion당 1개               | (변경 없음)              | `PermitOpen`에 한 줄 추가            | `/etc/ssh/sshd_config.d/50-deploy.conf`               |
| **bastion authorized_keys**   | bastion당 1개               | (서버 N대 → 키 N줄 추가) | 새 키 한 줄 추가                     | `/home/deploy/.ssh/authorized_keys`                   |
| **배포 서버 authorized_keys** | 배포 서버당 1개             | 그 서버용 키 1줄 추가    | 새로 생성 + 그 서버용 키 1줄         | 배포 서버의 `/home/rocky/.ssh/authorized_keys`        |
| **SSH 키 페어**               | **프로젝트 × 배포서버 1개** | 서버 N대마다 N개 발급    | 새 키 1개 발급                       | 프로젝트별 Infisical (`{BACK,FRONT}_SSH_PRIVATE_KEY`) |

## 시나리오별 가이드

### 시나리오 A: 기존 bastion + 기존 배포 서버에 새 프로젝트 추가

**가장 흔한 케이스**. Cloudflare 설정도, 서버 셋업도 변경 없음. **배포 서버 N대를 사용하면 키 페어도 N개 발급**한다 (서버별 키 분리 원칙).

#### 키 페어 명명 규칙

`{project}-{environment}-deploy` 형식 권장:

```
codi-live-view-dev-deploy    → codi-live-view-dev 서버용
<배포 서버>-deploy   → codi-live-view-prod 서버용
```

#### 단계

배포 서버 1대당 다음 1~5단계를 반복.

| 단계 | 작업                                                                    | 위치      |
| ---- | ----------------------------------------------------------------------- | --------- |
| 1    | 그 서버 전용 SSH 키 페어 생성 (`ssh-keygen -t ed25519`)                 | 로컬      |
| 2    | 공개키를 bastion `/home/deploy/.ssh/authorized_keys`에 추가             | bastion   |
| 3    | 공개키를 **그 배포 서버에만** `/home/rocky/.ssh/authorized_keys`에 추가 | 배포 서버 |
| 4    | 개인키를 프로젝트 Infisical의 **해당 환경**에 저장                      | Infisical |
| 5    | 프로젝트 Infisical(해당 환경)에 bastion + target 변수 입력              | Infisical |

#### 1단계 (키 생성) 예시

```bash
# 로컬에서, 환경별로 따로 발급
ssh-keygen -t ed25519 -f ~/keys/codi-live-view-dev-deploy  -C "codi-live-view-dev-deploy"  -N ""
ssh-keygen -t ed25519 -f ~/keys/<배포 서버>-deploy -C "<배포 서버>-deploy" -N ""

# 공개키 추출 (bastion + 배포 서버 등록용)
cat ~/keys/codi-live-view-dev-deploy.pub
cat ~/keys/<배포 서버>-deploy.pub
```

#### 2단계 (bastion authorized_keys) 예시

```bash
# bastion에서 (각 키마다 주석 + 한 줄 추가)
sudo -u deploy tee -a /home/deploy/.ssh/authorized_keys << 'EOF'

# project: codi-live-view, target: dev (133.186.216.12) — added 2026-05-07
ssh-ed25519 AAAA... codi-live-view-dev-deploy

# project: codi-live-view, target: prod (133.186.216.13) — added 2026-05-07
ssh-ed25519 AAAA... <배포 서버>-deploy
EOF
```

#### 3단계 (배포 서버 authorized_keys) 예시

각 배포 서버에는 **그 서버를 가리키는 키 1개만** 등록:

```bash
# dev 서버 (133.186.216.12)에서
echo 'ssh-ed25519 AAAA... codi-live-view-dev-deploy' | sudo -u rocky tee -a /home/rocky/.ssh/authorized_keys
sudo -u rocky chmod 600 /home/rocky/.ssh/authorized_keys

# prod 서버 (133.186.216.13)에서
echo 'ssh-ed25519 AAAA... <배포 서버>-deploy' | sudo -u rocky tee -a /home/rocky/.ssh/authorized_keys
sudo -u rocky chmod 600 /home/rocky/.ssh/authorized_keys
```

> **dev 키를 prod 서버에 등록하지 않는다.** 그 분리가 사고 차단의 핵심이다.

#### 4·5단계 Infisical 변수 (프로젝트의 `/{backend,frontend}/github-actions/`)

dev 환경과 prod 환경에 **같은 키 이름으로 다른 값**을 저장:

| 키                     | dev 환경 값 (예시)               | prod 환경 값 (예시)               | 출처/설명               |
| ---------------------- | -------------------------------- | --------------------------------- | ----------------------- |
| `BACK_SSH_TUNNEL_HOST` | `vpn-1-ga-1.hipasshub.com`       | `vpn-1-ga-1.hipasshub.com`        | bastion hostname (공통) |
| `BACK_BASTION_USER`    | `deploy`                         | `deploy`                          | 공통                    |
| `BACK_BASTION_PORT`    | `9806`                           | `9806`                            | 공통                    |
| `BACK_TARGET_HOST`     | `133.186.216.12`                 | `133.186.216.13`                  | 환경별 배포 서버 IP     |
| `BACK_TARGET_PORT`     | `22`                             | `22`                              | 배포 서버 sshd 포트     |
| `BACK_SERVER_USER`     | `rocky`                          | `rocky`                           | 배포 서버 사용자        |
| `BACK_SSH_PRIVATE_KEY` | (1단계 dev 키 개인키)            | (1단계 prod 키 개인키)            | **환경별 다른 값**      |
| `BACK_DEPLOY_DIR`      | `/home/rocky`                    | `/home/rocky`                     | 배포 서버 작업 디렉터리 |
| `BACK_APP_NAME`        | `codi-live-view-admin-dev`       | `codi-live-view-admin-prod`       | PM2 앱 이름             |
| `BACK_TAR_FILE`        | `codi_live_view_back_dev.tar.gz` | `codi_live_view_back_prod.tar.gz` | 빌드 산출물 파일명      |

> **Cloudflare Access 토큰**은 워크플로우가 `Shared-Secrets/cloudflare/hipasshub-com/vpn-1-ga-1-token/` 경로에서 자동으로 가져온다. 프로젝트 Infisical에 따로 복사할 필요 없음.

> **dev/prod 서버가 같은 1대인 경우** (소규모 프로젝트): 그래도 dev/prod 환경별로 다른 키를 발급하는 것을 권장. 그 서버의 `authorized_keys`에 두 키 모두 등록. 어느 한쪽 키가 노출돼도 다른 환경 배포 권한은 보호됨.

---

### 시나리오 B: 기존 bastion에 새 배포 서버 추가 (기존 프로젝트의 새 환경/타깃)

기존 프로젝트가 추가 서버에 배포해야 하는 경우. 예: dev만 운영하던 프로젝트가 prod 서버를 새로 추가, 또는 staging 서버 신설.

> **새 배포 서버용 키 페어를 새로 발급한다.** 기존 키를 재사용하지 않음 — 키 노출 시 영향 범위 격리 + 서버 단위 키 회전 가능.

| 단계 | 작업                                                                                            | 위치         |
| ---- | ----------------------------------------------------------------------------------------------- | ------------ |
| 1    | 새 배포 서버에 sshd 동작 + 방화벽에서 bastion IP의 sshd 포트 허용                               | 새 배포 서버 |
| 2    | 새 서버 전용 SSH 키 페어 생성 (`{project}-{env}-deploy`)                                        | 로컬         |
| 3    | 공개키를 **새 배포 서버의** `/home/rocky/.ssh/authorized_keys`에 추가                           | 새 배포 서버 |
| 4    | 공개키를 **bastion의** `/home/deploy/.ssh/authorized_keys`에 추가 (주석으로 프로젝트/타깃 표시) | bastion      |
| 5    | bastion sshd config의 `PermitOpen`에 새 IP:포트 추가 + `sshd -t` + reload                       | bastion      |
| 6    | bastion → 새 배포 서버 TCP 연결 테스트 (`nc -zv <새서버> 22`)                                   | bastion      |
| 7    | 프로젝트 Infisical의 **해당 환경**에 새 서버용 변수 입력 (개인키, TARGET_HOST 등)               | Infisical    |

#### 2단계 예시

```bash
# 로컬에서
ssh-keygen -t ed25519 -f ~/keys/<배포 서버>-deploy -C "<배포 서버>-deploy" -N ""
ssh-keygen -y -f ~/keys/<배포 서버>-deploy   # 공개키 출력 (3,4단계용)
```

#### 3단계 (새 배포 서버 키 등록) 예시

```bash
# 새 배포 서버에서
sudo -u rocky mkdir -p /home/rocky/.ssh
sudo -u rocky chmod 700 /home/rocky/.ssh
echo 'ssh-ed25519 AAAA... <배포 서버>-deploy' | sudo -u rocky tee -a /home/rocky/.ssh/authorized_keys
sudo -u rocky chmod 600 /home/rocky/.ssh/authorized_keys
sudo -u rocky ssh-keygen -lf /home/rocky/.ssh/authorized_keys   # 지문 확인
```

#### 4단계 (bastion 키 등록) 예시

```bash
# bastion에서 — 어느 프로젝트의 어느 타깃용인지 주석 명시
sudo -u deploy tee -a /home/deploy/.ssh/authorized_keys << 'EOF'
# project: <프로젝트>, target: prod (<배포 서버 IP>) — added 2026-05-07
ssh-ed25519 AAAA...
EOF
```

#### 5단계 (bastion PermitOpen 추가) 예시

```bash
# bastion에서
sudo vim /etc/ssh/sshd_config.d/50-deploy.conf
# PermitOpen 라인에 새 IP:포트 추가:
#   PermitOpen 133.186.216.12:22 133.186.216.13:22 ...

sudo sshd -t                       # config 검증
sudo systemctl reload ssh          # 적용 (Ubuntu/Debian: ssh, Rocky: sshd)
sudo sshd -T -C user=deploy | grep permitopen   # 적용 확인
```

#### 7단계 Infisical 변수

새 환경(prod 등)에 시나리오 A의 4·5단계 표와 동일한 변수 세트를 입력. 이때 `BACK_SSH_PRIVATE_KEY`는 2단계에서 생성한 새 키, `BACK_TARGET_HOST`는 새 서버 IP.

> **여러 프로젝트가 한 배포 서버를 공유하는 경우**: 각 프로젝트가 자기 키 페어를 따로 발급해 그 배포 서버의 `authorized_keys`에 누적 등록한다. 한 프로젝트가 키 회전해도 다른 프로젝트 영향 없음. bastion `PermitOpen`에는 IP:포트가 한 번만 들어가면 됨 — 어느 프로젝트가 점프해도 같은 대상.

---

### 시나리오 C: 새 도메인에 bastion 신규 구축

새 도메인에서 처음 bastion을 셋업하는 경우. 1~10단계 모두 실행.

| 단계 | 작업                                                                    | 빈도           |
| ---- | ----------------------------------------------------------------------- | -------------- |
| 1    | bastion으로 쓸 서버 준비 (Cloudflare zone 보유 도메인의 서브도메인)     | 도메인당 1회   |
| 2    | Cloudflare Tunnel 생성 + Public Hostname 등록                           | 도메인당 1회   |
| 3    | Cloudflare Access Application 생성 (Self-hosted, Browser rendering OFF) | 도메인당 1회   |
| 4    | Cloudflare Service Token 발급 + Infisical Shared-Secrets 저장           | 도메인당 1회   |
| 5    | Access 정책 설정 (Service Auth + Service Token)                         | 도메인당 1회   |
| 6    | WAF 예외 규칙 추가                                                      | 도메인당 1회   |
| 7    | bastion 서버에 cloudflared 설치 + 토큰으로 systemd 서비스 등록          | bastion당 1회  |
| 8    | bastion에 `deploy` 사용자 + sshd config 셋업                            | bastion당 1회  |
| 9    | 배포 서버 N대 준비 (시나리오 B 1~5단계)                                 | 서버당 1회     |
| 10   | 프로젝트별 키 등록 + Infisical 변수 (시나리오 A)                        | 프로젝트당 1회 |

---

## 설정 단계 상세

### 1단계: bastion 서버 준비

bastion은 다음 조건을 만족해야 한다:

- 인터넷 접근 가능 (Cloudflare Edge → bastion으로 outbound TCP 가능)
- 배포 서버들과 네트워크 연결 가능 (사설망 또는 공인 IP)
- sshd가 동작 중

bastion 자신의 sshd 포트는 자유롭게 정할 수 있다 (예: `9806`). Cloudflare Tunnel ingress가 그 포트를 가리키게 하면 된다.

### 2단계: Cloudflare Tunnel 생성

1. Zero Trust → Networks → Tunnels → **Create a tunnel**
2. Connector type: `cloudflared`
3. Tunnel name: bastion 서버 식별 가능한 이름 (예: `GITHUB_ACTIONS_1`)
4. 다음 화면에서 표시되는 설치 명령어를 **bastion 서버에서 그대로 실행** (7단계와 같이 진행)
5. **Public Hostname** 추가:
   - Subdomain: bastion 식별 이름 (예: `vpn-1-ga-1`)
   - Domain: 도메인 선택 (예: `hipasshub.com`)
   - Path: **비어있음** (반드시)
   - Type: **`SSH`**
   - URL: **`localhost:9806`** (bastion sshd 포트)

> **주의**: Path 필드는 placeholder `^/blog`가 보이지만 비워둬야 한다. 값이 들어가면 SSH 매칭이 깨져 `failed to find Access application` 에러가 발생한다.

> **주의**: 같은 hostname을 다른 터널에 중복 등록 금지. Cloudflare가 랜덤 라우팅한다.

### 3단계: Cloudflare Access Application 생성

1. Zero Trust → Access → **Applications** → **Add an application**
2. **Self-hosted** 선택
3. Application Domain: `vpn-1-ga-1.hipasshub.com` (2단계 hostname과 정확히 일치)
4. **Browser rendering 비활성화 필수** — 활성화하면 cloudflared CLI의 WebSocket이 차단되어 `bad handshake` 발생

### 4단계: Service Token 발급 + Infisical 저장

1. Zero Trust → Access → **Service Auth** → **Service Tokens** → **Create Service Token**
2. 발급된 두 값을 **Infisical Shared-Secrets**에 저장:
   - 경로: `/cloudflare/{domain}/{subdomain}` (예: `/cloudflare/hipasshub-com/vpn-1-ga-1-token`)
   - 키: `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`

### 5단계: Access 정책 설정

1. Application 상세 → **Policies** 탭 → **Add a policy**
2. Action: **`Service Auth`** ← Allow가 아님!
3. Selector: **`Service Token`** → 4단계에서 발급한 토큰 선택
4. Save

> **Allow**로 설정하면 브라우저 로그인 페이지로 302 리다이렉트되어 CI/CD에서 무조건 실패한다.

### 6단계: WAF 예외 규칙 추가

Cloudflare WAF/Bot Fight Mode가 GitHub Actions IP를 봇으로 분류하면 정확히 `websocket: bad handshake`가 발생한다.

1. Cloudflare 대시보드 → 도메인 → **보안 → WAF → 사용자 지정 규칙**
2. 규칙 추가:
   - 이름: `SSH Tunnel Allow`
   - 조건: **호스트 이름** == `vpn-1-ga-1.hipasshub.com` (또는 와일드카드 `호스트 이름이 vpn-로 시작`)
   - 작업: **건너뛰기(Skip)** → **모든 남은 규칙 건너뛰기** (Bot Fight Mode 포함)

### 7단계: bastion 서버에 cloudflared 설치 + 서비스 등록

#### 7-A. 바이너리 설치

Ubuntu/Debian (현재 운영 환경):

```bash
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared
cloudflared --version
```

Rocky Linux / RHEL:

```bash
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-x86_64.rpm -o /tmp/cloudflared.rpm
sudo rpm -ivh /tmp/cloudflared.rpm
```

#### 7-B. 터널 서비스 등록

2단계에서 대시보드가 알려준 토큰으로:

```bash
sudo cloudflared service install <TUNNEL_TOKEN>
```

토큰을 잃어버렸다면: 대시보드 → Networks → Tunnels → 해당 터널 → Connectors → **Add a connector**에서 다시 확인.

이 명령이 하는 것:

- `/etc/systemd/system/cloudflared.service` 또는 비슷한 systemd 유닛 등록 (서비스 이름은 환경에 따라 다를 수 있음)
- 부팅 시 자동 실행
- config.yml 없이 토큰(JWT)에 ingress 설정 내장

#### 7-C. 동작 확인

```bash
sudo systemctl status cloudflared          # 또는 cloudflared-github-actions
sudo journalctl -u cloudflared -f          # ingress 업데이트 로그 확인
```

대시보드의 터널 상태가 **HEALTHY (초록)** 이고 connector가 **연결됨**으로 표시되면 정상.

### 8단계: bastion에 `deploy` 사용자 + sshd config 셋업

bastion 서버에서:

```bash
# 1. 공용 deploy 사용자 생성 (모든 프로젝트가 이 사용자 1명을 공유)
sudo useradd -m -s /bin/bash deploy

# 2. 잠금 해제 (useradd 직후 기본 잠금 상태)
sudo passwd -d deploy
sudo passwd -S deploy   # "deploy NP ..." (NP = No Password, 정상)

# 3. .ssh 준비
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy chmod 700 /home/deploy/.ssh
sudo -u deploy touch /home/deploy/.ssh/authorized_keys
sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys

# 4. sshd config (셸 차단 + ProxyJump 전용 + 점프 대상 화이트리스트)
sudo tee /etc/ssh/sshd_config.d/50-deploy.conf << 'EOF'
Match User deploy
    AllowTcpForwarding yes
    PermitOpen <배포서버_IP>:22
    X11Forwarding no
    PermitTunnel no
    GatewayPorts no
    AllowAgentForwarding no
EOF

# 5. AllowUsers 화이트리스트가 있다면 deploy 추가
sudo grep -rH "^AllowUsers" /etc/ssh/
# 결과 파일에 " deploy" 추가 (없으면 이 단계 스킵)

# 6. 셸 접속 봉쇄 (한 가지 선택)
# 6-A. 사용자 셸 자체를 nologin으로 (가장 단순)
sudo usermod -s /usr/sbin/nologin deploy
# 6-B. 또는 위 50-deploy.conf에 ForceCommand 추가
#      ⚠️ ForceCommand는 SCP 채널까지 막을 수 있으니, ProxyJump만 쓰는 deploy 사용자에는 6-A 방식 권장

# 7. config 검증 + reload
sudo sshd -t && sudo systemctl reload ssh
sudo sshd -T -C user=deploy 2>/dev/null | grep -E "permitopen|allowtcpforwarding"
```

**중요**: bastion에는 점프용 키를 두지 않는다. ProxyJump는 클라이언트 키(GitHub Actions의 `deploy_key`)를 그대로 들고 다음 hop에서 다시 인증한다.

### 9단계: 배포 서버 추가 (시나리오 B 참조)

배포 서버에서:

```bash
# 1. sshd 동작 확인
sudo ss -tlnp | grep sshd

# 2. 방화벽에서 bastion IP의 sshd 포트 허용
# firewalld
sudo firewall-cmd --permanent --add-rich-rule='rule family=ipv4 source address=<BASTION_IP> port port=22 protocol=tcp accept'
sudo firewall-cmd --reload

# ufw
# sudo ufw allow from <BASTION_IP> to any port 22 proto tcp

# 클라우드 콘솔의 보안그룹에서도 같은 규칙 추가 (NHN Cloud, AWS, GCP 등)

# 3. rocky 사용자 .ssh 권한 확인
sudo -u rocky ls -la /home/rocky/.ssh/
# authorized_keys 권한이 600, 디렉터리 700, rocky 소유여야 함
```

bastion에서:

```bash
# 4. TCP 연결 가능 확인
nc -zv <배포서버_IP> 22

# 5. bastion sshd config의 PermitOpen에 새 IP:포트 추가 (시나리오 B 4단계)
sudo vim /etc/ssh/sshd_config.d/50-deploy.conf
sudo sshd -t && sudo systemctl reload ssh
```

### 10단계: 프로젝트 × 배포 서버 키 등록 + Infisical 변수

시나리오 A 절차 그대로. **배포 서버 N대마다 키 페어 N개 발급**.

```bash
# 로컬에서, 환경별로 따로 발급
ssh-keygen -t ed25519 -f ~/keys/{project}-dev-deploy  -C "{project}-dev-deploy"  -N ""
ssh-keygen -t ed25519 -f ~/keys/{project}-prod-deploy -C "{project}-prod-deploy" -N ""

# 각 공개키를 bastion에 등록 (어느 프로젝트의 어느 타깃인지 주석 명시)
sudo -u deploy tee -a /home/deploy/.ssh/authorized_keys << 'EOF'

# project: {project}, target: dev — added YYYY-MM-DD
$(cat ~/keys/{project}-dev-deploy.pub)

# project: {project}, target: prod — added YYYY-MM-DD
$(cat ~/keys/{project}-prod-deploy.pub)
EOF

# dev 공개키는 dev 서버에만, prod 공개키는 prod 서버에만 등록
ssh dev-server  "echo '$(cat ~/keys/{project}-dev-deploy.pub)'  >> /home/rocky/.ssh/authorized_keys"
ssh prod-server "echo '$(cat ~/keys/{project}-prod-deploy.pub)' >> /home/rocky/.ssh/authorized_keys"
```

개인키 저장:

- `~/keys/{project}-dev-deploy` → Infisical **dev** 환경의 `BACK_SSH_PRIVATE_KEY`
- `~/keys/{project}-prod-deploy` → Infisical **prod** 환경의 `BACK_SSH_PRIVATE_KEY`

(Frontend는 `FRONT_SSH_PRIVATE_KEY`)

---

## 빠른 진단 체크리스트

배포 실패 시 위에서 아래 순서로 확인:

```bash
# 1. Cloudflare Access Application이 hostname을 인식하는지
cloudflared access login https://vpn-1-ga-1.hipasshub.com --quick
# 정상: "Successfully logged in" 또는 브라우저 열림 (CI에서는 실패해도 OK, 메시지가 중요)
# 비정상: "failed to find Access application" → 2단계/3단계 설정 확인

# 2. Service Token 인증
curl -sI -H "CF-Access-Client-Id: $CF_ID" -H "CF-Access-Client-Secret: $CF_SECRET" \
  https://vpn-1-ga-1.hipasshub.com
# 정상: 200/3xx 또는 origin 응답
# 403 + 커스텀 에러 페이지: WAF가 차단 또는 Application 미인식

# 3. cloudflared 터널 연결 시도 (debug 로그)
cloudflared access ssh --hostname vpn-1-ga-1.hipasshub.com \
  --id $CF_ID --secret $CF_SECRET --loglevel debug 2>&1 | head -30

# 4. bastion sshd 로그 (bastion 서버에서)
sudo journalctl -u ssh -f
# GitHub Actions 시도 직후 새 라인이 떠야 함 (소스 IP는 127.0.0.1)
# "User deploy from 127.0.0.1 not allowed because not listed in AllowUsers" → AllowUsers 수정
# "Failed publickey for deploy" → /home/deploy/.ssh/authorized_keys 확인

# 5. bastion → 배포 서버 TCP (bastion 서버에서)
nc -zv <배포서버_IP> 22

# 6. 배포 서버 sshd 로그 (배포 서버에서)
sudo journalctl -u sshd -f   # 또는 -u ssh
# GitHub Actions 시도 직후 새 라인이 떠야 함 (소스 IP는 bastion IP)
```

## 트러블슈팅

| 증상                                                                      | 원인                                             | 해결                                                                   |
| ------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| `websocket: bad handshake`                                                | WAF/Bot Fight Mode가 IP 차단                     | **6단계** WAF 예외 규칙 추가 + `모든 남은 규칙 건너뛰기` 선택          |
| `websocket: bad handshake`                                                | Public Hostname의 Path에 값이 들어있음           | 대시보드에서 Path 필드 비우기 (placeholder만 보여야 함)                |
| `failed to find Access application`                                       | Application 미생성 또는 hostname 불일치          | **3단계** 재확인 — Application Domain이 정확한지                       |
| `failed to find Access application`                                       | Browser rendering 활성화 상태                    | **3단계** Browser rendering OFF                                        |
| `302` 리다이렉트 + 로그인 페이지 HTML                                     | Access 정책 Action이 `Allow`                     | **5단계** `Service Auth`로 변경                                        |
| `Permission denied` (bastion)                                             | bastion deploy 사용자 잠김 (`L`)                 | `sudo passwd -d deploy` (NP 상태로)                                    |
| `User deploy from 127.0.0.1 not allowed because not listed in AllowUsers` | AllowUsers 화이트리스트에 deploy 미포함          | sshd_config의 AllowUsers에 deploy 추가                                 |
| `Too many authentication failures`                                        | bastion 인증 거부 → 클라이언트가 키 여러 개 시도 | bastion sshd 로그 보고 실제 거부 사유 확인 (대부분 위 두 가지 중 하나) |
| `Permission denied` (배포 서버 단계)                                      | 배포 서버 authorized_keys에 키 없음/권한 문제    | `ssh-keygen -lf /home/rocky/.ssh/authorized_keys`로 지문 확인          |
| `Connection refused` (bastion → 배포 서버)                                | 배포 서버 방화벽/보안그룹 차단                   | 배포 서버 firewalld/ufw + 클라우드 보안그룹에서 bastion IP의 22 허용   |
| 배포 서버 sshd 로그에 흔적 없음                                           | bastion sshd가 PermitOpen 위반으로 채널 거부     | bastion 50-deploy.conf의 PermitOpen에 배포 서버 IP:포트 추가           |
| 같은 hostname에 두 터널 연결 시 라우팅 불안정                             | Cloudflare 랜덤 라우팅                           | 한 터널만 남기고 다른 터널의 동일 hostname 제거                        |

## 보안 메모

- **`AllowUsers`에 deploy 추가는 안전하다** — 단순히 "이 사용자가 SSH 들어올 수 있다"는 화이트리스트일 뿐, 다른 사용자의 키와 무관함. 각 사용자는 자기 `authorized_keys`로만 인증된다.
- **deploy 사용자에 sudo 권한 절대 부여 금지** — 키 노출 시 root 획득 위험
- **deploy의 셸은 nologin** — bastion에 진입해도 명령 실행 불가, ProxyJump(TCP 포워딩)만 동작
- **`PermitOpen` 화이트리스트 유지** — deploy 사용자가 점프할 수 있는 IP:포트를 명시적으로 제한. 빠뜨리면 임의 내부망 스캔 가능
- **SSH 키는 프로젝트 × 배포 서버 조합당 1개** — 키 노출 시 영향이 그 서버 1대로 한정. 키 회전은 해당 서버 1대의 `authorized_keys`만 교체
- **Service Token은 노출 시 즉시 회수** — Zero Trust → Access → Service Auth에서 삭제 후 재발급, Infisical 갱신
- **Cloudflare Zero Trust Free 플랜은 50명까지 무료** — Service Token은 사용자 수에 포함되지 않음

### 키 회전 절차 (특정 키 노출 시)

키 분리 원칙 덕분에 회전이 그 키의 영향 범위만으로 한정된다:

```bash
# 1. 새 키 페어 발급 (같은 명명 규칙)
ssh-keygen -t ed25519 -f ~/keys/{project}-{env}-deploy -N ""

# 2. 새 공개키를 bastion authorized_keys에 추가 (옛 줄 위에 추가하고 옛 줄은 일단 유지)
sudo -u deploy vim /home/deploy/.ssh/authorized_keys

# 3. 새 공개키를 해당 배포 서버에만 추가 (옛 줄 일단 유지)
ssh <대상서버> 'echo "<새 공개키>" >> /home/rocky/.ssh/authorized_keys'

# 4. Infisical에서 BACK_SSH_PRIVATE_KEY 값을 새 개인키로 갱신 (해당 환경만)

# 5. GitHub Actions 재실행 — 정상 배포 확인

# 6. 정상 동작 확인 후 옛 공개키를 두 곳(bastion + 배포 서버)에서 제거
```

다른 프로젝트/다른 배포 서버는 **건드리지 않는다.** 각자 키가 분리되어 있어 영향 없음.

## 주의사항

- **Tunnel은 도메인당 bastion 1개** — 프로젝트/배포 서버마다 새 터널을 만들면 관리가 폭증한다
- **Public Hostname의 Path는 비워두기** — 값이 들어가면 SSH 매칭 실패
- **Browser rendering은 반드시 OFF** — cloudflared CLI 차단됨
- **WAF 예외 규칙은 필수** — GitHub Actions Runner는 데이터센터 IP라 봇으로 분류된다
- **WAF Skip 시 "모든 남은 규칙 건너뛰기" 선택** — Bot Fight Mode 등 추가 보안 기능까지 함께 건너뛰어야 함
- **ProxyCommand 환경변수 전달 불가** — SSH가 별도 프로세스로 실행하므로 `--id`, `--secret` 플래그로 직접 전달
- **bastion sshd 데몬을 두 개 같이 운영 금지** — 같은 서버에서 일반 sshd(22) + cloudflared 전용 sshd(9806)는 가능하지만, cloudflared 데몬 자체를 여러 터널로 중복 운영하면 ingress 충돌 가능
- **로컬 IP에서 cloudflared 시도가 막혀도 GitHub Actions는 동작할 수 있다** — Bot Fight Mode가 가정용 IP를 더 엄격히 분류하기도 함. 진짜 검증은 GitHub Actions 재실행으로 한다
