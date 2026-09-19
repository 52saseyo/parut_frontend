# API 연동 정책

## 기본 설정

API 기본 주소는 `.env`의 `VITE_API_BASE_URL`로 관리합니다.

```env
VITE_API_BASE_URL=http://localhost:8080
```

`.env`는 커밋하지 않고 `.env.example`만 저장소에 공유합니다.

현재 구현된 공개 상품 API는 `GET /api/v1/products?size=10`과 `GET /api/v1/products/{productId}`를 사용합니다. 목록은 cursor 기반 응답이며, 상품 상세는 이미지가 등록되지 않은 상품에서 백엔드가 오류를 반환할 수 있으므로 화면에서는 오류 상태를 별도로 처리합니다.

## 요청 규칙

- 공통 Axios 인스턴스는 `src/lib/api.ts`를 사용합니다.
- 기능별 API 함수는 해당 feature 또는 service 영역에 둡니다.
- 컴포넌트에서 URL 문자열을 직접 조합하지 않습니다.
- 서버 데이터 조회는 TanStack Query를 통해 처리합니다.
- 데이터 변경은 mutation으로 처리하고 성공 시 관련 query를 무효화합니다.

현재 구현된 API 모듈은 `src/features/auth`와 `src/features/products`에 있으며, 백엔드 응답이 없을 때 화면 확인을 위해 기존 목업 데이터를 fallback으로 사용합니다.

## 상태 처리

모든 API 화면은 최소한 다음 상태를 고려합니다.

- loading: 스켈레톤 또는 진행 상태
- success: 정상 데이터
- empty: 데이터가 없는 상태
- error: 사용자가 이해할 수 있는 오류 안내와 재시도

## 인증

인증 방식은 백엔드 `develop`의 실제 API 계약을 확인한 후 확정합니다. 토큰 저장 위치와 갱신 방식은 임의로 결정하지 않습니다.
