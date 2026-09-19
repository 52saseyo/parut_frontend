# API 연동 정책

## 기본 설정

API 기본 주소는 `.env`의 `VITE_API_BASE_URL`로 관리합니다.

```env
VITE_API_BASE_URL=http://localhost:8080
```

`.env`는 커밋하지 않고 `.env.example`만 저장소에 공유합니다.

일반 상품 화면은 `GET /api/v1/products?size=10`과 `GET /api/v1/products/{productId}`를 사용합니다. 목록은 cursor 기반 응답이며, 상품 상세는 이미지가 등록되지 않은 상품에서 백엔드가 오류를 반환할 수 있으므로 화면에서는 오류 상태를 별도로 처리합니다.

타임딜은 일반 상품 API와 분리하여 `GET /api/v1/time-deals?status=ACTIVE&size=10`과 `GET /api/v1/time-deals/{timeDealId}`를 사용합니다. 타임딜 목록·상세의 식별자는 `productId`가 아니라 `timeDealId`입니다. API 응답이 비어 있거나 실패하면 목업 데이터를 노출하지 않고 빈 상태 또는 오류 안내를 표시합니다.

## 요청 규칙

- 공통 Axios 인스턴스는 `src/lib/api.ts`를 사용합니다.
- 기능별 API 함수는 해당 feature 또는 service 영역에 둡니다.
- 컴포넌트에서 URL 문자열을 직접 조합하지 않습니다.
- 서버 데이터 조회는 TanStack Query를 통해 처리합니다.
- 데이터 변경은 mutation으로 처리하고 성공 시 관련 query를 무효화합니다.

현재 구현된 API 모듈은 `src/features/auth`, `src/features/products`, `src/features/timedeals`에 있습니다. 일반 상품과 타임딜의 목록·상세 화면은 API 응답만 사용하며, 데이터가 없을 때는 빈 상태를 표시합니다. 주문서와 판매자 대시보드에 남아 있는 목업 데이터는 해당 API 연결 작업 전까지의 화면 보조 데이터입니다.

주문·결제 API는 `src/features/orders`에서 관리합니다.

- `POST /api/v1/orders`: 일반 주문 생성. `Idempotency-Key` 헤더가 필요합니다.
- `GET /api/v1/orders/{orderId}`: 주문 상세 조회
- `PATCH /api/v1/orders/{orderId}/items/{orderItemId}/confirm`: 주문 상품 구매확정
- `POST /api/v1/payments/ready`: 결제 준비
- `POST /api/v1/payments/confirm`: 결제 확정. `Idempotency-Key` 헤더가 필요합니다.

checkout 주문 식별자는 주문 유형에 따라 분리합니다.

- 일반 상품: `POST /api/v1/orders`에 `items[].productId`를 전달합니다.
- 타임딜: `POST /api/v1/orders/time-deals`에 `timeDealId`와 연결된 `productId`를 함께 전달합니다. 타임딜 화면의 선택 식별자는 `timeDealId`이며, 재고·상품 연결 검증을 위해 백엔드 계약상 `productId`도 필요합니다.
- 결제 준비는 주문 생성 응답의 `orderId`를 `POST /api/v1/payments/ready`에 전달합니다.

현재 백엔드 `OrderController`에는 고객 주문 목록 조회 endpoint가 없으므로 `/orders` 목록은 임시 데이터로 유지하고, 상세 화면은 UUID 주문번호가 들어오면 실제 API를 조회합니다. 목록 API가 추가되면 같은 query 계층에 연결합니다.

배송·환불 API는 `src/features/delivery`와 `src/features/refunds`에서 관리합니다.

- `GET /api/v1/deliveries/{deliveryId}`: 배송 상세 조회
- `GET /api/v1/deliveries?orderId={orderId}`: 판매자 주문별 배송 목록
- `PATCH /api/v1/deliveries/{deliveryId}/ship`: 배송 시작
- `POST /api/v1/order-items/{orderItemId}/refunds`: 환불 신청
- `PATCH /api/v1/refunds/{refundId}/cancel`: 환불 신청 취소
- `PATCH /api/v1/refunds/approve`: 판매자 환불 일괄 승인
- `PATCH /api/v1/refunds/{refundId}/reject`: 판매자 환불 거절

알림 서비스는 현재 domain과 enum만 있고 controller 및 외부 API가 백엔드에 구현되어 있지 않습니다. 따라서 프론트엔드에서는 알림 화면 구조만 유지하고, endpoint가 추가되면 `src/features/notifications`를 새로 연결합니다.

배송지 자동 입력은 현재 `/api/v1/users/me`에서 사용자 이름만 조회합니다. 백엔드 `UserResponse`에 주소 필드와 배송지 조회 endpoint가 없으므로, 프론트엔드는 최근 입력한 배송지를 로컬 저장해 다음 checkout에 복원합니다. 계정 배송지 API가 추가되면 로컬 복원 로직을 서버 배송지 조회로 교체합니다.

## 상태 처리

모든 API 화면은 최소한 다음 상태를 고려합니다.

- loading: 스켈레톤 또는 진행 상태
- success: 정상 데이터
- empty: 데이터가 없는 상태
- error: 사용자가 이해할 수 있는 오류 안내와 재시도

## 인증

인증 방식은 백엔드 `develop`의 실제 API 계약을 확인한 후 확정합니다. 토큰 저장 위치와 갱신 방식은 임의로 결정하지 않습니다.
