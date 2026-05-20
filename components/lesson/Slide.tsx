export type SlideProps = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function Slide({ title, subtitle, children }: SlideProps) {
  return (
    <section className="prose prose-buckeye max-w-none">
      {title ? (
        <header className="mb-4 border-b border-black/5 pb-3">
          <h3 className="m-0 font-display text-2xl font-semibold text-buckeye-ink">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-1 text-sm text-buckeye-gray">{subtitle}</p>
          ) : null}
        </header>
      ) : null}
      <div className="space-y-4 text-base leading-relaxed text-buckeye-ink">
        {children}
      </div>
    </section>
  );
}
