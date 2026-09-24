# API 기준 단계별 구현 로드맵

## 1. 문서 목적

백엔드 `develop`의 실제 공개 API와 현재 프론트 화면·기능을 대조해, 목업을 제거하고 실제 API 기반으로 구현할 순서를 정리합니다.

이 문서의 기준 시점은 2026-09-23이며 다음 소스를 기준으로 확인했습니다.

- 백엔드 `develop`: `aa5a7d8`
- 프론트엔드 `develop`: `3da6cb4`
- API 기준: 백엔드 controller, DTO, role annotation

판매자 주문 내역 화면은 범위에 포함하지 않습니다. 판매자 화면에서는 주문번호·상품명 목록이 아니라 판매자 소유의 배송 건을 조회하고 배송을 시작합니다.

## 2. 현재 구현 상태 요약

### 실제 API 연동 완료

| 영역 | 현재 상태 | 프론트 위치 |
| --- | --- | --- |
| 고객 인증 | 회원가입, 고객·관리자·판매자 로그인, 로그아웃, 토큰 재발급, 내 정보 조회 | `src/features/auth`, `src/features/sellers` |
| 공개 상품 | 상품 목록·상세, 검색·필터 일부 | `src/features/products` |
| 공개 타임딜 | 타임딜 목록·상세 | `src/features/timedeals` |
| 판매자 입점 | 입점 신청, 내 신청 상태, 관리자 승인·거절 | `src/features/sellers`, `src/features/admin` |
| 판매자 상품 | 상품 목록·등록·수정·삭제·상태 변경·이미지 등록 | `src/features/seller-products` |
| 판매자 재고 | 일반 상품 재고 조회·수정 | `src/features/seller-products` |
| 판매자 타임딜 | 등록·수정·삭제·중지·이미지·재고·상품 전환 | `src/features/seller-products` |
| 고객 주문 | 주문 생성·목록·상세 | `src/features/orders` |
| 결제 준비 | 결제 준비 API 호출 | `src/features/orders` |
| 고객 배송·구매확정 | 배송 목록·운송장 표시, 배송 완료 상품 구매확정 | `src/features/delivery`, `src/features/orders`, `/orders/:orderId` |
| 고객 배송지 | 저장 배송지 조회·선택·등록 | `src/features/addresses`, `/checkout` |
| 고객 환불 | 환불 신청·목록·요청 취소 | `src/features/refunds`, `/orders/:orderId` |
| 고객 계정·배송지 | 내 정보 수정·탈퇴, 배송지 CRUD·기본 배송지 변경 | `src/features/auth`, `src/features/addresses`, `/me` |
| 판매자 배송 | 배송 건 목록 조회, `PREPARING` 배송의 운송장 입력·배송 시작 | `src/features/delivery`, `/seller/orders` |

### 화면은 있으나 목업 또는 부분 연동

| 영역 | 문제 | 관련 API |
| --- | --- | --- |
| 홈·일부 상품 보조 데이터 | 홈 화면에 정적 상품 배열이 남아 있음. 상품 목록 화면 자체는 API 사용 | `GET /api/v1/products` |
| 장바구니 | 백엔드에 고객 장바구니 공개 API가 없어 로컬 샘플 장바구니를 표시 | 현재 백엔드 공개 API 없음 |
| 결제 확정 | 결제 확정 API는 호출하지만 `MOCK-PAYMENT-*` 값을 전달해 실제 PG 결제가 아님 | `POST /api/v1/payments/confirm` |
| 주문 취소 | 백엔드 API는 있으나 고객·판매자 화면에 취소 흐름이 없음 | `POST /api/v1/orders/{orderId}/cancel` |
| 구매확정 | hook은 있으나 주문 상세 화면의 구매확정 UI가 없음 | `PATCH /api/v1/orders/{orderId}/items/{orderItemId}/confirm` |
| 배송 상세 | 배송 상세 단건 조회 화면은 아직 없고 주문 상세에서 배송 목록을 표시 | `GET /api/v1/deliveries/{deliveryId}` |
| 환불 | 고객 흐름은 연결됐고 판매자 승인·거절 화면은 없음 | `/api/v1/refunds/approve`, `/api/v1/refunds/{refundId}/reject` |
| 판매자 대시보드 | 주문 수·배송 대기·정산 금액이 정적 숫자 | 배송·정산 API |
| 관리자 대시보드 | 상품·재고·주문·환불·정산 운영 화면이 샘플 데이터 | 관리자 API 다수 |

### API는 있으나 프론트 기능이 없는 영역

| 영역 | 백엔드 API | 필요한 화면 |
| --- | --- | --- |
| 판매자 정산 | `GET /api/v1/settlements` | `/seller/settlements` 실제 목록·상세 |
| 관리자 정산 | `GET /api/v1/admin/settlements`, `PATCH /api/v1/settlements/complete` | `/admin/settlements` 운영 테이블·완료 처리 |
| 판매자 환불 운영 | `GET /api/v1/refunds`, `PATCH /api/v1/refunds/approve`, `PATCH /api/v1/refunds/{refundId}/reject` | `/seller/orders` 또는 별도 환불 관리 |
| 관리자 환불·배송 | `GET /api/v1/admin/refunds`, `GET /api/v1/admin/deliveries` | `/admin/orders` 운영 테이블 |
| 알림 | `GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`, `PATCH /api/v1/notifications/{notificationId}/read` | `/notifications`, 헤더 읽지 않은 알림 수 |
| 타임딜 알림 구독 | `/api/v1/notification-subscriptions/time-deals` | 타임딜 상세 알림 신청·해제 |
| 내 정보 변경 | `PATCH /api/v1/users/{id}`, `DELETE /api/v1/users/{id}` | `/me` 프로필 수정·탈퇴 |

