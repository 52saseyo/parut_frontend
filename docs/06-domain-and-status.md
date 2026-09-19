# 도메인 및 상태 정책

이 문서는 백엔드 `develop` 브랜치의 도메인 enum과 컨트롤러를 확인해 프론트엔드에서 사용할 기준을 정리한 문서입니다. 실제 API 응답과 기획이 변경되면 함께 갱신합니다.

## 사용자 및 권한

| 역할             | 의미                  | 주요 화면 후보                   |
| ---------------- | --------------------- | -------------------------------- |
| `CUSTOMER`       | 일반 구매자           | 상품 탐색, 주문, 결제, 배송 조회 |
| `SELLER`         | 판매자                | 상품 관리, 재고, 주문·배송 관리  |
| `PENDING_SELLER` | 판매 승인 대기 판매자 | 입점 신청 상태                   |
| `ADMIN`          | 관리자                | 판매자 승인, 운영 관리           |

판매자 신청 상태는 `PENDING`, `APPROVED`, `REJECTED`입니다.

## 상품

- 카테고리: `VEGETABLE`, `FRUIT`, `GRAIN`, `ETC`
- 판매 단위: `G`, `KG`, `EA`, `BOX`
- 외관 유형: `NORMAL`, `UGLY`
- 상품 상태: `DRAFT`, `ON_SALE`, `SOLD_OUT`, `SUSPENDED`, `DELETED`

상품 목록과 상세 화면에서는 상태를 그대로 노출하지 않고 사용자에게 이해하기 쉬운 한국어 라벨과 화면별 행동 가능 여부로 변환합니다.

## 주문 흐름

주문 유형은 `NORMAL`과 `TIME_DEAL`로 구분됩니다.

### 주문 상태

`CREATED → STOCK_RESERVED → PAYMENT_PENDING → PAID`

처리 실패나 취소 흐름에서는 `ABORTED`가 사용될 수 있습니다. 화면에서는 상태값을 단계 표시, 버튼 활성화, 안내 문구에 각각 활용합니다.

### 주문 상품 상태

`ORDERED`, `CANCELED`, `REFUND_REQUESTED`, `REFUNDED`, `CONFIRMED`

주문 전체 상태와 주문 상품 상태는 서로 다를 수 있으므로 한 상태값으로 합치지 않습니다.

## 결제·배송·환불

- 결제: `READY`, `IN_PROGRESS`, `DONE`, `PARTIAL_CANCELED`, `CANCELED`, `ABORTED`
- 배송: `PREPARING`, `SHIPPED`, `DELIVERED`
- 환불: `REQUESTED`, `APPROVED`, `REJECTED`, `CANCELED`

결제·배송·환불 상태는 서버 응답을 기준으로 표시하고, 프론트엔드에서 상태를 임의로 변경하지 않습니다.

## 알림

현재 백엔드에 정의된 알림 유형은 주문 완료, 배송 시작·완료, 환불 승인·거절, 정산 완료, 타임딜 오픈 임박입니다. 알림 화면은 유형별 제목과 이동 대상(reference)을 분리해 처리할 수 있도록 설계합니다.
