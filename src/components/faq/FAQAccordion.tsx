'use client';

import { useState } from 'react';

interface FAQ {
  q: string;
  a: string;
}

interface FAQCategory {
  category: string;
  items: FAQ[];
}

interface FAQAccordionProps {
  faqs: FAQCategory[];
}

export function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {faqs.map((category, catIdx) => (
        <div key={catIdx}>
          <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <span className="w-1 h-8 bg-gold rounded-full" aria-hidden="true" />
            {category.category}
          </h2>

          <div className="space-y-2 ml-4">
            {category.items.map((faq, itemIdx) => {
              const key = `${catIdx}-${itemIdx}`;
              const panelId = `faq-panel-${key}`;
              const isOpen = openIndex === key;

              return (
                <div
                  key={key}
                  className="bg-bg-secondary border border-border-light rounded-lg overflow-hidden"
                >
                  <button
                    type="button"
                    id={`faq-button-${key}`}
                    onClick={() => setOpenIndex(isOpen ? null : key)}
                    className="w-full p-5 flex items-start justify-between hover:bg-bg-tertiary transition-colors text-left"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                  >
                    <span className="text-text-primary font-semibold flex-1 pr-4">
                      Q. {faq.q}
                    </span>
                    <span
                      className={`text-gold-dark dark:text-gold flex-shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    >
                      ▼
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={`faq-button-${key}`}
                      className="px-5 py-4 bg-bg-tertiary border-t border-border-light"
                    >
                      <p className="text-text-secondary">
                        <span className="text-gold-dark dark:text-gold font-semibold">A. </span>
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
