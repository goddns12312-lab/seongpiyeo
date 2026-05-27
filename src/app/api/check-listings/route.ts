import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 전체 매물 개수
    const { count: totalCount } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true });

    // active 상태 매물 개수
    const { count: activeCount } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    // main_image_url이 있는 매물
    const { count: withImageCount } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('main_image_url', 'is', null);

    // 최근 추가된 5개 매물
    const { data: recentListings } = await supabase
      .from('listings')
      .select('id, title, price, region, status, main_image_url, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    return Response.json({
      totalCount,
      activeCount,
      withImageCount,
      recentListings,
      message: `전체: ${totalCount}개, 활성화: ${activeCount}개, 이미지있음: ${withImageCount}개`
    });
  } catch (error) {
    return Response.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
