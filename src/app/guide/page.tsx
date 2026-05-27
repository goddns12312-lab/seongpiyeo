'use client';

import Link from 'next/link';
import { useState } from 'react';

const guides = [
  {
    id: 'fire-safety',
    title: 'PC방 소방기준 완벽 가이드 | 필수 시설부터 법규까지 2026년 최신',
    description: 'PC방 창업 시 필수인 소방기준을 상세히 설명합니다. 자동화재탐지설비, 스프링클러, 소화기 등 필수 시설과 안전검사 절차, 위반 시 처벌까지 완벽 가이드합니다.',
    category: '법규',
    readTime: '10분',
    date: '2026-05-27',
    keywords: ['PC방 소방기준', 'PC방 소방시설', '성인PC 법규', '소방검사'],
    content: `# PC방 소방기준 완벽 가이드 | 필수 시설부터 법규까지 2026년 최신

## PC방 필수 소방시설

PC방은 다중이용업소 중 하나로 엄격한 소방기준을 따릅니다.

### 1. 필수 소방시설 4가지

**① 자동화재탐지설비 (필수)**
- 천장에 설치되는 열감지기, 연기감지기 배치
- 비용: 200~400만 원
- 임차인 부담 (일부 건물주 부담도 있음)

**② 자동살수설비 (스프링클러)**
- 천장에 일정 간격으로 설치
- 면적에 따라 필요 수량 결정 (대략 20㎡당 1개)
- 비용: 1,000~2,000만 원 (가장 비싼 시설)
- 필수 설치로 불가항력

**③ 소화기**
- 100㎡당 최소 1개 이상 배치
- 정기적 점검 및 리필 필요
- 비용: 소화기당 30~50만 원

**④ 비상구 2개 이상**
- 서로 다른 방향으로 설치
- 환기 기능도 함께 갖춰야 함
- 비상 시 최대한 빠른 탈출 경로 보장

### 2. 추가 필수 요소

- **피난 표지**: 비상구, 피난통로 명확한 표시
- **유도등**: 비상 시 어두운 환경에서 탈출 경로 지시
- **안전 거리**: 비상구 앞 2m 이내 장애물 금지
- **환기 시스템**: 실내 공기 순환 필수

## 소방검사 절차

### 개업 전 검사 (필수)
1. 영업 신청 전 소방서에 설계 도면 제출
2. 소방서에서 기준 충족 여부 사전 확인
3. 시공 완료 후 소방검사 신청
4. 소방서 현장 검사 (보통 1~2주 소요)
5. 검사 합격 후 영업 허가 가능

### 정기 안전검사
- **연 1회 이상**: 소방서 정기 검사
- 적응검사 합격 후 안전관리 점수 부여

## 위반 시 처벌

| 위반 사항 | 처벌 내용 |
|---------|---------|
| 소방시설 미설치 | 영업 정지 + 과태료 1,000만 원 이상 |
| 허위 검사 기록 | 형사 처벌 + 과태료 |
| 소화기 미배치 | 과태료 200만 원 이상 |
| 비상구 폐쇄 | 과태료 500만 원 이상 + 영업 정지 |

## 소방기준 충족 팁

1. **초기부터 철저히**: 나중에 수리하는 것이 더 비싸고 번거로움
2. **소방서 사전 상담**: 개업 전에 반드시 확인
3. **정기적 점검**: 월 1회 이상 자체 점검
4. **직원 교육**: 모든 직원에게 화재 대피 교육
5. **점검 기록**: 점검 이력 철저히 기록 유지

## 성피요에서 확인하기

성인PC 창업의 모든 법규 정보는 성피요 커뮤니티 [소방&법규](/community/category/startup)에서 확인할 수 있습니다.

더 궁금한 점은 [고객센터](/support)에 문의하세요.`
  },
  {
    id: 'transfer',
    title: 'PC방 양도양수 완벽 가이드 | 권리금 이해부터 계약까지',
    description: 'PC방 기존 사업장을 인수할 때 필요한 양도양수 절차를 상세히 설명합니다. 권리금의 의미, 보증금과 월세의 차이, 안전한 계약 방법을 알려드립니다.',
    category: '거래',
    readTime: '11분',
    date: '2026-05-27',
    keywords: ['PC방 양도양수', '권리금', '보증금', 'PC방 인수'],
    content: `# PC방 양도양수 완벽 가이드 | 권리금 이해부터 계약까지

## PC방 양도양수란?

기존 PC방 사업장을 인수하는 것을 "양도양수"라고 합니다. 신규 오픈보다 고객층이 확보되어 초기 매출이 더 안정적입니다.

## 3가지 핵심 비용 개념

### 1. 권리금 (가장 중요)

**정의**: 기존 사업장의 영업권, 고객층, 평판 등에 대한 대가

\`\`\`
권리금 = 기존 고객 × 고객당 매출 기여도
\`\`\`

**특징**:
- 실제 자산이 아님 (PC, 의자 같은 물건은 별도)
- 양도인(팔려는 사람)과 양수인(사려는 사람) 합의로 결정
- 소비자 기본법의 예약금 규정이 아님 (따로 보호 받지 않음)

**일반적인 범위**:
- 매달 매출 1,000만 원 기준 약 2,000~3,000만 원
- 매달 매출 2,000만 원 기준 약 4,000~5,000만 원
- 강남/강서: 5,000~10,000만 원
- 지방 중소도시: 1,000~3,000만 원

**주의할 점**:
- 권리금이 높다고 무조건 좋은 것은 아님
- 실제 매출을 확인하고 권리금이 정당한지 검토 필수

### 2. 보증금 (월세를 위한 선입금)

**정의**: 건물주(임대인)에게 내는 신용금

**특징**:
- 영업 종료 시 전액 반환 (관례상)
- 수선비 등으로 일부 차감 가능
- 대개 월세의 3~5개월치 수준

**예시**:
- 월세 1,000만 원 → 보증금 3,000~5,000만 원

### 3. 월세 (매달 낼 임차료)

**정의**: 매달 건물주에게 내는 임대료

**특징**:
- 가장 예측 가능한 고정 비용
- 실제 영업이익 계산의 핵심 항목
- 지역, 시설, 입지에 따라 크게 변동

**일반적인 범위**:
- 서울: 월세 800만~1,500만 원
- 지방: 월세 300만~700만 원

## 양도양수 계약 시 필수 확인사항

### 1단계: 매출 확인
\`\`\`
□ 최근 3개월 일일 매출 기록 확인
□ 주말/주중 편차 확인
□ 계절 변동성 검토 (여름 방학, 겨울 시험 기간 등)
□ 평균 일일 손님 수 × 평균 체류 시간 계산
\`\`\`

### 2단계: 자산 목록 작성
\`\`\`
□ PC 상태, 모니터, 의자, 냉각기 등 목록 작성
□ 각 자산의 가격 결정 (별도 계약)
□ 수리 필요한 부분 기록
□ 사진으로 현황 기록
\`\`\`

### 3단계: 계약서 작성
\`\`\`
□ 권리금, 보증금, 월세 금액 명시
□ 인수 일자 명확히 기록
□ 기존 직원 인수 여부 결정
□ 임대차 계약 내용 확인 (기간, 갱신 조건 등)
□ 채무 현황 확인 (전기료, 수도료, 가스비 미납 여부)
□ 위반 사항 발견 시 책임 소재 명확히
\`\`\`

### 4단계: 전문가 검토
\`\`\`
□ 변호사나 법무사 검토 권장
□ 계약서 법적 문제 점검
□ 향후 분쟁 위험 사전 차단
\`\`\`

## 양도양수 계약 체크리스트

| 항목 | 확인 | 문서 |
|-----|------|------|
| 권리금 금액 | ☐ | 계약서 |
| 보증금 금액 | ☐ | 계약서 |
| 월세 금액 | ☐ | 임대차계약서 |
| 인수 일자 | ☐ | 계약서 |
| 임차기간 | ☐ | 임대차계약서 |
| 기존 직원 | ☐ | 합의서 |
| 자산 목록 | ☐ | 자산 목록표 |
| 채무 여부 | ☐ | 채무확인서 |
| 영업 신고 | ☐ | 구청 신고 |
| 보증금 반환 조건 | ☐ | 계약서 |

## 자주하는 실수

### ❌ 실수 1: 권리금만 보고 매출 확인 안 함
- 권리금이 낮다고 좋은 매장은 아님
- **해결**: 최소 1개월 매출 기록 직접 확인

### ❌ 실수 2: 임대차 계약 미확인
- 갑자기 건물주가 임대료 올릴 수 있음
- 건물 매각 시 상황 악화 가능
- **해결**: 임대차 계약서 상세 검토

### ❌ 실수 3: 기존 채무 미확인
- 전기료, 수도료 미납금이 있을 수 있음
- 세금 체납도 있을 수 있음
- **해결**: 구청에서 세금 미납 조회, 기존 사업자의 채무 확인

### ❌ 실수 4: 구두 합의만 하기
- 나중에 말한다는 것을 반박할 증거 부족
- **해결**: 반드시 서면 계약서 작성

## 성공적인 양도양수 팁

1. **충동 결정 금지**: 최소 1주일 이상 검토
2. **지인과 함께**: 신뢰할 수 있는 인물과 동반 방문
3. **계절 매출 이해**: 여름/겨울 차이 충분히 이해
4. **향후 전망**: 지역 개발, 대형점포 예정 등 확인
5. **기술 지원**: 사업 인수 후 기존 사업자의 노하우 전수 받기

## 성피요에서 확인하기

전국 PC방 양도양수 매물은 [성인PC 매물](/listings)에서 확인할 수 있습니다.

법적 조언이 필요하면 [고객센터](/support)에 문의하세요.`
  },
  {
    id: 'startup-cost',
    title: 'PC방 창업 완벽 가이드 | 초기비용부터 수익까지 2026년 최신판',
    description: 'PC방 창업에 필요한 정확한 비용과 예상 수익을 분석합니다. 권리금, 인테리어비, 운영비 등 단계별 예상금액과 수익성 높은 입지 선택 기준을 알려드립니다.',
    category: '창업',
    readTime: '12분',
    date: '2026-05-27',
    keywords: ['PC방 창업 비용', 'PC방 수익', '성인PC방', '창업 가이드'],
    content: `# PC방 창업 완벽 가이드 | 초기비용부터 수익까지 2026년 최신판

## PC방 창업에 드는 정확한 비용

PC방 창업은 2억 원 초반대 투자로 월 2-4천만 원 수익을 기대할 수 있는 사업입니다. 이 가이드에서 정확한 초기 비용과 예상 수익을 분석한 실제 사례를 소개합니다.

### 1. 권리금 (핵심 비용)
기존 사업장을 인수할 경우 가장 큰 비용입니다.
- 강남, 강서: 5,000~10,000만 원
- 일반 지역: 2,000~5,000만 원
- 신규 오픈 시: 0원 (하지만 인테리어 추가)

### 2. 인테리어 비용
- 기본: 1,500~2,000만 원 (기존 시설 활용)
- 고급: 2,500~4,000만 원 (신규 오픈)
- 포함 항목: 천장, 벽, 조명, 바닥재

### 3. PC 및 기자재
- PC 1대당 150~250만 원 (고사양)
- 7대 기준: 1,050~1,750만 원
- 의자, 책상, 냉각기: 500~800만 원

### 4. 기타 비용
- 보증금: 3,000~5,000만 원
- 간판, 인수 수수료: 500~1,000만 원
- 개업 신고, 허가: 100~200만 원

### 초기 투자 총액: 1.2억~2.5억 원

## 월별 운영비 분석

| 항목 | 최소 | 평균 | 최대 |
|-----|------|------|------|
| 월세 | 500만 | 800만 | 1,500만 |
| 전기료 | 150만 | 250만 | 400만 |
| 인터넷 | 30만 | 50만 | 100만 |
| 직원급여 | 400만 | 600만 | 1,000만 |
| 유지보수 | 100만 | 150만 | 300만 |
| 기타 | 50만 | 100만 | 200만 |
| **합계** | **1.23억** | **1.95억** | **3.5억** |

## 현실적인 수익 예측

- **월 매출**: 3,000~5,000만 원 (PCH당 20~30만 원)
- **운영비**: 1,500~2,000만 원
- **순이익**: 1,000~3,000만 원

## 투자 회수 기간

- 초기 투자: 1.5억 원 (평균)
- 월 순이익: 1,500만 원 (평균)
- **회수 기간: 약 10개월**

## 성공적인 PC방 창업 팁

1. **입지 선택**: 학생가, 상권 중심부, 접근성 좋은 곳
2. **차별화**: 게임 종류, 인테리어, 서비스 품질
3. **관리**: 주기적 청소, PC 유지보수, 손님 응대
4. **금융**: 신용대출, 정부 지원금 활용

## 성피요에서 확인하기

성피요에서는 전국 PC방 매물을 확인할 수 있습니다.
[성인PC 매물 보기](/listings)

더 자세한 상담은 [고객센터](/support)에 문의하세요.`
  }
];

