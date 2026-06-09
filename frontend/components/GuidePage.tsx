"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileLock2, MessageCircle, Search, UploadCloud } from "lucide-react";

type HelpTopic = {
  id: string;
  title: string;
  summary: string;
  route: string;
  doText: string;
  avoidText: string;
};

const helpTopics: HelpTopic[] = [
  {
    id: "find",
    title: "Find approved media",
    summary: "Search by use case, event, ministry, topic, or package.",
    route: "/",
    doText: "Use plain terms like website image, slide background, youth-safe, Bible study, or newsletter.",
    avoidText: "Do not use media just because you remember seeing it somewhere."
  },
  {
    id: "download",
    title: "Download a copy",
    summary: "Open the media record and follow the verdict before reuse.",
    route: "/",
    doText: "Download only when the record says Ready to use and the guidance matches your channel.",
    avoidText: "Do not treat review-required or source-file restricted media as approved."
  },
  {
    id: "packages",
    title: "Use a package",
    summary: "Start from a curated ministry kit, then confirm each item.",
    route: "/collections",
    doText: "Open each media record before reuse. Item-level approval still matters.",
    avoidText: "Do not assume the whole package is approved for every use."
  },
  {
    id: "children",
    title: "Check people/youth",
    summary: "Use extra care when faces, children, youth, or private moments may appear.",
    route: "/?view=children-youth-review",
    doText: "Request review before public sharing when people/youth visibility is unclear.",
    avoidText: "Do not crop tightly, repost, or publish youth media before approval."
  },
  {
    id: "source",
    title: "Request source-file access",
    summary: "Source files are restricted and require a separate request.",
    route: "/guide#request-review",
    doText: "Include the media record, ministry use, deadline, and why the approved copy is not enough.",
    avoidText: "Do not ask for source files as a normal download path."
  },
  {
    id: "send",
    title: "Send media for review",
    summary: "Submit files or links so reviewers can check rights, people, source, and use guidance.",
    route: "/upload",
    doText: "Provide context, people/youth answers, source, tags, and reviewer notes.",
    avoidText: "Do not send media expecting it to publish immediately."
  }
];

const decisionTree = [
  ["Need media now?", "Search Find first. If nothing is ready, browse Packages."],
  ["Verdict says Ready to use?", "Download approved copy and follow guidance."],
  ["People/youth, rights, or source unclear?", "Stop and request DAM review."],
  ["Need original/source file?", "Request source-file access. It is not automatic."]
];

