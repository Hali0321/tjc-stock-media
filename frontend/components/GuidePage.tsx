"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, CircleHelp, Download, FileText, Image as ImageIcon, MessageCircle, Search, ShieldCheck, UploadCloud, Users } from "lucide-react";

const guideBlocks = [
  {
    title: "How to search",
    icon: Search,
    body: "Start with ministry need first: Bible Study, fellowship, worship, flowers, website hero, slides, newsletter, no people, or event name.",
    doText: "Combine use case and safety terms, such as website hero no people.",
    avoidText: "Do not search only by old filenames unless a DAM admin asks for source tracing."
  },
  {
    title: "How to know if something is approved",
    icon: BadgeCheck,
    body: "Use raw ResourceSpace status and portal reuse state together. ResourceSpace approval alone is not enough for public reuse.",
    doText: "Use Portal ready or Internal ready assets inside their stated scope.",
    avoidText: "Do not treat Please review before public sharing, Archive only, or Contains children/youth as publishable."
  },
  {
    title: "Church-wide vs internal",
    icon: ShieldCheck,
    body: "Church-wide assets can support public ministry communication. Internal assets stay within coworkers, recap decks, and local ministry coordination.",
    doText: "Choose internal assets for team updates, planning, and private recap material.",
    avoidText: "Do not move internal media into public posts, web pages, or printed outreach without another review."
  },
  {
    title: "Photo use",
    icon: ImageIcon,
    body: "Keep ministry context intact. Cropping, contrast, and layout choices should preserve worship, service, fellowship, and event meaning.",
    doText: "Use portal-ready images for newsletters, slides, local updates, and website articles.",
    avoidText: "Do not crop in a way that changes ministry context or isolates people without clear reason."
  },
  {
    title: "Logo and graphic use",
    icon: FileText,
    body: "Use approved logo, template, and graphic files when available. Source and version matter for public-facing work.",
    doText: "Use latest approved copy or ask a media coworker for the right file.",
    avoidText: "Do not recreate logos from screenshots, old flyers, or social posts."
  },
  {
    title: "Children/youth",
    icon: Users,
    body: "Children/youth visibility requires extra care. Portal blocks unsafe downloads and calls out risk labels.",
    doText: "Ask a reviewer before public sharing when children/youth may be visible.",
    avoidText: "Do not post, crop tightly, or reuse youth media before approval."
  },
  {
    title: "Credit/source",
    icon: Download,
    body: "Source, photographer, collection, and ResourceSpace ID stay with each asset record for traceability.",
    doText: "Keep required credit notes with final layout or caption.",
    avoidText: "Do not remove provenance notes when handing media to another coworker."
  },
  {
    title: "Large media intake",
    icon: UploadCloud,
    body: "Video/audio over 100 MB uses Shared Drive Incoming or admin intake, then ResourceSpace indexing.",
    doText: "Send large files through approved intake path so checksum, source, and review state remain traceable.",
    avoidText: "Do not force large video/audio through browser upload or place it directly into master folders."
  }
];

const decisionRows = [
  ["Need public flyer or website image", "Use Portal ready and download approved web copy."],
  ["Need coworker recap or planning deck", "Use Internal ready, if audience stays internal."],
  ["People, children/youth, or source unclear", "Pause and ask a media coworker or reviewer."],
  ["Original/master requested", "Request access. Normal users use approved copies only."]
];

