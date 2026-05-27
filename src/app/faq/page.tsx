'use client';

import Link from 'next/link';
import { useState } from 'react';

const faqs = [
  {
    category: '창업 & 비용',
    items: [
      {
        q: '성피요는 어떤 사이트인가요?',
        a: '성인PC 성인피씨 창업 정보와 매물을 거래하는 플랫폼입니다. 성인PC방 창업을 준비하는 분들을 위해 정확한 매물 정보, 권리금, 보증금, 월세 등을 투명하게 공개합니다.'
      },
      {
        q: 'PC방 창업에 드는 정확한 비용은 얼마인가요?',
        a: '지역과 규모에 따라 다르지만, 일반적으로 초기비용은 5,000만원~2억원입니다. 권리금 2,000~5,000만원 + 인테리어 2,000만원 + 장비 1,500만원 + 기타 1,000만원 정도 예상하시면 됩니다.'
      },
      {
        q: '월별 운영비는 어느 정도인가요?',
        a: '월세(보증금 + 임차료), 전기료, 인터넷 비용, 직원 급여, 유지보수 등을 포함하면 월 500~1,500만원입니다. 지역과 규모에 따라 크게 달라집니다.'
      },
      {
        q: '실제 수익은 얼마나 될까요?',
        a: '월 매출 3,000~5,000만원에서 운영비를 제외하면 월 순이익 500~1,500만원 정도입니다. 입지, 시설, 관리에 따라 크게 달라집니다.'
      },
      {
        q: '투자금 회수 기간은 어떻게 되나요?',
        a: '초기 투자 1.5억원 기준으로 월 순이익 1,000만원 시 약 15개월, 1,500만원 시 10개월 정도 예상됩니다.'
      }
    ]
  },
  {
    category: '소방 & 법규',
    items: [
      {
        q: 'PC방에 필수 소방 시설은 무엇인가요?',
        a: '「다중이용업소의 안전관리에 관한 특별법」에 따라 자동화재탐지설비, 자동살수설비(스프링클러), 소화기, 비상구 2개 이상이 필수입니다.'
      },
      {
        q: '학교 주변에서 PC방을 운영할 수 있나요?',
        a: '학교환경위생정화구역(반경 200m)에 따라 다릅니다. 50m 이내는 불가, 50~200m는 심의 필요, 200m 초과는 허가 가능합니다. 정확한 위치는 우리 사이트의 학교환경위생정화구역 조회 도구를 사용하세요.'
      },
      {
        q: '성인PC방과 일반 PC방의 차이가 뭔가요?',
        a: '성인PC방은 사행성 게임 제한 규정이 일반 PC방보다 더 엄격합니다. 법규 준수가 매우 중요합니다.'
      },
      {
        q: 'PC방 영업 허가는 어떻게 받나요?',
        a: '시/군/구청에 신청하며, 소방 기준, 위생 기준, 학교 반경 기준을 만족해야 합니다. 지역마다 상이하므로 관할청에 문의하세요.'
      }
    ]
  },
  {
    category: '거래 & 계약',
    items: [
      {
        q: '권리금이란 무엇인가요?',
        a: '권리금은 기존 사업장의 영업권, 고객층, 시설 등을 양도받을 때 지불하는 금액입니다. 실제 자산(PC, 의자 등)이 아닌 영업 기반에 대한 대가입니다.'
      },
      {
        q: '양도양수 계약 시 주의사항은?',
        a: '계약서 작성 시 권리금, 보증금, 월세, 시설 상태, 채무 현황 등을 명확히 기록하세요. 전문가 검토를 권장합니다.'
      },
      {
        q: '보증금은 돌려받나요?',
        a: '네. 보증금은 임대차 계약 종료 시 관례적으로 전액 반환됩니다. 다만 수선비 등으로 일부 차감될 수 있습니다.'
      },
      {
        q: '매물 구분 기준이 뭔가요?',
        a: '우리 사이트에서는 매물을 매매/양도양수와 임대로 구분합니다. 권리금을 포함한 경우 매매, 월세만 있는 경우 임대입니다.'
      }
    ]
  },
  {
    category: '구인 & 채용',
    items: [
      {
        q: 'PC방 직원 급여는 어떻게 되나요?',
        a: '지역과 경력에 따라 다르지만, 알바 시급 10,000~12,000원, 정직원 월급 1,800~2,500만원 정도입니다.'
      },
      {
        q: 'PC방 관리자의 역할이 뭔가요?',
        a: '시스템 관리, 손님 관리, 청소, 기자재 유지보수, 매출 관리 등을 담당합니다.'
      },
      {
        q: '구인공고는 어디서 올리나요?',
        a: '성피요의 구인구직 페이지에서 무료로 공고를 올릴 수 있습니다. 로그인 후 "공고 등록" 버튼을 클릭하세요.'
      }
    ]
  },
  {
    category: '중고 거래',
    items: [
      {
        q: '중고 기자재는 어디서 구하나요?',
        a: '성피요의 중고장터에서 중고 PC, 모니터, 의자, 냉각기 등을 저렴하게 구할 수 있습니다.'
      },
      {
        q: '중고 기자재 품질 보장이 되나요?',
        a: '거래는 구매자와 판매자 간 직접 이루어집니다. 구매 전 상세 정보와 사진을 충분히 확인하세요.'
      },
      {
        q: '반품이나 교환이 가능한가요?',
        a: '중고 거래이므로 반품/교환은 거래자 간 협의해야 합니다. 성피요는 거래 플랫폼만 제공합니다.'
      }
    ]
  },
  {
    category: '커뮤니티',
    items: [
      {
        q: '커뮤니티는 어떻게 이용하나요?',
        a: '성피요 커뮤니티에서 PC방 창업, 인테리어, 장비, 자유주제 등 다양한 정보를 공유할 수 있습니다. 로그인 후 자유롭게 글을 작성하세요.'
      },
      {
        q: '글 작성이나 댓글은 무료인가요?',
        a: '네. 모든 커뮤니티 활동은 무료입니다.'
      }
    ]
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.flatMap(cat =>
      cat.items.map(item => ({
        '@type': 'Question',
        'name': item.q,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': item.a
        }
      }))
    )
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>

      <div className="bg-bg-primary min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-text-primary mb-4">
              자주 묻는 질문
            </h1>
            <p className="text-text-secondary text-lg">
              PC방 창업, 거래, 구인구직에 관해 자주 묻는 질문들을 모았습니다.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-6">
            {faqs.map((category, catIdx) => (
              <div key={catIdx}>
                <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                  <span className="w-1 h-8 bg-gold rounded-full"></span>
                  {category.category}
                </h2>

                <div className="space-y-2 ml-4">
                  {category.items.map((faq, itemIdx) => {
                    const key = `${catIdx}-${itemIdx}`;
                    const isOpen = openIndex === key;

                    return (
                      <div
                        key={key}
                        className="bg-bg-secondary border border-border-light rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => setOpenIndex(isOpen ? null : key)}
                          className="w-full p-5 flex items-start justify-between hover:bg-bg-tertiary transition-colors text-left"
                        >
                          <span className="text-text-primary font-semibold flex-1 pr-4">
                            Q. {faq.q}
                          </span>
                          <span className={`text-gold flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </button>

                        {isOpen && (
                          <div className="px-5 py-4 bg-bg-tertiary border-t border-border-light">
                            <p className="text-text-secondary">
                              <span className="text-gold font-semibold">A. </span>
                              {faq.a}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 p-6 bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 rounded-lg text-center">
            <p className="text-text-primary mb-4">
              더 궁금한 점이 있으신가요?
            </p>
            <Link href="/support">
              <button className="bg-gold hover:bg-gold/90 text-bg-primary font-bold px-8 py-3 rounded-lg transition-colors">
                고객센터 문의
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
