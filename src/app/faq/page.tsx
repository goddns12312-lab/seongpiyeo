import { Metadata } from 'next';
import Script from 'next/script';
import { SITE_CONFIG } from '@/lib/site';
import { FAQAccordion } from '@/components/faq/FAQAccordion';

export const metadata: Metadata = {
  title: '성인PC 창업 자주 묻는 질문 | PC방 매물 비용 법규 | 성피요',
  description: '성인PC방 창업 비용, 법규, 거래 방법, 구인구직 등 자주 묻는 질문(FAQ)을 한 곳에서 확인하세요. 초기비용 5,000만원~2억원, 월순이익 500~1,500만원.',
  keywords: [
    '성인PC FAQ',
    '성인피씨 자주묻는질문',
    'PC방 창업 비용',
    'PC방 월세',
    '권리금 설명',
    'PC방 보증금',
    '성인PC법규',
    '성인피씨 소방',
    'PC방 수익',
    'PC방 창업 가이드'
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/faq`,
  },
  openGraph: {
    title: '성인PC 창업 자주 묻는 질문 | 성피요',
    description: '성인PC방 창업, 법규, 거래, 구인구직 FAQ - 초기비용부터 수익까지 모든 질문에 답변합니다.',
    type: 'website',
    url: `${SITE_CONFIG.url}/faq`,
    siteName: SITE_CONFIG.businessName,
    images: [
      {
        url: `${SITE_CONFIG.url}/og-faq.png`,
        width: 1200,
        height: 630,
        alt: '성인PC 창업 자주 묻는 질문',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '성인PC 창업 자주 묻는 질문',
    description: '성인PC방 창업 비용, 법규, 거래 정보 FAQ',
    images: [`${SITE_CONFIG.url}/og-faq.png`],
  },
};

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
        q: '성피요에서 직원을 구할 수 있나요?',
        a: '네. 성피요 구인공고 게시판에서 PC방 직원 모집 공고를 올릴 수 있습니다. 무료로 이용할 수 있습니다.'
      },
      {
        q: '구인공고 등록은 어떻게 하나요?',
        a: '로그인 후 "구인공고" 섹션에서 "새 공고 올리기"를 클릭하여 직종, 급여, 근무 시간 등을 입력하면 됩니다.'
      }
    ]
  },
  {
    category: '중고 거래',
    items: [
      {
        q: 'PC방 장비를 중고로 살 수 있나요?',
        a: '네. 성피요 중고장터에서 PC방 운영에 필요한 장비(PC, 의자, 책상, 냉난방기 등)를 중고 가격으로 구매할 수 있습니다.'
      },
      {
        q: '중고 물품은 어떻게 판매하나요?',
        a: '로그인 후 "중고장터"에서 판매 물품을 등록하면 됩니다. 사진, 설명, 가격을 입력하세요.'
      },
      {
        q: '거래는 어떻게 이루어지나요?',
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
  // Build FAQ schema for Google Rich Results
  const faqSchema = {
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
    <div className="bg-bg-primary min-h-screen py-12">
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

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

        {/* FAQ Accordion */}
        <FAQAccordion faqs={faqs} />

        {/* Footer CTA */}
        <div className="mt-16 p-8 bg-bg-secondary border border-border-light rounded-lg text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            더 많은 매물을 확인하고 싶으신가요?
          </h2>
          <p className="text-text-secondary mb-6">
            성피요에서는 전국 638개 이상의 성인PC 매물을 한눈에 볼 수 있습니다.
          </p>
          <a
            href="/listings"
            className="inline-block px-8 py-3 bg-gold text-bg-primary font-semibold rounded-lg hover:bg-gold-light transition-colors"
          >
            전체 매물 보기
          </a>
        </div>
      </div>
    </div>
  );
}
