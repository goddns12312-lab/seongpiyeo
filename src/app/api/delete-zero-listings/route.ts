import { deleteZeroPriceListings } from '@/lib/actions';

export async function POST() {
  try {
    const result = await deleteZeroPriceListings();
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
