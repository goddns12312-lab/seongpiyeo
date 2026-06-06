import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { importId, action } = body;

    if (!importId || !action) {
      return NextResponse.json(
        { error: 'importId와 action은 필수입니다' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase 설정 오류' },
        { status: 500 }
      );
    }

    const serviceClient = createServiceClient(supabaseUrl, supabaseKey);

    if (action === 'reject') {
      // 거절: import_status만 업데이트
      const { error } = await serviceClient
        .from('crawler_imports')
        .update({ import_status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', importId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'approve') {
      // 승인: listings + listing_images 추가, import_status 업데이트

      // 1. crawler_imports에서 데이터 조회
      const { data: importData, error: fetchError } = await serviceClient
        .from('crawler_imports')
        .select('*')
        .eq('id', importId)
        .single();

      if (fetchError || !importData) {
        return NextResponse.json(
          { error: '매물을 찾을 수 없습니다' },
          { status: 404 }
        );
      }

      // 2. listings 테이블에 INSERT
      const { data: listing, error: listingError } = await serviceClient
        .from('listings')
        .insert([
          {
            title: importData.title,
            region: importData.region,
            location: importData.location,
            contact: importData.contact,
            deposit: importData.price_deposit,
            monthly_rent: importData.price_monthly,
            business_license: importData.permit_status === '여' ? '있음' : null,
            administrative_record: importData.violation_history === '부' ? '없음' : null,
            facilities: importData.facilities,
            move_in_date: importData.available_date,
            area: importData.size,
            floor: importData.floor,
            description: importData.description,
            thumbnail_url: importData.main_image_url,
            main_image_url: importData.main_image_url,
            status: 'active',
            idx: importData.source_idx,
            source_url: `https://www.xn--3e0b036btifksj.com/${importData.source_idx}`,
            created_at: new Date().toISOString(),
          },
        ])
        .select('id')
        .single();

      if (listingError) {
        return NextResponse.json(
          { error: `listings 추가 실패: ${listingError.message}` },
          { status: 500 }
        );
      }

      const listingId = listing.id;

      // 3. crawler_imports_images에서 이미지 조회
      const { data: images, error: imagesError } = await serviceClient
        .from('crawler_imports_images')
        .select('*')
        .eq('import_id', importId)
        .order('order_num', { ascending: true });

      if (!imagesError && images && images.length > 0) {
        // 4. listing_images에 INSERT
        const imageInserts = images.map((img) => ({
          listing_id: listingId,
          url: img.image_url,
          order_num: img.order_num,
          is_primary: img.is_primary || img.order_num === 0,
          download_status: 'pending' as const,
          created_at: new Date().toISOString(),
        }));

        const { error: imageInsertError } = await serviceClient
          .from('listing_images')
          .insert(imageInserts);

        if (imageInsertError) {
          console.warn('이미지 추가 실패:', imageInsertError.message);
          // 이미지 실패해도 매물은 추가되었으므로 계속 진행
        }
      }

      // 5. crawler_imports의 import_status를 'approved'로 업데이트
      const { error: updateError } = await supabase
        .from('crawler_imports')
        .update({ import_status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', importId);

      if (updateError) {
        return NextResponse.json(
          { error: `상태 업데이트 실패: ${updateError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, listingId });
    }

    return NextResponse.json(
      { error: '잘못된 action입니다' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '오류 발생' },
      { status: 500 }
    );
  }
}
