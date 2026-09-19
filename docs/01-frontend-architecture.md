# 프론트엔드 아키텍처

## 기술 스택

- React + TypeScript
- Vite
- React Router
- Axios
- TanStack Query
- Tailwind CSS
- Oxlint + Prettier

## 역할 분리

- 컴포넌트: 화면 표시와 사용자 상호작용
- Axios: HTTP 요청의 공통 설정과 전송
- TanStack Query: 서버 상태, 캐시, 재요청, mutation 관리
- React state: 모달, 입력값, 탭 등 화면 내부 상태
- React Router: URL과 화면의 연결

## 권장 폴더 구조

```text
src/
├── components/       # 여러 화면에서 재사용하는 UI
├── features/         # 도메인 또는 기능 단위 화면과 로직
├── layouts/          # 공통 레이아웃
├── lib/              # api client 등 공통 라이브러리
├── pages/            # 라우트 단위 페이지
├── routes/           # 라우팅 설정
├── hooks/             # 공통 React hooks
├── types/             # 공통 타입
└── assets/            # 이미지, 폰트 등 정적 리소스
```

현재는 초기 뼈대만 있으므로 실제 기능이 추가될 때 이 구조를 적용합니다.

## 상태 관리 원칙

서버에서 받은 데이터는 TanStack Query로 관리하고, 컴포넌트 내부의 일시적인 UI 상태는 React state로 관리합니다. 같은 서버 데이터를 여러 전역 상태 저장소에 중복 저장하지 않습니다.
