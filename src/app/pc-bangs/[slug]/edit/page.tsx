import { notFound, permanentRedirect } from 'next/navigation';
import { getListingById } from '@/lib/listing-queries';
import { getListingEditPath } from '@/lib/listing-url';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function RedirectLegacyPcBangEditPage({ params }: Props) {
  const { slug } = await params;
  const id = decodeURIComponent(slug);
  const listing = await getListingById(id);

  if (!listing) {
    notFound();
  }

  permanentRedirect(getListingEditPath(listing.region as string, id));
}
