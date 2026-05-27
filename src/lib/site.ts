export const SITE_CONFIG = {
  name: '성피요',
  businessName: '성피요',
  managerName: '이재명',
  phone: '010-5877-4485',
  email: 'contact@pc365.kr',
  region: '부산',
  businessNumber: '568-45-15358',
  description: '성인PC 성인피씨 성인피시 창업 정보 | 전국 성인PC방 매물 매매 및 임대 | 성인피씨창업 정보 공유 | 안전하고 투명한 거래 플랫폼',
  tagline: '성인PC, 성인피씨 안전한 거래 플랫폼',
  keywords: '성인PC, 성인피씨, 성인피시, 성인피씨창업, PC방창업, 성인피씨방매물, 피씨방임대',
  url: (() => {
    // Production: 절대 localhost 사용 금지
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    // localhost 감지: production에서는 무시
    if (baseUrl && (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1'))) {
      if (isProduction) {
        baseUrl = undefined; // production에서 localhost는 무시
      }
    }

    // 기본값 사용
    baseUrl = baseUrl || 'https://xn--oj4bo2hu1o.com';

    // 프로토콜 확인
    if (!baseUrl.startsWith('http')) {
      return `https://${baseUrl}`;
    }

    // 한글 도메인을 punycode로 변환
    if (baseUrl.includes('성피요')) {
      return baseUrl.replace('성피요', 'xn--oj4bo2hu1o');
    }

    return baseUrl;
  })(),
  logoSvg: true,
};
