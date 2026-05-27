/**
 * 게시글(posts)을 매물(listings)로 변환 저장
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// 게시글 내용에서 매물 정보 추출
function parsePostContent(content) {
  const result = {
    price: 0,
    deposit: 0,
    monthly_rent: 0,
    region: '서울',
    district: '',
    area_sqm: 0,
    pc_count: 0,
    monthly_revenue: 0,
    monthly_profit: 0,
  };

  if (!content) return result;

  // 실평수 (평수 → 제곱미터)
  const areaMatch = content.match(/3\.\s*실평수\s*:\s*(\d+)/);
  if (areaMatch) {
    const pyeong = parseInt(areaMatch[1]);
    result.area_sqm = Math.round(pyeong * 3.305);
  }

  // 보증금
  const depositMatch = content.match(/5\.\s*보증금\s*:\s*([^6]*?)(?=6\.|$)/);
  if (depositMatch) {
    const depositStr = depositMatch[1].trim();
    let val = 0;
    if (depositStr.includes('만원')) {
      val = parseInt(depositStr.replace(/[^0-9]/g, ''));
    } else if (depositStr) {
      val = parseInt(depositStr.replace(/[^0-9]/g, ''));
    }
    result.deposit = val * 10000;
  }

  // 희망권리금
  const priceMatch = content.match(/6\.\s*희망권리금\s*:\s*([^7]*?)(?=7\.|$)/);
  if (priceMatch) {
    const priceStr = priceMatch[1].trim();
    if (priceStr.includes('무권리')) {
      result.price = 0;
    } else if (priceStr.includes('만원')) {
      const val = parseInt(priceStr.replace(/[^0-9]/g, ''));
      result.price = val * 10000;
    } else if (priceStr) {
      const val = parseInt(priceStr.replace(/[^0-9]/g, ''));
      result.price = val * 10000;
    }
  }

  // 월세
  const rentMatch = content.match(/7\.\s*월세\s*:\s*(\d+)/);
  if (rentMatch) result.monthly_rent = parseInt(rentMatch[1]);

  // 지역
  const locationMatch = content.match(/2\.\s*매물위치\s*:\s*([^3]*?)(?=3\.|$)/);
  if (locationMatch) {
    const location = locationMatch[1].trim();
    const regions = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
    for (const region of regions) {
      if (location.includes(region)) {
        result.region = region;
        result.district = location;
        break;
      }
    }
  }

  return result;
}

async function convert() {
  try {
    console.log('게시글을 매물로 변환 중...');

    // posts 테이블에서 모든 게시글 조회
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, content, view_count');

    if (error) {
      console.log('❌ 게시글 조회 실패:', error.message);
      return;
    }

    console.log(`\n총 ${posts?.length}개 게시글 발견\n`);

    let converted = 0;

    for (const post of posts || []) {
      try {
        // 게시글 내용에서 매물 정보 추출
        const info = parsePostContent(post.content);

        // listings에 저장
        const { error: insertError } = await supabase
          .from('listings')
          .insert([
            {
              title: post.title,
              description: post.content,
              price_type: info.monthly_rent > 0 ? 'lease' : 'sale',
              price: info.price,
              deposit: info.deposit,
              monthly_rent: info.monthly_rent,
              region: info.region,
              district: info.district,
              area_sqm: info.area_sqm,
              pc_count: info.pc_count,
              monthly_revenue: info.monthly_revenue,
              monthly_profit: info.monthly_profit,
              status: 'active',
              view_count: post.view_count,
            },
          ]);

        if (!insertError) {
          console.log(`✓ 변환됨: ${post.title}`);
          converted++;
        } else {
          console.log(`✗ 실패: ${post.title} - ${insertError.message}`);
        }
      } catch (err) {
        console.log(`✗ 오류: ${err.message}`);
      }
    }

    console.log(`\n✓ 완료: ${converted}개 게시글을 매물로 변환했습니다!`);
    process.exit(0);
  } catch (err) {
    console.log('❌ 오류:', err.message);
    process.exit(1);
  }
}

convert();