export function GuidePage() {
  const [query, setQuery] = useState("");
  const visibleBlocks = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return guideBlocks;
    return guideBlocks.filter((block) => {
      const haystack = `${block.title} ${block.body} ${block.doText} ${block.avoidText}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [query]);

  return (
    <div className="mx-auto max-w-[1180px] px-3 py-6 md:px-5">
      <section className="grid gap-4 border-b border-[#d6dfd8] pb-5 md:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <span className="text-sm font-black text-tjc-evergreen">Usage guide</span>
          <h1 className="mt-2 dam-page-title">Use approved media with care</h1>
          <p className="mt-2 max-w-[68ch] text-base font-semibold leading-relaxed text-tjc-muted">
            Quick rules for searching, checking approval, downloading copies, and knowing when to ask a reviewer.
          </p>
        </div>
        <div className="grid gap-3">
          <section className="rounded-[1.4rem] border border-[#cbd8e4] bg-[#f7fbff] p-4 text-[#52677a]" aria-label="When in doubt">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#27435b]">
                <CircleHelp size={19} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-black text-[#27435b]">When in doubt, ask</h2>
                <p className="mt-1 text-sm font-semibold leading-relaxed">Approval, source, children/youth, or original access uncertainty should move to review, not guessing.</p>
              </div>
            </div>
          </section>
          <label className="grid gap-2 text-sm font-semibold text-tjc-ink" htmlFor="guide-search">
            Search guide
            <span className="grid grid-cols-[auto_1fr] items-center gap-2 rounded-full border border-[#cad8cf] bg-white px-3">
            <Search size={16} strokeWidth={1.8} aria-hidden="true" className="text-tjc-evergreen" />
            <input
              id="guide-search"
              className="min-h-10 min-w-0 bg-transparent text-sm font-medium text-tjc-ink placeholder:text-[#7f8a82]"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search children, source, public, original..."
              type="search"
            />
            </span>
          </label>
        </div>
      </section>

      <div className="mt-5 grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 grid gap-1 text-sm font-semibold text-tjc-muted" aria-label="Guide sections">
            <a className="rounded-md px-2 py-1.5 text-tjc-evergreen hover:bg-[#eef4f0]" href="#before-downloading">Before downloading</a>
            {guideBlocks.map((block) => (
              <a className="rounded-md px-2 py-1.5 hover:bg-[#eef4f0]" href={`#guide-${block.title.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-")}`} key={block.title}>{block.title}</a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <section id="before-downloading" className="scroll-mt-24 border-b border-[#d6dfd8] pb-5" aria-label="Download decision guide">
            <h2 className="text-base font-black text-tjc-evergreen">Before downloading</h2>
            <div className="mt-3 divide-y divide-[#dbe4dd] rounded-lg border border-[#dbe4dd] bg-white">
              {decisionRows.map(([need, action]) => (
                <div className="grid gap-2 px-3 py-3 md:grid-cols-[17rem_1fr]" key={need}>
                  <strong className="text-sm text-tjc-ink">{need}</strong>
                  <span className="text-sm font-semibold leading-relaxed text-tjc-muted">{action}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid">
            {visibleBlocks.map((block) => {
              const Icon = block.icon;
              return (
              <section id={`guide-${block.title.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-")}`} className="scroll-mt-24 border-b border-[#d6dfd8] py-5" key={block.title}>
                <div className="grid gap-3 md:grid-cols-[18rem_1fr]">
                  <div className="grid grid-cols-[auto_1fr] gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-[#dbe4dd] bg-white text-tjc-evergreen">
                      <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <div>
                    <h2 className="text-base font-black text-tjc-ink">{block.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-tjc-muted">{block.body}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <p className="leading-relaxed text-[#24583d]">
                      <strong className="mb-1 block text-xs font-black uppercase tracking-[.08em] text-tjc-evergreen">Do</strong>
                      {block.doText}
                    </p>
                    <p className="leading-relaxed text-[#725216]">
                      <strong className="mb-1 block text-xs font-black uppercase tracking-[.08em] text-[#8a641b]">Avoid</strong>
                      {block.avoidText}
                    </p>
                  </div>
                </div>
              </section>
            );
            })}
          </div>

          {!visibleBlocks.length ? (
            <div className="mt-4 rounded-lg border border-tjc-line bg-white p-6 text-sm text-tjc-muted">No guide sections match that search.</div>
          ) : null}

          <section className="mt-5 rounded-[1.4rem] border border-[#cbd8e4] bg-[#f7fbff] p-4 text-[#52677a]">
            <h2 className="flex items-center gap-2 text-base font-black text-[#27435b]"><MessageCircle size={18} strokeWidth={1.8} aria-hidden="true" /> Ask a media coworker</h2>
            <p className="mt-2 text-sm leading-relaxed">
              If approval, source, people visibility, children/youth risk, or usage scope is unclear, pause. Correct next action is review, not guessing.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