## 3. 구현 순서

### 0단계 — 기준선 고정

목표: 이후 기능 작업이 서로 충돌하지 않도록 API 타입과 공통 상태를 정리합니다.

- [ ] 각 API의 응답 wrapper와 cursor·offset 페이지 타입 통일
- [ ] API 화면의 loading / empty / error / retry 상태 점검
- [ ] 서버 enum을 화면 라벨로 변환하는 공통 매핑 정리
- [ ] 목업 데이터가 남은 위치를 기능별로 제거 대상 표시

완료 기준: 새 API 연결 시 컴포넌트가 직접 URL을 만들지 않고 feature API·hook을 통해 호출합니다.

### 1단계 — 고객 주문 생명주기 완성

우선순위가 가장 높습니다. 이미 주문 목록·상세·주문 생성 API가 연결되어 있어, 구매 이후 흐름을 완성합니다.

1. 결제 확정의 실제 PG 연동
   - 결제 준비 응답의 `successUrl`, `failUrl`, `tossOrderId`, `amount`를 사용
   - `MOCK-PAYMENT-*` 제거
   - 결제 성공·실패·취소 화면 상태 정의
2. 주문 취소
   - 주문 상세에 취소 가능 상태와 취소 사유 입력 추가
   - `POST /api/v1/orders/{orderId}/cancel` 연결
3. 구매확정
   - 배송 완료 주문상품에 구매확정 버튼 추가
   - 성공 시 주문 상세 query 무효화
4. 고객 배송 조회
   - 주문 상세의 배송그룹을 배송 API 결과와 연결
   - 배송 상태·운송장·배송 완료 시각 표시
5. 환불 흐름
   - 환불 내역 조회, 환불 신청 취소, 환불 상태 표시 추가

### 2단계 — 장바구니 정책 결정 및 구현

현재 백엔드 `develop`에는 고객 장바구니 공개 API가 확인되지 않았습니다. 따라서 구현 전에 정책을 결정해야 합니다.

- 선택 A: 프론트 로컬 장바구니를 공식 범위로 유지하고 주문 생성 시 상품 목록으로 전달
- 선택 B: 백엔드에 장바구니 API를 추가한 뒤 서버 장바구니로 전환

백엔드 API가 추가되기 전에는 선택 B를 프론트에서 임의로 구현하지 않습니다.

### 3단계 — 판매자 운영 완성

현재 상품·재고·타임딜·배송 건은 연결됐으므로 운영 화면을 확장합니다.

1. 판매자 정산 목록·상세
   - `GET /api/v1/settlements`
   - 기간·상태·페이지네이션 표시
2. 판매자 환불 처리
   - 환불 요청 목록
   - 일괄 승인·개별 거절
3. 판매자 대시보드 실데이터
   - 배송 대기 건수는 배송 API로 계산
   - 정산 금액은 정산 API로 계산

주의: 판매자 주문 내역 목록을 새로 만들지 않고 배송 건 관리 범위만 유지합니다.

### 4단계 — 관리자 운영 화면

현재 관리자 상품·재고·주문·정산 화면은 정적 샘플입니다.

1. 관리자 상품·재고 운영 API 연결
2. 관리자 배송·환불 테이블 연결
3. 관리자 정산 조회와 정산 완료 처리
4. 운영 화면의 검색·필터·offset 페이지네이션 추가

관리자 화면은 고객·판매자 API를 재사용하지 않고 백엔드의 `/admin/*` endpoint와 role을 그대로 사용합니다.

### 5단계 — 알림과 계정 관리

1. 알림 목록·읽음 처리·읽지 않은 개수
2. 타임딜 알림 구독·해제
3. 헤더에 알림 진입점 추가

## 4. 다음 작업 단위

다음 구현 브랜치는 최신 `develop`에서 새로 생성하고, 아래 순서로 하나씩 진행합니다.

1. `feature/payment-real-flow`: 결제 확정 실제 흐름
2. `feature/order-cancel-confirm`: 주문 취소·구매확정
3. `feature/seller-settlement-refund`: 판매자 정산·환불 운영
4. `feature/admin-operation-api`: 관리자 상품·재고·주문·배송·환불·정산
5. `feature/notification-api`: 알림·타임딜 구독

각 단위는 구현 전 해당 백엔드 endpoint와 DTO를 다시 확인하고, 구현 후 `npm run lint`, `npm test`, `npm run build`를 실행합니다.

## 5. 범위 밖 또는 백엔드 결정 필요

- 고객 장바구니 서버 API 추가 여부
- 실제 결제 PG 키·SDK·결제 성공 callback 운영 설정
- 판매자 배송 응답에 주문번호·상품명·고객 배송지 정보를 추가할지 여부
- 관리자 주문 운영에서 필요한 취소·환불 권한과 필터 조건
- 알림 읽음 상태와 타임딜 구독의 UX 정책
-
## 현재 구현 보정 — 알림과 타임딜 구독

5단계 알림 기능은 다음 범위까지 구현되었습니다.

- 헤더 종 아이콘, 읽지 않은 알림 개수, 알림 목록, 읽음 처리
- `TIME_DEAL` 유형 알림 클릭 시 `/time-deals/{timeDealId}` 상세 이동
- 타임딜 목록·상세의 오픈 알림 신청 및 해제
- 타임딜별 구독 상태 단건 조회
- 오픈까지 15분 이하인 `SCHEDULED` 타임딜의 구독 버튼 비활성화

타임딜 구독 상태는 `GET /api/v1/notification-subscriptions/time-deals/{timeDealId}`로 확인합니다. 전체 구독 목록 조회 API는 사용하지 않습니다. 목록 조회 API의 `size`는 백엔드 기본값을 사용하며, 프론트에서 임의의 `size` query를 전달하지 않습니다.
