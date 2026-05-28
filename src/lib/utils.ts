export function formatPrice(price: number | string | undefined | null): string {
  if (!price) return '정보 없음';

  // 문자열이면 "만원" 제거 후 숫자로 변환
  let numPrice: number;
  if (typeof price === 'string') {
    // "312만원" → "312" → 312
    numPrice = parseInt(price.replace(/[^0-9]/g, ''), 10);
  } else {
    numPrice = price;
  }

  if (isNaN(numPrice) || numPrice === 0) return '정보 없음';

  return new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: 0,
  }).format(numPrice) + '만원';
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: string | Date | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}
