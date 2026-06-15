export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-gold focus:text-bg-primary focus:font-semibold focus:shadow-lg"
    >
      본문으로 바로가기
    </a>
  );
}
