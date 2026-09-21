# Git 및 작업 흐름

## 브랜치

- `main`: 안정 버전
- `develop`: 기본 개발 브랜치
- `feature/<name>`: 기능 개발
- `fix/<name>`: 버그 수정

## 작업 순서

모든 사용자 요청은 기능 또는 수정 단위로 별도 브랜치를 만들어 진행합니다. 이전 작업 브랜치를 재사용하지 않으며, 항상 원격 `develop` 최신 상태에서 새 브랜치를 시작합니다.

1. 작업 시작 전 현재 작업 트리의 변경사항과 기존 PR을 확인합니다. 다른 작업의 미커밋 변경사항이 있으면 임의로 덮어쓰지 않습니다.
2. 원격 `develop`을 최신화합니다.

   ```bash
   git fetch origin
   git switch develop
   git pull --ff-only origin develop
   ```

3. 요청 단위로 새 브랜치를 생성합니다.

   ```bash
   git switch -c feature/<name> develop
   # 또는
   git switch -c fix/<name> develop
   ```

4. 해당 요청에 필요한 변경만 구현합니다. 서로 다른 기능을 하나의 브랜치나 PR에 섞지 않습니다.
5. PR을 올리기 전에 기능을 직접 확인하고 `npm run lint`, `npm test`, `npm run build`를 실행합니다. 실행 환경 문제로 검증하지 못한 항목은 PR 본문에 이유를 기록합니다.
6. 변경사항을 커밋하고 새 브랜치를 원격에 push합니다.
7. 반드시 `develop`을 base로 Pull Request를 생성합니다. PR에는 변경 내용, 테스트 결과, 알려진 제한사항을 기록합니다.
8. PR과 CI 상태를 확인한 뒤 문제가 없을 때 `develop`에 병합합니다.
9. 병합 후 다음 요청은 다시 최신 `develop`에서 새로운 브랜치를 생성합니다.

작업 브랜치가 이미 다른 PR에 사용 중이거나 이전 요청의 커밋을 포함하고 있으면 재사용하지 않습니다. 새 브랜치를 `develop`에서 다시 만들고 필요한 변경만 옮깁니다.

## 자동 병합 안전 규칙

- PR을 생성하기 전에 `develop`을 대상으로 열린 다른 사람의 PR이 있는지 확인합니다.
- `develop` 대상 열린 PR이 하나라도 있으면 내 PR을 자동으로 병합하지 않고 작업을 멈춘 뒤 사용자에게 알립니다.
- `develop` 대상 열린 PR이 없고, 내 PR이 mergeable이며 필수 CI와 기능 검증을 통과한 경우에만 자동 병합할 수 있습니다.
- CI가 없거나 실패했거나 충돌 상태가 `UNKNOWN`이면 자동 병합하지 않고 사용자 확인을 받습니다.
- 내 PR이 병합된 뒤에는 로컬 `develop`과 원격 `develop`을 최신 상태로 동기화합니다.

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
