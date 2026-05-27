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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://xn--oj4bo2hu1o.com';
    // localhost는 그대로 반환
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      return baseUrl;
    }
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
