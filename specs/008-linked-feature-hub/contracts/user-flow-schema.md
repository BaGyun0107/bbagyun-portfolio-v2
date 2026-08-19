# Contract: `data/user-flows.json`

사이트맵 계층과 분리된 선택적 사용자 행동 흐름 원본이다.

```json
{
  "version": 1,
  "flows": [
    {
      "id": "FLOW-REVIEW-FEATURE",
      "title": "기능 검토",
      "actor": "PM/PL",
      "goal": "구현 가능성과 검증 상태를 판단한다",
      "entryStepId": "start",
      "steps": [
        {
          "id": "start",
          "title": "기능 카드를 연다",
          "kind": "start",
          "featureIds": ["008-linked-feature-hub"],
          "next": [{ "to": "evidence" }]
        },
        {
          "id": "evidence",
          "title": "근거가 충분한가?",
          "kind": "decision",
          "next": [
            { "to": "done", "condition": "충분" },
            { "to": "start", "condition": "보완 필요" }
          ]
        },
        { "id": "done", "title": "판단 기록", "kind": "end" }
      ]
    }
  ]
}
```

flow cycle은 soft warning, broken `next`와 screen/feature 참조는 해당 edge만
제외한다. 파일 전체 오류도 기존 허브 생성을 막지 않는다.

