import Script from 'next/script';
import Link from 'next/link';
import { FAQAccordion } from '@/components/faq/FAQAccordion';
import { buildFAQPageSchema } from '@/lib/seo-schema';
import {
  PageShell,
  PageHero,
  PageContainer,
  SurfaceCard,
} from '@/components/layout/PageShell';

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
        a: '권리금, 보증금, 월세, 시설 상태, 임대차 계약 기간, 소방·위생 기준 충족 여부를 반드시 확인하세요. 계약서에 명확히 기재하고, 현장 실사를 권장합니다.'
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
  const faqSchema = buildFAQPageSchema(
    faqs.flatMap((cat) =>
      cat.items.map((item) => ({ question: item.q, answer: item.a }))
    )
  );

  return (
    <PageShell>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <PageHero
        title="자주 묻는 질문"
        description="PC방 창업, 거래, 구인구직에 관해 자주 묻는 질문들을 모았습니다."
        breadcrumb={[{ label: '홈', href: '/' }, { label: 'FAQ' }]}
      />

      <PageContainer narrow className="py-10 md:py-12">
        <FAQAccordion faqs={faqs} />

        <SurfaceCard className="cta-banner mt-16 mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-3">
            더 많은 매물을 확인하고 싶으신가요?
          </h2>
          <p className="text-text-secondary mb-6 text-sm">
            성피요에서는 전국 638개 이상의 성인PC 매물을 한눈에 볼 수 있습니다.
          </p>
          <Link
            href="/listings"
            className="inline-flex px-8 py-3 bg-gold text-bg-primary font-semibold rounded-xl hover:bg-gold-light transition-colors"
          >
            전체 매물 보기
          </Link>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">
            지역별 매물 확인
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['서울', '경기도', '인천', '부산', '대구'].map((region) => (
              <Link
                key={region}
                href={`/listings/region/${region}`}
                className="block p-4 bg-bg-tertiary hover:bg-gold/20 border border-border-light hover:border-gold rounded-lg text-center transition-colors"
              >
                <span className="font-semibold text-text-primary hover:text-gold">
                  {region}
                </span>
              </Link>
            ))}
          </div>
        </SurfaceCard>
      </PageContainer>
    </PageShell>
  );
}
