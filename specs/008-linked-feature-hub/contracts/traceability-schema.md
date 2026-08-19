# Contract: `data/feature-relations.json`

사람이 소유하는 선택적 traceability 원본이다. `docs:build`는 읽기만 한다.

```json
{
  "version": 1,
  "entities": [
    {
      "type": "need",
      "id": "NEED-001",
      "title": "사용자가 기능 범위를 이해한다",
      "href": "specs/008-linked-feature-hub/spec.md"
    }
  ],
  "links": [
    {
      "from": { "type": "need", "id": "NEED-001" },
      "to": { "type": "feature", "id": "008-linked-feature-hub" },
      "type": "satisfied-by"
    },
    {
      "from": { "type": "feature", "id": "008-linked-feature-hub" },
      "to": { "type": "spec", "id": "008-linked-feature-hub" },
      "type": "specified-by"
    }
  ]
}
```

파일 부재 또는 최상위 구조 위반은 `null + warning`; 개별 entity/link 위반은
해당 항목 제외 + warning이다. 중복은 선선언 우선이다.

