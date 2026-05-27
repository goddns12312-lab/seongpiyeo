// 지역별 크롤링 설정
// 각 지역의 마지막 페이지는 수동으로 확인 후 업데이트 필요

const REGIONS = [
  {
    name: '서울',
    baseUrl: 'https://www.xn--3e0b036btifksj.com/40/',
    boardCode: '40',
    lastPage: 8,
  },
  {
    name: '경기도',
    baseUrl: 'https://www.xn--3e0b036btifksj.com/93/',
    boardCode: '93',
    lastPage: 27,
  },
  {
    name: '강원도',
    baseUrl: 'https://www.xn--3e0b036btifksj.com/92/',
    boardCode: '92',
    lastPage: 2,
  },
  {
    name: '인천',
    baseUrl: 'https://www.xn--3e0b036btifksj.com/91/',
    boardCode: '91',
    lastPage: 9,
  },
  {
    name: '충청북도',
    baseUrl: 'https://www.xn--3e0b036btifksj.com/90/',
    boardCode: '90',
    lastPage: 9,
  },
  {
    name: '충청남도',
    baseUrl: 'https://www.xn--3e0b036btifksj.com/89/',
    boardCode: '89',
    lastPage: 9,
  },
  {
    name: '경상북도',
    baseUrl: 'https://www.xn--3e0b036btifksj.com/88/',
    boardCode: '88',
    lastPage: 9,
  },
  {
    name: '경상남도',
    baseUrl: 'https://www.xn--3e0b036btifksj.com/87/',
    boardCode: '87',
    lastPage: 9,
  },
  {
    name: '전라북도',
    baseUrl: 'https://www.xn--3e0b036btifksj.com/86/',
    boardCode: '86',
    lastPage: 2,
  },
  {
    name: '전라남도',
    baseUrl: 'https://www.xn--3e0b036btifksj.com/85/',
    boardCode: '85',
    lastPage: 4,
  },
  {
    name: '제주도',
    baseUrl: 'https://www.xn--3e0b036btifksj.com/84/',
    boardCode: '84',
    lastPage: 1,
  },
];

function getRegionByName(name) {
  return REGIONS.find(r => r.name === name);
}

function getListPageUrl(region, pageNum) {
  // 보드 목록 페이지 URL (게시글 목록)
  // 기본값: ?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page={pageNum}
  return `${region.baseUrl}?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=${pageNum}`;
}

module.exports = {
  REGIONS,
  getRegionByName,
  getListPageUrl,
};
