# Contract: Archify 스윔레인 링크와 표시

**Date**: 2026-09-09

## 입력 계약

`FeatureSwimlane.archify`는 선택 필드이며 다음 두 값을 가진다.

```ts
interface FeatureSwimlaneArchifyLink {
  url: string;
  label: string;
}
```

- `url`은 `/diagrams/` 아래의 same-origin 절대 path다.
- `url`은 `.html`로 끝나며 query, hash, protocol-relative URL과 외부 origin을 허용하지 않는다.
- `label`은 trim 후 비어 있지 않다.
- 파일럿 대상은 `/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html`과 `Archify로 보기`다.
- 다른 모든 스윔레인은 `archify`를 제공하지 않는다.

## 표시 계약

- 기존 card header의 제목과 목적은 유지한다.
- 기존 `크게 보기` Button과 React SVG Dialog의 markup·행동·focus 복귀를 유지한다.
- 유효 metadata가 있을 때만 `Archify로 보기` link를 기존 action 옆에 한 번 표시한다.
- metadata가 없으면 link, 빈 action wrapper, disabled control, placeholder를 표시하지 않는다.
- 좁은 화면에서는 제목과 action group이 줄바꿈할 수 있지만 서로 가리거나 document overflow를 만들지 않는다.

## 새 탭·접근성 계약

- link는 `target="_blank"`와 `rel="noopener noreferrer"`를 함께 사용한다.
- 보이는 이름은 metadata의 label을 사용한다.
- accessible name은 대상 스윔레인과 새 탭으로 열린다는 사실을 전달한다.
- keyboard Tab으로 기존 크게 보기와 Archify 보기를 각각 focus할 수 있고 Enter로 활성화할 수 있다.
- 새 탭을 열거나 닫아도 원본 페이지와 기존 Dialog 상태는 바뀌지 않는다.

## 실패 계약

- 빈 label, 외부 URL, `/diagrams/` 밖의 path, `.html`이 아닌 path는 content validation error다.
- metadata URL과 public artifact path가 다르거나 파일이 없으면 공개 전 품질 검사가 실패한다.
- standalone viewer가 일시적으로 응답하지 않아도 원본 페이지의 React preview·Dialog·summary·exceptions는 계속 제공된다.
- 실패를 이유로 다른 스윔레인에 fallback Archify action을 만들지 않는다.

## 회귀 계약

- `hotel-reservation-platform`의 대상 스윔레인에만 Archify action 1개가 있다.
- 기존 모든 스윔레인의 React preview와 `크게 보기`가 유지된다.
- 기존 프로젝트 본문·인사이트·summary·exceptions 문구는 변경하지 않는다.
- 링크 추가가 프로젝트 페이지의 320/768/1024/1440px document overflow를 만들지 않는다.
