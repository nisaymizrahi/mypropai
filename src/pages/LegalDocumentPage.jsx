import React from "react";
import { Link } from "react-router-dom";

import BrandLogo from "../components/BrandLogo";
import { LEGAL_DOCUMENTS, LEGAL_LAST_UPDATED } from "../content/legalDocuments";

const LegalDocumentPage = ({ documentKey = "terms" }) => {
  const document = LEGAL_DOCUMENTS[documentKey] || LEGAL_DOCUMENTS.terms;

  return (
    <div className="public-shell min-h-screen text-ink-900">
      <div className="mx-auto flex min-h-screen max-w-[1120px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="surface-panel flex items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo caption={document.eyebrow} />
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/signup" className="ghost-action">
              Create account
            </Link>
            <Link to="/login" className="ghost-action">
              Login
            </Link>
          </div>
        </header>

        <main className="flex-1 py-8 lg:py-10">
          <section className="surface-panel-strong px-6 py-7 sm:px-8">
            <span className="eyebrow">{document.eyebrow}</span>
            <h1 className="mt-5 max-w-3xl font-display text-[2.8rem] leading-[0.96] text-ink-900 sm:text-[3.4rem]">
              {document.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-600 sm:text-base">
              {document.intro}
            </p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              Last updated {LEGAL_LAST_UPDATED}
            </p>
          </section>

          <section className="section-card mt-6 px-6 py-6 sm:px-8">
            <div className="space-y-8">
              {document.sections.map((section) => (
                <article key={section.heading} className="border-b border-ink-100 pb-8 last:border-b-0 last:pb-0">
                  <h2 className="text-xl font-semibold text-ink-900">{section.heading}</h2>
                  <div className="mt-3 space-y-4 text-sm leading-7 text-ink-600 sm:text-base">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default LegalDocumentPage;
