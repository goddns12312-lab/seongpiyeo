'use client';

import { Button } from '@/components/ui/Button';
import {
  PageShell,
  PageHero,
  PageContainer,
  SectionHeader,
  SurfaceCard,
} from '@/components/layout/PageShell';

export default function SupportPage() {
  const faqs = [
    {
      id: 1,
      question: '매물 등록은 어떻게 하나요?',
      answer: '로그인 후 "매물 등록" 버튼을 클릭하여 필요한 정보를 입력하고 사진을 올리면 됩니다.',
    },
    {
      id: 2,
      question: '등록한 매물을 삭제하려면?',
      answer: '마이페이지에서 해당 매물을 선택한 후 "삭제" 버튼을 클릭하면 됩니다.',
    },
    {
      id: 3,
      question: '회원가입은 필수인가요?',
      answer: '매물 등록이나 커뮤니티 글작성을 위해서는 회원가입이 필요합니다.',
    },
    {
      id: 4,
      question: '거래 수수료가 있나요?',
      answer: '기본적으로 무료 플랫폼이며, 특정 서비스에 대해서만 수수료가 발생할 수 있습니다.',
    },
    {
      id: 5,
      question: '거래 분쟁이 발생했을 때는?',
      answer: '고객센터로 문의해주시면 중재를 통해 문제 해결을 도와드립니다.',
    },
  ];

  return (
    <PageShell>
      <PageHero
        title="고객센터"
        description="도움이 필요하신가요? 아래에서 빠르게 답을 찾거나 문의해 주세요."
        breadcrumb={[{ label: '홈', href: '/' }, { label: '고객센터' }]}
      />

      <PageContainer narrow className="py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <SurfaceCard hover className="p-6">
            <h2 className="text-lg font-semibold text-gold-dark dark:text-gold mb-3">이메일</h2>
            <p className="text-text-primary font-medium mb-2">support@pc365.kr</p>
            <p className="text-text-muted text-sm">24시간 문의 접수 가능합니다.</p>
          </SurfaceCard>
          <SurfaceCard hover className="p-6">
            <h2 className="text-lg font-semibold text-gold-dark dark:text-gold mb-3">전화</h2>
            <p className="text-text-primary font-medium mb-2">1588-1234</p>
            <p className="text-text-muted text-sm">평일 10:00 – 18:00</p>
          </SurfaceCard>
        </div>

        <SectionHeader title="자주 묻는 질문" />

        <div className="space-y-4 mb-12">
          {faqs.map((faq) => (
            <SurfaceCard key={faq.id} className="p-6" as="article">
              <h3 className="text-text-primary font-semibold mb-3">Q. {faq.question}</h3>
              <p className="text-text-secondary text-sm leading-relaxed pl-4 border-l-2 border-gold/30">
                {faq.answer}
              </p>
            </SurfaceCard>
          ))}
        </div>

        <SurfaceCard className="cta-banner">
          <h2 className="text-xl font-semibold text-text-primary mb-3">더 도움이 필요하신가요?</h2>
          <p className="text-text-secondary mb-6 text-sm">
            위 내용으로 해결되지 않는 문제는 이메일이나 전화로 문의해 주세요.
          </p>
          <a href="mailto:support@pc365.kr">
            <Button variant="primary">문의하기</Button>
          </a>
        </SurfaceCard>
      </PageContainer>
    </PageShell>
  );
}