export function GuidePage() {
  const [query, setQuery] = useState("");
  const [openTopic, setOpenTopic] = useState(helpTopics[0].id);

  const visibleTopics = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return helpTopics;
    return helpTopics.filter((topic) => {
      const haystack = `${topic.title} ${topic.summary} ${topic.doText} ${topic.avoidText}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [query]);

  const selected = visibleTopics.find((topic) => topic.id === openTopic) || visibleTopics[0] || helpTopics[0];

  return (
    <div className="dam-help-shell mx-auto grid w-full max-w-[1180px] gap-6 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,.72fr)_minmax(22rem,.28fr)]">
      <section className="min-w-0">
        <div className="help-hero">
          <p className="dam-kicker">Help</p>
          <h1 className="mt-2 text-4xl font-black leading-[1.02] tracking-[0] text-[#111827] sm:text-5xl">
            What are you trying to do?
          </h1>
          <p className="mt-3 max-w-[58ch] text-base font-medium leading-7 text-[#4b5563]">
            Use approved copies when they are ready. When approval, people/youth, rights, or source access is unclear, send it for review.
          </p>

          <form className="mt-5 grid min-h-12 grid-cols-[auto_1fr] items-center rounded-xl border border-[#d7dde2] bg-white px-3" role="search">
            <Search size={18} strokeWidth={1.8} aria-hidden="true" className="text-[#5b6670]" />
            <label className="sr-only" htmlFor="help-search">Search help</label>
            <input
              id="help-search"
              className="min-h-12 min-w-0 bg-transparent px-3 text-base font-medium text-[#111827] placeholder:text-[#6b7280]"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search help, children, download, package..."
              type="search"
            />
          </form>
        </div>

        <section className="help-mobile-decision mt-3 grid gap-2 md:hidden" aria-label="Mobile quick help">
          <div className="rounded-[10px] border border-[#d7e1db] bg-white p-3">
            <p className="dam-kicker">Quick decision</p>
            <div className="mt-2 grid gap-1.5">
              {decisionTree.slice(0, 3).map(([question, answer]) => (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-t border-[#eef2ef] py-2 first:border-t-0 first:pt-0 last:pb-0" key={`mobile-${question}`}>
                  <span>
                    <strong className="block text-[.82rem] font-black leading-tight text-[#111827]">{question}</strong>
                    <small className="mt-1 block text-[.78rem] font-semibold leading-snug text-[#4b5563]">{answer}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <a className="inline-flex min-h-10 items-center justify-between rounded-[10px] border border-[#bdd3e4] bg-[#f5f9fc] px-3 text-sm font-black text-[#1f3f5b]" href="mailto:media@tjc.org?subject=Request%20DAM%20review&body=Please%20review%20this%20media%20for%20safe%20reuse.%0AContext:%20">
            Request DAM review
            <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
          </a>
        </section>

        <div className="help-topic-list mt-5 grid gap-2 sm:grid-cols-2" aria-label="Help topics">
          {visibleTopics.map((topic) => (
            <button
              className={`help-topic-button ${selected.id === topic.id ? "is-active" : ""}`}
              key={topic.id}
              onClick={() => setOpenTopic(topic.id)}
              type="button"
              aria-pressed={selected.id === topic.id}
            >
              <span>
                <strong>{topic.title}</strong>
                <small>{topic.summary}</small>
              </span>
              <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
            </button>
          ))}
        </div>

        {!visibleTopics.length ? (
          <div className="mt-5 rounded-xl border border-[#d7dde2] bg-white p-6 text-sm font-medium text-[#4b5563]">
            No help topic matched. Request DAM review when unsure.
          </div>
        ) : null}

        <section className="mt-5 help-detail-panel" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="dam-kicker">Selected topic</p>
              <h2 className="mt-1 text-2xl font-black tracking-[0] text-[#111827]">{selected.title}</h2>
              <p className="mt-2 max-w-[60ch] text-sm font-medium leading-6 text-[#4b5563]">{selected.summary}</p>
            </div>
            <Link className="help-primary-link" href={selected.route}>
              Open page
            </Link>
          </div>

          <div className="help-guidance-grid mt-5 grid gap-3 md:grid-cols-2">
            <div className="help-guidance help-guidance-do">
              <strong>Do</strong>
              <p>{selected.doText}</p>
            </div>
            <div className="help-guidance help-guidance-avoid">
              <strong>Avoid</strong>
              <p>{selected.avoidText}</p>
            </div>
          </div>
        </section>
      </section>

      <aside className="help-assistant-rail grid h-fit gap-4 lg:sticky lg:top-24">
        <section className="help-side-panel">
          <p className="dam-kicker">Quick decision</p>
          <div className="mt-3 divide-y divide-[#e5e7eb]">
            {decisionTree.map(([question, answer]) => (
              <div className="py-3" key={question}>
                <strong className="block text-sm font-black text-[#111827]">{question}</strong>
                <span className="mt-1 block text-sm font-medium leading-6 text-[#4b5563]">{answer}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="request-review" className="help-side-panel help-review-panel">
          <MessageCircle size={20} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <h2 className="text-base font-black text-[#1f3f5b]">Request DAM review</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-[#425466]">
              If approval, source, rights, people/youth, or use scope is unclear, ask the media team before reuse.
            </p>
            <a className="mt-3 inline-flex font-black text-[#1f3f5b]" href="mailto:media@tjc.org?subject=Request%20DAM%20review&body=Please%20review%20this%20media%20for%20safe%20reuse.%0AContext:%20">
              Open review request
            </a>
          </div>
        </section>

        <section className="help-side-panel">
          <p className="dam-kicker">Fast paths</p>
          <div className="mt-3 grid gap-2">
            <Link className="help-quick-link" href="/collections">Packages</Link>
            <Link className="help-quick-link" href="/upload"><UploadCloud size={15} /> Send media</Link>
            <Link className="help-quick-link" href="/guide#request-review"><FileLock2 size={15} /> Source-file access</Link>
          </div>
        </section>
      </aside>
    </div>
  );
}
