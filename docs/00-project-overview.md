# 프로젝트 개요

## 목적

Parut 서비스의 웹 프론트엔드를 개발합니다. 백엔드와 분리된 레포지토리에서 React 기반의 반응형 웹 화면과 API 연동을 관리합니다.

## 저장소

- Frontend: https://github.com/52saseyo/parut_frontend
- Backend: https://github.com/52saseyo/parut
- 기준 백엔드 브랜치: `develop`
- 프론트엔드 기본 개발 브랜치: `develop`
- 안정 브랜치: `main`

## 초기 범위

- 데스크톱과 모바일 브라우저에서 사용할 수 있는 반응형 웹
- 백엔드 API를 통한 데이터 조회 및 변경
- 사용자 인증과 권한에 따른 화면 제어
- 로딩, 빈 화면, 오류 상태를 포함한 사용자 경험 제공

## 결정이 필요한 항목

- 사용자 역할별 화면 범위
- API Gateway 주소와 서비스별 엔드포인트
- 인증 토큰 저장 및 갱신 방식
- 배포 환경과 도메인
