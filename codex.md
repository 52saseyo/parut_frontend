# Codex 작업 가이드

이 문서는 Parut 프론트엔드에서 Codex가 작업할 때 우선 확인하는 프로젝트 기준 문서입니다.

## 작업 원칙

1. 작업을 시작하기 전에 이 문서와 작업 범위에 해당하는 `docs/` 문서를 확인합니다.
2. 백엔드 계약은 `develop` 브랜치와 공식 API 문서를 기준으로 확인합니다.
3. 기존 코드를 먼저 읽고, 필요한 범위만 수정합니다.
4. 기능 변경 후 `npm run build`, `npm run lint`를 실행합니다.
5. 환경변수, 토큰, 비밀번호, 개인 설정 파일은 커밋하지 않습니다.
6. 불확실한 비즈니스 규칙은 임의로 확정하지 않고 문서에 질문이나 결정 사항으로 남깁니다.

## 문서 목차

- [문서 인덱스](./docs/README.md)
- [프로젝트 개요](./docs/00-project-overview.md)
- [프론트엔드 아키텍처](./docs/01-frontend-architecture.md)
- [API 연동 정책](./docs/02-api-integration.md)
- [UI 및 반응형 정책](./docs/03-ui-responsive.md)
- [코드 품질 정책](./docs/04-code-quality.md)
- [Git 및 작업 흐름](./docs/05-git-workflow.md)
- [도메인 및 상태 정책](./docs/06-domain-and-status.md)
- [백엔드 연동 참고](./docs/07-backend-reference.md)

## 변경 시 문서화

새로운 기술 선택, API 규칙, 화면 흐름, 인증 방식 또는 팀 작업 규칙이 생기면 관련 문서를 먼저 갱신합니다. 문서와 구현이 달라지면 구현보다 문서를 방치하지 말고 함께 수정합니다.
