# API 연동 정책

## 기본 설정

API 기본 주소는 `.env`의 `VITE_API_BASE_URL`로 관리합니다.

```env
VITE_API_BASE_URL=http://localhost:8080
```

`.env`는 커밋하지 않고 `.env.example`만 저장소에 공유합니다.

일반 상품 화면은 `GET /api/v1/products?size=10`과 `GET /api/v1/products/{productId}`를 사용합니다. 목록은 cursor 기반 응답이며, 상품 상세는 이미지가 등록되지 않은 상품에서 백엔드가 오류를 반환할 수 있으므로 화면에서는 오류 상태를 별도로 처리합니다.

타임딜은 일반 상품 API와 분리하여 `GET /api/v1/time-deals?status=ACTIVE&size=10`과 `GET /api/v1/time-deals/{timeDealId}`를 사용합니다. 타임딜 목록·상세의 식별자는 `productId`가 아니라 `timeDealId`입니다. API 응답이 비어 있거나 실패하면 목업 데이터를 노출하지 않고 빈 상태 또는 오류 안내를 표시합니다.

판매자 타임딜 API는 `/api/v1/seller/time-deals` 하위 경로를 사용합니다. 판매자 본인 타임딜 목록은 cursor 기반으로 조회하고, 생성·수정·삭제·중지와 타임딜 재고 조회·조정·상품 재고 이관을 해당 seller 경로에서 처리합니다. 타임딜 이미지는 presigned URL 업로드와 complete 처리 후 `POST /api/v1/seller/time-deals/{timeDealId}/images`로 연결합니다.

- `GET /api/v1/seller/time-deals`
- `POST /api/v1/seller/time-deals`
- `POST /api/v1/seller/time-deals/conversions`
- `PATCH /api/v1/seller/time-deals/{timeDealId}`
- `DELETE /api/v1/seller/time-deals/{timeDealId}`
- `PATCH /api/v1/seller/time-deals/{timeDealId}/stop`
- `GET/PATCH /api/v1/seller/time-deals/{timeDealId}/stock`
- `GET /api/v1/seller/time-deals/stocks`
- `POST /api/v1/seller/time-deals/{timeDealId}/stock/transfer`

재고 임박 표시는 `availableQuantity <= lowStockThreshold`일 때 노출합니다. 타임딜 응답에는 두 필드가 제공되어 목록·상세에 적용하며, 일반 상품 공개 목록·상세 응답에는 현재 `lowStockThreshold`가 없어 해당 필드가 추가되면 동일한 규칙으로 자동 적용합니다.

## 요청 규칙

- 공통 Axios 인스턴스는 `src/lib/api.ts`를 사용합니다.
- 기능별 API 함수는 해당 feature 또는 service 영역에 둡니다.
- 컴포넌트에서 URL 문자열을 직접 조합하지 않습니다.
- 서버 데이터 조회는 TanStack Query를 통해 처리합니다.
- 데이터 변경은 mutation으로 처리하고 성공 시 관련 query를 무효화합니다.

현재 구현된 API 모듈은 `src/features/auth`, `src/features/products`, `src/features/timedeals`, `src/features/seller-products`, `src/features/addresses`에 있습니다. 일반 상품과 타임딜의 목록·상세 화면은 API 응답만 사용하며, 데이터가 없을 때는 빈 상태를 표시합니다. 판매자 타임딜 관리 화면은 판매자 전용 목록·관리·재고 API를 사용합니다. 고객 주문 목록·배송·구매확정·환불 조회도 API를 사용하며, 로딩·빈 상태·오류 상태를 구분합니다. 일부 판매자·관리자 대시보드에 남아 있는 목업 데이터는 해당 API 연결 작업 전까지의 화면 보조 데이터입니다.

주문·결제 API는 `src/features/orders`에서 관리합니다.

- `POST /api/v1/orders`: 일반 주문 생성. `Idempotency-Key` 헤더가 필요합니다.
- `GET /api/v1/orders?size=10`: 고객 주문상품 목록. `content`를 주문 ID 기준으로 묶어 주문 목록 카드로 표시하며, `pageInfo`는 cursor 페이지네이션 정보입니다.
- `GET /api/v1/orders/{orderId}`: 주문 상세 조회
- `PATCH /api/v1/orders/{orderId}/items/{orderItemId}/confirm`: 주문 상품 구매확정
- `POST /api/v1/payments/ready`: 결제 준비
- `POST /api/v1/payments/confirm`: 결제 확정. `Idempotency-Key` 헤더가 필요합니다.

checkout 주문 식별자는 주문 유형에 따라 분리합니다.

- 일반 상품: `POST /api/v1/orders`에 `items[].productId`를 전달합니다.
- 타임딜: `POST /api/v1/orders/time-deals`에 `timeDealId`, 수량, 배송정보를 전달합니다. 연결된 상품 정보는 백엔드가 `timeDealId`를 기준으로 결정합니다.
- 결제 준비는 주문 생성 응답의 `orderId`를 `POST /api/v1/payments/ready`에 전달합니다.

