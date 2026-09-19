# Git 및 작업 흐름

## 브랜치

- `main`: 안정 버전
- `develop`: 기본 개발 브랜치
- `feature/<name>`: 기능 개발
- `fix/<name>`: 버그 수정

## 작업 순서

1. `develop`에서 최신 변경사항을 확인합니다.
2. 기능 또는 수정 브랜치를 생성합니다.
3. 작은 단위로 구현하고 검증합니다.
4. `develop`을 대상으로 Pull Request를 생성합니다.
5. 리뷰와 검증 후 병합합니다.

## 커밋

커밋 메시지는 변경 목적이 드러나도록 작성합니다.

```text
feat: add product list page
fix: handle expired access token
docs: update api integration policy
chore: update frontend dependencies
```

## 커밋하지 않는 파일

`.env`, `node_modules`, `dist`, 로그, 테스트 결과물, IDE 개인 설정은 커밋하지 않습니다.