export default function GuidePage() {
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  return (
    <div className="bg-bg-primary min-h-screen py-8 lg:py-12">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-6 transition-colors">
            <span>←</span>
            <span>홈으로</span>
          </Link>

          <h1 className="text-4xl lg:text-5xl font-bold text-text-primary mb-4">
            PC방 창업 가이드
          </h1>
          <p className="text-text-secondary text-lg">
            PC방 창업에 필요한 모든 정보를 한 곳에서 확인하세요.
          </p>
        </div>

        {/* Guide List */}
        <div className="space-y-4 mb-12">
          {guides.map(guide => (
            <div key={guide.id} className="bg-bg-secondary border border-border-light rounded-lg overflow-hidden hover:border-gold transition-all">
              <button
                onClick={() => setSelectedGuide(selectedGuide === guide.id ? null : guide.id)}
                className="w-full p-6 text-left hover:bg-bg-tertiary transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-text-primary hover:text-gold mb-2">
                      {guide.title}
                    </h2>
                    <p className="text-text-secondary mb-3 line-clamp-2">
                      {guide.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span className="bg-gold/10 text-gold px-2 py-1 rounded">
                        {guide.category}
                      </span>
                      <span>📖 {guide.readTime}</span>
                      <span>{guide.date}</span>
                    </div>
                  </div>
                  <span className={`text-gold flex-shrink-0 transition-transform ${selectedGuide === guide.id ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </button>

              {selectedGuide === guide.id && (
                <div className="px-6 py-8 bg-bg-tertiary border-t border-border-light prose prose-invert max-w-none">
                  <div className="text-text-primary whitespace-pre-wrap leading-relaxed">
                    {guide.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-3">
            더 자세한 정보가 필요하신가요?
          </h2>
          <p className="text-text-secondary mb-6">
            PC방 창업에 관한 모든 질문을 FAQ에서 확인하세요.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/faq">
              <button className="bg-gold hover:bg-gold/90 text-bg-primary font-bold px-6 py-3 rounded-lg transition-colors">
                자주 묻는 질문 보기
              </button>
            </Link>
            <Link href="/listings">
              <button className="border border-gold text-gold hover:bg-gold/10 font-bold px-6 py-3 rounded-lg transition-colors">
                전국 PC방 매물 보기
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
