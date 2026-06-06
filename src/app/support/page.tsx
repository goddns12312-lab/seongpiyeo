'use client';

import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const router = useRouter();

  const handleContact = () => {
    window.location.href = 'mailto:support@pc365.kr';
  };
  const faqs = [
    {
      id: 1,
      question: '매물 등록은 어떻게 하나요?',
      answer: '로그인 후 "매물 등록" 버튼을 클릭하여 필요한 정보를 입력하고 사진을 올리면 됩니다.'
    },
    {
      id: 2,
      question: '등록한 매물을 삭제하려면?',
      answer: '마이페이지에서 해당 매물을 선택한 후 "삭제" 버튼을 클릭하면 됩니다.'
    },
    {
      id: 3,
      question: '회원가입은 필수인가요?',
      answer: '매물 등록이나 커뮤니티 글작성을 위해서는 회원가입이 필요합니다.'
    },
    {
      id: 4,
      question: '거래 수수료가 있나요?',
      answer: '기본적으로 무료 플랫폼이며, 특정 서비스에 대해서만 수수료가 발생할 수 있습니다.'
    },
    {
      id: 5,
      question: '거래 분쟁이 발생했을 때는?',
      answer: '고객센터로 문의해주시면 중재를 통해 문제 해결을 도와드립니다.'
    }
  ];

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-text-primary mb-4">고객센터</h1>
        <p className="text-text-secondary text-lg mb-8">도움이 필요하신가요? 여기서 지원을 받으세요.</p>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-bg-secondary border border-border-light rounded-lg p-6 hover:border-gold transition-colors">
            <h2 className="text-xl font-semibold text-gold mb-3">📧 이메일</h2>
            <p className="text-text-secondary mb-2">support@pc365.kr</p>
            <p className="text-text-secondary text-sm">24시간 문의 접수 가능합니다.</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-6 hover:border-gold transition-colors">
            <h2 className="text-xl font-semibold text-gold mb-3">☎️ 전화</h2>
            <p className="text-text-secondary mb-2">1588-1234</p>
            <p className="text-text-secondary text-sm">평일 10:00 - 18:00</p>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="text-2xl font-bold text-text-primary mb-6">자주 묻는 질문</h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-bg-secondary border border-border-light rounded-lg p-6 hover:border-gold transition-colors">
              <h3 className="text-text-primary font-semibold mb-3 text-lg">Q. {faq.question}</h3>
              <p className="text-text-secondary ml-6">A. {faq.answer}</p>
            </div>
          ))}
        </div>

        {/* Additional Help */}
        <div className="mt-12 bg-bg-secondary border-2 border-gold/50 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-gold mb-3">더 도움이 필요하신가요?</h2>
          <p className="text-text-secondary mb-6">위의 내용으로 해결되지 않는 문제는 이메일이나 전화로 문의해주세요.</p>
          <button onClick={handleContact} className="bg-gradient-to-r from-gold to-gold-light text-bg-primary px-8 py-2 rounded-lg font-semibold hover:shadow-hover transition-all">
            문의하기
          </button>
        </div>
      </div>
    </div>
  );
}
