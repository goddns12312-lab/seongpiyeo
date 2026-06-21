import { buildListingBodySummary } from '@/lib/seo-metadata';
import { resolveListingLocation } from '@/lib/listing-location';

interface ListingBodySummaryProps {
  listing: Record<string, unknown>;
}

export function ListingBodySummary({ listing }: ListingBodySummaryProps) {
  const paragraphs = buildListingBodySummary(listing);
  const resolved = resolveListingLocation(listing);
  const location = resolved.displayLocation;

  return (
    <section className="bg-bg-secondary border border-border-light rounded-lg p-6 mb-8">
      <h2 className="text-text-primary font-semibold text-lg mb-4">
        {location ? `${location} 매물 개요` : '매물 개요'}
      </h2>
      <div className="space-y-3 text-text-primary text-sm leading-relaxed">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
