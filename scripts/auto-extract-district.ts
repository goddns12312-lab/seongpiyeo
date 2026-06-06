import { createClient } from '@/lib/supabase/server';

// DISTRICT_MAP: 지역별 구/시
const DISTRICT_MAP: Record<string, string[]> = {
  '서울': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구'],
  '부산': ['강서구', '금정구', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'],
  '대구': ['남구', '달서구', '달성군', '동구', '북구', '수성구', '중구', '서구'],
  '인천': ['강화군', '계양구', '남동구', '남구', '동구', '부평구', '서구', '연수구', '옹진군', '중구'],
  '광주': ['광산구', '남구', '동구', '북구', '서구'],
  '대전': ['대덕구', '동구', '서구', '유성구', '중구'],
  '울산': ['남구', '동구', '북구', '울주군', '중구'],
  '경기도': ['가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '화성시'],
  '강원도': ['강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'],
  '충청북도': ['괴산군', '단양군', '제천시', '증평군', '진천군', '청주시', '충주시', '음성군'],
  '충청남도': ['계룡시', '공주시', '금산군', '논산시', '당진시', '보령시', '부여군', '서산시', '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'],
  '전라북도': ['고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '전주시', '정읍시', '완주군', '익산시', '임실군', '장수군', '진안군'],
  '전라남도': ['강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', '장흥군', '진도군', '함평군', '해남군', '화순군'],
  '경상북도': ['경산시', '경주시', '고령군', '구미시', '군위군', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군', '울진군', '의성군', '칠곡군', '포항시'],
  '경상남도': ['거제시', '거창군', '고성군', '김해시', '남해군', '마산시', '밀양시', '사천시', '산청군', '양산시', '의령군', '진주시', '창녕군', '창원시', '통영시', '하동군', '함안군', '함양군'],
  '제주도': ['서귀포시', '제주시'],
};

interface Listing {
  id: string;
  title: string;
  region: string;
  district: string | null;
}

interface ExtractResult {
  id: string;
  district: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

async function extractDistrictFromTitle(listing: Listing): Promise<ExtractResult | null> {
  const { id, title, region, district } = listing;

  // 이미 district가 설정되어 있으면 스킵
  if (district) {
    return null;
  }

  if (!region || !DISTRICT_MAP[region]) {
    return null;
  }

  const regionDistricts = DISTRICT_MAP[region];
  const titleLower = title.toLowerCase();

  // 1순위: 정확한 구/시 매칭 (e.g., "강남구", "서초구")
  for (const dist of regionDistricts) {
    if (titleLower.includes(dist.toLowerCase())) {
      return {
        id,
        district: dist,
        confidence: 'high',
        reason: `정확한 매칭: "${dist}"`,
      };
    }
  }

  // 2순위: 약자 매칭 (e.g., "강남" → "강남구")
  for (const dist of regionDistricts) {
    const shortDist = dist.replace('구', '').replace('시', '').replace('군', '');
    if (shortDist.length >= 2 && titleLower.includes(shortDist)) {
      return {
        id,
        district: dist,
        confidence: 'medium',
        reason: `약자 매칭: "${shortDist}" → "${dist}"`,
      };
    }
  }

  return null;
}

async function main() {
  console.log('🔍 기존 638개 매물에서 district 자동 추출 시작...');
  console.log(`📊 대상 지역: ${Object.keys(DISTRICT_MAP).length}개`);
  console.log('');

  const supabase = await createClient();

  // 1단계: district가 null인 모든 매물 조회
  console.log('⏳ DB에서 district가 null인 매물 조회 중...');
  const { data: listings, error: selectError } = await supabase
    .from('listings')
    .select('id, title, region, district')
    .is('district', null);

  if (selectError) {
    console.error('❌ 조회 실패:', selectError.message);
    process.exit(1);
  }

  if (!listings || listings.length === 0) {
    console.log('✅ district가 없는 매물이 없습니다.');
    process.exit(0);
  }

  console.log(`✅ 조회 완료: ${listings.length}개 매물`);
  console.log('');

  // 2단계: district 추출
  console.log('🔄 district 자동 추출 중...');
  const results: ExtractResult[] = [];
  let extractedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i] as Listing;
    const result = await extractDistrictFromTitle(listing);

    if (result) {
      results.push(result);
      extractedCount++;
      if ((i + 1) % 50 === 0) {
        console.log(`⏳ 진행: ${i + 1}/${listings.length} (추출됨: ${extractedCount})`);
      }
    } else {
      failedCount++;
    }
  }

  console.log('');
  console.log('📊 추출 결과:');
  console.log(`  ✅ 추출 성공: ${extractedCount}개`);
  console.log(`  ❌ 추출 실패: ${failedCount}개`);
  console.log('');

  // 신뢰도별 통계
  const highConfidence = results.filter(r => r.confidence === 'high').length;
  const mediumConfidence = results.filter(r => r.confidence === 'medium').length;

  console.log('💡 신뢰도 분석:');
  console.log(`  🟢 High (정확한 매칭): ${highConfidence}개`);
  console.log(`  🟡 Medium (약자 매칭): ${mediumConfidence}개`);
  console.log('');

  // 3단계: DB 업데이트
  if (extractedCount > 0) {
    console.log('💾 DB 업데이트 중...');

    let updateCount = 0;
    let updateError = false;

    for (const result of results) {
      const { error } = await supabase
        .from('listings')
        .update({ district: result.district })
        .eq('id', result.id);

      if (error) {
        console.error(`❌ 업데이트 실패 (ID: ${result.id}):`, error.message);
        updateError = true;
      } else {
        updateCount++;
      }

      if ((updateCount + 1) % 50 === 0) {
        console.log(`⏳ 업데이트: ${updateCount + 1}/${extractedCount}`);
      }
    }

    console.log('');
    if (updateError) {
      console.log(`⚠️  업데이트 부분 실패: ${updateCount}/${extractedCount}개 성공`);
    } else {
      console.log(`✅ 모든 업데이트 완료: ${updateCount}개`);
    }
  }

  // 4단계: 샘플 출력
  console.log('');
  console.log('📋 추출 샘플 (최대 5개):');
  results.slice(0, 5).forEach((result, idx) => {
    console.log(`  ${idx + 1}. [${result.confidence}] ID=${result.id} → "${result.district}" (${result.reason})`);
  });

  console.log('');
  console.log('✅ 작업 완료!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});
