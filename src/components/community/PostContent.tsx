import { splitContentAndImages } from '@/lib/post-permissions';

export function PostContent({ content }: { content: string }) {
  const { body, images } = splitContentAndImages(content || '');

  return (
    <div className="prose prose-invert max-w-none mb-12 text-text-secondary">
      {body.split('\n').map((line, idx) => (
        <div key={idx}>
          {line.startsWith('## ') ? (
            <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">
              {line.replace('## ', '')}
            </h2>
          ) : line.startsWith('- ') ? (
            <li className="ml-6 my-2">{line.replace('- ', '')}</li>
          ) : line.startsWith('**') && line.endsWith('**') ? (
            <p className="my-2 font-semibold text-text-primary">{line.slice(2, -2)}</p>
          ) : (
            <p className="my-2">{line}</p>
          )}
        </div>
      ))}

      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 not-prose">
          {images.map((url, i) => (
            <img
              key={url}
              src={url}
              alt={`첨부 이미지 ${i + 1}`}
              className="w-full rounded-lg border border-border-light"
              loading="lazy"
            />
          ))}
        </div>
      )}
    </div>
  );
}
