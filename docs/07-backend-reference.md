# 백엔드 연동 참고

## 참고 기준

- 저장소: https://github.com/52saseyo/parut
- 기준 브랜치: `develop`
- 로컬 참고 위치: `../final_project`
- API 공유 문서: 백엔드 저장소의 `docs/postman`

백엔드 README에는 상세 도메인 설명이 많지 않으므로, 초기 프론트엔드 문서는 서비스 코드의 controller, DTO, enum과 Postman 컬렉션을 함께 기준으로 작성합니다.

## 서비스 경계

| 서비스               | 외부 API 그룹                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| user-service         | `/api/v1/auth`, `/api/v1/users`, `/api/v1/sellers`                                                      |
| product-service      | `/api/v1/products`, `/api/v1/seller/products`, `/api/v1/stocks`, `/api/v1/time-deals`, `/api/v1/images` |
| order-service        | `/api/v1/orders`, `/api/v1/payments`, `/api/v1/deliveries`, `/api/v1/refunds`, `/api/v1/settlements`    |
| notification-service | `/api/v1/notifications`, `/api/v1/notification-subscriptions`                                           |

타임딜의 공개 조회는 `/api/v1/time-deals`를 사용하고, 판매자 전용 생성·목록·수정·삭제·중지·재고 작업은 `/api/v1/time-deals/seller` 하위 endpoint를 사용합니다. 판매자 API의 목록은 cursor 기반이며 `cursor`, `cursorId`, `size`를 사용합니다.

프론트엔드는 개별 서비스 주소가 아니라 API Gateway의 base URL을 사용합니다. 로컬 기본값은 `.env.example`의 `http://localhost:8080`입니다.

## 인증 흐름

1. 로그인 성공 응답에서 `accessToken`, `refreshToken`을 받습니다.
2. 인증이 필요한 요청은 `Authorization: Bearer <accessToken>`을 사용합니다.
3. access token 만료 시 `Refresh-Token` 헤더로 `/api/v1/auth/reissue`를 호출하는 흐름을 검토합니다.
4. 로그아웃은 `Authorization` 헤더로 `/api/v1/auth/logout`을 호출합니다.
5. 토큰 저장 위치와 갱신 동시성 제어는 실제 보안 정책을 확인한 뒤 확정합니다.

Gateway 기준으로 일반 회원·판매자 로그인, 회원가입, 관리자 로그인, 판매자 입점 신청은 공개 경로이고, 그 외 요청은 Bearer 인증이 필요합니다. 프론트엔드가 `X-User-Id` 또는 `X-User-Role`을 직접 조작하지 않습니다. 해당 값은 Gateway가 검증 후 전달합니다.

## 응답 형식

일반 응답은 서비스별 `ApiResponse` 래퍼를 사용할 수 있으며, 기본적으로 `code`, `data`, `traceId`, `timestamp` 필드를 확인합니다. 목록 응답은 offset 또는 cursor 기반 페이지 정보와 `content`를 포함할 수 있습니다. API별 실제 DTO를 우선하며, 모든 응답을 하나의 타입으로 강제하지 않습니다.

## Postman 규칙

백엔드 Postman 문서의 다음 규칙을 프론트엔드 API 모듈에도 반영합니다.

- 서비스별 base URL을 사용합니다.
- 실제 UUID와 시크릿을 소스 코드에 넣지 않습니다.
- `internal` API는 서비스 간 통신용이므로 일반 사용자 화면에서 호출하지 않습니다.
- API 변경 시 관련 타입, query key, 화면 상태와 문서를 함께 갱신합니다.

## 확인이 필요한 사항

- 실제 Gateway의 로컬·개발·운영 주소
- access/refresh token 저장 정책
- API별 응답 래퍼 적용 여부
- Postman 컬렉션과 현재 controller의 불일치 여부
- 사용자 화면에서 우선 제공할 MVP 흐름
