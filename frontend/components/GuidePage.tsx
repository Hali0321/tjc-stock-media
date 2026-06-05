const guideBlocks = [
  {
    title: "How to search",
    body: "Start with ministry need first: Bible Study, fellowship, worship, flowers, website hero, slides, newsletter, no people, or event name.",
    doText: "Combine use case and safety terms, such as website hero no people.",
    avoidText: "Do not search only by old filenames unless a DAM admin asks for source tracing."
  },
  {
    title: "How to know if something is approved",
    body: "Use approval label, usage scope, reviewer/date, and rights notes together. Approved media stays first in Library results.",
    doText: "Use Approved for church-wide use or Internal ministry use only inside its stated scope.",
    avoidText: "Do not treat Please review before public sharing, Archive only, or Contains children/youth as publishable."
  },
  {
    title: "Church-wide vs internal",
    body: "Church-wide assets can support public ministry communication. Internal assets stay within coworkers, recap decks, and local ministry coordination.",
    doText: "Choose internal assets for team updates, planning, and private recap material.",
    avoidText: "Do not move internal media into public posts, web pages, or printed outreach without another review."
  },
  {
    title: "Photo use",
    body: "Keep ministry context intact. Cropping, contrast, and layout choices should preserve worship, service, fellowship, and event meaning.",
    doText: "Use approved images for newsletters, slides, local updates, and website articles.",
    avoidText: "Do not crop in a way that changes ministry context or isolates people without clear reason."
  },
  {
    title: "Logo and graphic use",
    body: "Use approved logo, template, and graphic files when available. Source and version matter for public-facing work.",
    doText: "Use latest approved copy or ask a media coworker for the right file.",
    avoidText: "Do not recreate logos from screenshots, old flyers, or social posts."
  },
  {
    title: "Children/youth",
    body: "Children/youth visibility requires extra care. Portal blocks unsafe downloads and calls out risk labels.",
    doText: "Ask a reviewer before public sharing when children/youth may be visible.",
    avoidText: "Do not post, crop tightly, or reuse youth media before approval."
  },
  {
    title: "Credit/source",
    body: "Source, photographer, collection, and ResourceSpace ID stay with each asset record for traceability.",
    doText: "Keep required credit notes with final layout or caption.",
    avoidText: "Do not remove provenance notes when handing media to another coworker."
  },
  {
    title: "Large media intake",
    body: "Video/audio over 100 MB uses Shared Drive Incoming or admin intake, then ResourceSpace indexing.",
    doText: "Send large files through approved intake path so checksum, source, and review state remain traceable.",
    avoidText: "Do not force large video/audio through browser upload or place it directly into master folders."
  }
];

const decisionRows = [
  ["Need public flyer or website image", "Use Approved for church-wide use and download approved copy."],
  ["Need coworker recap or planning deck", "Use Internal ministry use only, if audience stays internal."],
  ["People, children/youth, or source unclear", "Pause and ask a media coworker or reviewer."],
  ["Original/master requested", "Request access. Normal users use approved copies only."]
];

export function GuidePage() {
  return (
    <div className="mx-auto max-w-[1280px] px-3 py-5 md:px-5">
      <section className="border-b border-tjc-line pb-4">
        <span className="text-sm font-semibold text-tjc-evergreen">Usage guide</span>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.03em] md:text-4xl">Use approved media with care</h1>
        <p className="mt-2 max-w-[68ch] text-base leading-relaxed text-tjc-muted">
          Quick rules for searching, checking approval, downloading copies, and knowing when to ask a reviewer.
        </p>
      </section>

      <section className="mt-4 rounded-lg border border-tjc-line bg-white/82 p-4" aria-label="Download decision guide">
        <h2 className="text-xl font-semibold">Before downloading</h2>
        <div className="mt-3 grid gap-2">
          {decisionRows.map(([need, action]) => (
            <div className="grid gap-2 border-b border-tjc-line px-1 py-3 last:border-b-0 md:grid-cols-[18rem_1fr]" key={need}>
              <strong className="text-sm text-tjc-ink">{need}</strong>
              <span className="text-sm leading-relaxed text-tjc-muted">{action}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {guideBlocks.map((block) => (
          <section className="rounded-lg border border-tjc-line bg-white/78 p-4" key={block.title}>
            <h2 className="text-lg font-semibold tracking-[-.01em]">{block.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-tjc-muted">{block.body}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-md border border-[#b8d9c6] bg-[#edf8f1] p-3 text-sm text-[#24583d]">
                <strong className="block font-semibold">Do</strong>
                <span className="mt-1 block leading-relaxed">{block.doText}</span>
              </div>
              <div className="rounded-md border border-[#ead6a8] bg-[#fff8e8] p-3 text-sm text-[#725216]">
                <strong className="block font-semibold">Avoid</strong>
                <span className="mt-1 block leading-relaxed">{block.avoidText}</span>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-4 rounded-lg border border-[#cbd8e4] bg-[#f2f7fb] p-4 text-[#52677a]">
        <h2 className="text-lg font-semibold text-[#27435b]">Ask a media coworker</h2>
        <p className="mt-2 text-sm leading-relaxed">
          If approval, source, people visibility, children/youth risk, or usage scope is unclear, pause. Correct next action is review, not guessing.
        </p>
      </section>
    </div>
  );
}
