# Parut 전체 서비스 UI·UX 및 화면 설계

## 1. 설계 방향

Parut은 농수산물을 사고파는 커머스 서비스입니다. 일반 고객의 구매 흐름을 중심으로 하되, 판매자와 관리자가 상품·재고·주문·정산을 운영할 수 있는 전체 서비스 화면을 함께 제공합니다. 타임딜은 별도 서비스가 아니라 상품과 주문에 연결된 하나의 판매 방식으로 취급합니다.

초기 화면은 실제 API가 연결되지 않아도 로컬에서 전체 정보 구조를 확인할 수 있도록 목업 상태를 지원합니다. API 계약이 확정된 기능부터 Axios와 TanStack Query로 연결합니다.

## 2. 역할별 기능 범위

### 고객

- 회원가입, 일반 로그인, 로그아웃, 토큰 재발급
- 상품 탐색, 검색·카테고리, 상품 상세
- 타임딜 상품과 일반 상품 구매
- 주문 생성, 결제 준비·확정
- 주문·결제·배송 상태 조회
- 주문 취소, 환불 신청, 구매확정
- 알림 조회와 타임딜 알림 구독
- 내 정보 조회·수정·탈퇴

### 판매자

- 판매자 입점 신청과 승인 상태 조회
- 내 판매자 정보 조회·수정
- 상품 등록·조회·수정·삭제
- 상품 이미지 업로드
- 상품 판매 상태 변경
- 재고 조회·조정·예약 복구
- 주문 확인과 배송 시작
- 정산 현황 조회

### 관리자

- 판매자 신청 목록과 승인·거절
- 전체 사용자·판매자 운영 조회
- 상품·재고 운영 확인
- 주문·환불·배송 운영
- 정산 현황 확인

## 3. 백엔드 기능과 화면 매핑

| 백엔드 기능       | 화면                                  | 역할               | 우선순위 |
| ----------------- | ------------------------------------- | ------------------ | -------- |
| `auth`            | 로그인, 회원가입, 로그아웃, 토큰 갱신 | 전체               | 1        |
| `products`        | 상품 목록·상세·검색·카테고리          | 고객               | 1        |
| `orders`          | 주문 생성·목록·상세·취소·구매확정     | 고객·판매자·관리자 | 1        |
| `payments`        | 결제 준비·확정·취소                   | 고객               | 1        |
| `deliveries`      | 배송 조회·배송 시작                   | 고객·판매자        | 1        |
| `seller/products` | 상품 CRUD·상품 상태                   | 판매자             | 1        |
| `stocks`          | 재고 조회·조정·이력                   | 판매자·관리자      | 1        |
| `sellers`         | 입점 신청·판매자 관리                 | 판매자·관리자      | 1        |
| `refunds`         | 환불 신청·승인·거절·취소              | 고객·판매자·관리자 | 2        |
| `notifications`   | 알림 목록·읽음·구독                   | 고객               | 2        |
| `settlements`     | 정산 조회·운영                        | 판매자·관리자      | 2        |
| `time-deals`      | 타임딜 등록·조회·구매·재고            | 고객·판매자        | 2        |

## 4. 화면 구조

### 공통

- `/`: 고객 홈
- `/login`, `/signup`: 인증
- `/products`, `/products/:productId`: 상품 탐색·상세
- `/time-deals`, `/time-deals/:timeDealId`: 타임딜
- `/checkout`: 주문 확인·결제 진입
- `/orders`, `/orders/:orderId`: 주문 목록·상세
- `/notifications`: 알림
- `/me`: 내 정보

### 판매자

- `/seller`: 판매자 대시보드
- `/seller/apply`: 입점 신청
- `/seller/products`, `/seller/products/new`, `/seller/products/:productId/edit`: 상품 관리
- `/seller/stocks`: 재고 관리
- `/seller/orders`: 주문·배송 관리
- `/seller/settlements`: 정산

### 관리자

- `/admin`: 운영 대시보드
- `/admin/sellers`: 판매자 승인
- `/admin/products`: 상품 운영
- `/admin/orders`: 주문·환불 운영
- `/admin/stocks`: 재고 운영
- `/admin/settlements`: 정산 운영

## 5. UI 기준

- Primary: `emerald` 계열 — 신선함, 농수산물, 신뢰
- Accent: `orange` 계열 — 할인, 타임딜, 진행 중인 작업
- Neutral: `slate` 계열 — 본문, 카드, 경계
- Danger: `red` 계열 — 오류, 품절, 취소, 거절

초기에는 Tailwind 기본 색상을 사용하고, 로고와 브랜드 컬러가 확정되면 CSS 변수로 치환합니다.

공통 컴포넌트는 `AppHeader`, `Sidebar`, `ProductCard`, `TimeDealCard`, `OrderStatus`, `StatusBadge`, `DataTable`, `FormField`, `EmptyState`, `ErrorState`, `LoadingSkeleton` 순서로 확장합니다.

## 6. 서버 상태와 화면 상태

- 서버 데이터: TanStack Query
- 입력·모달·탭·사이드바: React state
- API 전송: Axios
- 역할·인증 상태: 인증 전용 hook/context로 관리
- 모든 API 화면은 loading, success, empty, error 상태를 구현

주문, 결제, 배송, 환불의 상태는 백엔드 enum을 화면용 라벨과 색상으로 변환하되 서버 값을 임의로 변경하지 않습니다.

## 7. 구현 순서

1. 전체 공통 레이아웃과 역할별 내비게이션
2. 고객 상품·주문·결제·배송 흐름
3. 인증과 권한에 따른 라우트 보호
4. 판매자 상품·재고·주문 관리
5. 관리자 판매자·상품·주문·환불 운영
6. 알림·환불·정산·타임딜 세부 기능
7. 각 화면의 실제 API 연결과 예외 상태 검증