고객 주문 목록은 `GET /api/v1/orders?size=10`으로 조회합니다. 백엔드는 주문상품 단위로 응답하므로 화면에서 `orderId` 기준으로 묶고, 상세 이동에는 실제 UUID `orderId`를 사용합니다. 상세 화면은 기존처럼 `GET /api/v1/orders/{orderId}`를 조회합니다.

배송·환불 API는 `src/features/delivery`와 `src/features/refunds`에서 관리합니다.

- `GET /api/v1/deliveries/{deliveryId}`: 배송 상세 조회
- `GET /api/v1/deliveries?orderId={orderId}`: 고객 또는 판매자 본인 배송 목록
- `PATCH /api/v1/deliveries/{deliveryId}/ship`: 배송 시작

판매자 주문·배송 화면은 `GET /api/v1/deliveries?size=10`으로 판매자 소유 배송 작업을 조회하고, `PREPARING` 상태 배송에 운송장 번호를 입력해 `PATCH /api/v1/deliveries/{deliveryId}/ship`을 호출합니다. 현재 배송 목록 응답에는 주문번호·상품명이 포함되지 않고 배송 ID·배송그룹 ID·상태·운송장 정보만 포함됩니다.
- `POST /api/v1/order-items/{orderItemId}/refunds`: 환불 신청
- `GET /api/v1/refunds`: 고객 또는 판매자 본인 환불 목록
- `GET /api/v1/refunds/{refundId}`: 환불 상세 조회
- `PATCH /api/v1/refunds/{refundId}/cancel`: 환불 신청 취소
- `PATCH /api/v1/refunds/approve`: 판매자 환불 일괄 승인
- `PATCH /api/v1/refunds/{refundId}/reject`: 판매자 환불 거절

알림 서비스는 현재 domain과 enum만 있고 controller 및 외부 API가 백엔드에 구현되어 있지 않습니다. 따라서 프론트엔드에서는 알림 화면 구조만 유지하고, endpoint가 추가되면 `src/features/notifications`를 새로 연결합니다.

배송지는 `src/features/addresses`에서 관리합니다. checkout은 `GET /api/v1/users/me/addresses`로 저장 배송지를 조회하고, 선택한 배송지의 수령인 정보를 주문 요청의 `recipient`에 복사합니다. `/me` 마이페이지에서는 배송지 등록·수정·기본 변경·삭제를 모두 제공합니다.

- `GET /api/v1/users/me/addresses`: 저장 배송지 목록
- `POST /api/v1/users/me/addresses`: 배송지 등록
- `PATCH /api/v1/users/me/addresses/{addressId}`: 배송지 수정
- `PATCH /api/v1/users/me/addresses/{addressId}/default`: 기본 배송지 변경
- `DELETE /api/v1/users/me/addresses/{addressId}`: 배송지 삭제

내 정보는 `/me` 마이페이지에서 `GET /api/v1/users/me`, `PATCH /api/v1/users/{id}`, `DELETE /api/v1/users/{id}`를 사용합니다. 고객은 본인 정보만 수정·탈퇴할 수 있습니다.

## 상태 처리

모든 API 화면은 최소한 다음 상태를 고려합니다.

- loading: 스켈레톤 또는 진행 상태
- success: 정상 데이터
- empty: 데이터가 없는 상태
- error: 사용자가 이해할 수 있는 오류 안내와 재시도

## 인증

인증 방식은 백엔드 `develop`의 실제 API 계약을 확인한 후 확정합니다. 토큰 저장 위치와 갱신 방식은 임의로 결정하지 않습니다.
-
## 알림 API 현재 연동 상태

앞서 작성된 알림 서비스 미구현 안내는 현재 기준으로 갱신합니다. 프론트엔드는 다음 notification-service API를 사용합니다.

- `GET /api/v1/notifications`: 로그인 사용자의 알림 목록 조회. 목록 조회 시 `size`를 직접 전달하지 않고 백엔드 기본값을 사용합니다.
- `GET /api/v1/notifications/unread-count`: 로그인 사용자의 읽지 않은 알림 개수 조회
- `PATCH /api/v1/notifications/{notificationId}/read`: 알림 읽음 처리
- `GET /api/v1/notification-subscriptions/time-deals/{timeDealId}`: 로그인 사용자의 특정 타임딜 구독 여부 조회
- `POST /api/v1/notification-subscriptions/time-deals`: 특정 타임딜 오픈 알림 신청
- `PATCH /api/v1/notification-subscriptions/time-deals/{timeDealId}/unsubscribe`: 특정 타임딜 오픈 알림 해제

구독 API는 Bearer access token으로 현재 사용자를 식별하며, 프론트에서 사용자 ID를 직접 전달하지 않습니다.
