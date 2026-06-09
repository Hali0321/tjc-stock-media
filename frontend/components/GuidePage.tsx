"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileLock2, MessageCircle, Search, UploadCloud } from "lucide-react";
import { DamAssistantLaneCard, DamHelpDecisionPanel, DamHelpTopicButton } from "@/components/dam/DamWorkspace";

type HelpTopic = {
  id: string;
  title: string;
  summary: string;
  route: string;
  lane: string;
  doText: string;
  avoidText: string;
};

const helpTopics: HelpTopic[] = [
  {
    id: "find",
    title: "Find approved media",
    summary: "Search by use case, event, ministry, topic, or package.",
    route: "/",
    lane: "Start here",
    doText: "Use plain terms like website image, slide background, youth-safe, Bible study, or newsletter.",
    avoidText: "Do not use media just because you remember seeing it somewhere."
  },
  {
    id: "download",
    title: "Download a copy",
    summary: "Open the media record and follow the verdict before reuse.",
    route: "/",
    lane: "Record check",
    doText: "Download only when the record says Ready to use and the guidance matches your channel.",
    avoidText: "Do not treat review-required or source-file restricted media as approved."
  },
  {
    id: "packages",
    title: "Use a package",
    summary: "Start from a curated ministry kit, then confirm each item.",
    route: "/collections",
    lane: "Ministry kit",
    doText: "Open each media record before reuse. Item-level approval still matters.",
    avoidText: "Do not assume the whole package is approved for every use."
  },
  {
    id: "children",
    title: "Check people/youth",
    summary: "Use extra care when faces, children, youth, or private moments may appear.",
    route: "/?view=children-youth-review",
    lane: "Safety check",
    doText: "Request review before public sharing when people/youth visibility is unclear.",
    avoidText: "Do not crop tightly, repost, or publish youth media before approval."
  },
  {
    id: "source",
    title: "Request source-file access",
    summary: "Source files are restricted and require a separate request.",
    route: "/guide#request-review",
    lane: "Access request",
    doText: "Include the media record, ministry use, deadline, and why the approved copy is not enough.",
    avoidText: "Do not ask for source files as a normal download path."
  },
  {
    id: "send",
    title: "Send media for review",
    summary: "Submit files or links so reviewers can check rights, people, source, and use guidance.",
    route: "/upload",
    lane: "New intake",
    doText: "Provide context, people/youth answers, source, tags, and reviewer notes.",
    avoidText: "Do not send media expecting it to publish immediately."
  },
  {
    id: "review",
    title: "Request DAM review",
    summary: "Ask the media team to confirm whether a media record can be reused.",
    route: "/guide#request-review",
    lane: "Escalate",
    doText: "Include the media record, intended ministry use, channel, deadline, and the exact uncertainty.",
    avoidText: "Do not publish or download a blocked record while waiting."
  }
];

const decisionTree = [
  ["Need media now?", "Search Find first. If nothing is ready, browse Packages."],
  ["Verdict says Ready to use?", "Download approved copy and follow guidance."],
  ["People/youth, rights, or source unclear?", "Stop and request DAM review."],
  ["Need original/source file?", "Request source-file access. It is not automatic."]
] as const;

const assistantLanes = [
  ["Find", "Start with approved copies and packages."],
  ["Verify", "Open the media record before reuse."],
  ["Escalate", "Ask review when approval is unclear."]
] as const;

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
    <div className="dam-help-shell mx-auto grid w-full max-w-[1180px] gap-4 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,.68fr)_minmax(22rem,.32fr)]">
      <section className="min-w-0">
        <div className="help-hero">
          <div className="help-command-main">
            <p className="dam-kicker">Help desk</p>
            <h1 className="mt-1 text-2xl font-black leading-tight tracking-[0] text-[#111827] sm:text-3xl">
              What are you trying to do?
            </h1>
            <p className="mt-2 max-w-[58ch] text-sm font-semibold leading-6 text-[#4b5563]">
              Use approved copies when they are ready. When approval, people/youth, rights, or source access is unclear, send it for review.
            </p>

            <form className="mt-4 grid min-h-11 grid-cols-[auto_1fr] items-center rounded-lg border border-[#d7dde2] bg-white px-3" role="search">
              <Search size={18} strokeWidth={1.8} aria-hidden="true" className="text-[#5b6670]" />
              <label className="sr-only" htmlFor="help-search">Search help</label>
              <input
                id="help-search"
                className="min-h-11 min-w-0 bg-transparent px-3 text-sm font-semibold text-[#111827] placeholder:text-[#6b7280]"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search help..."
                type="search"
              />
            </form>
          </div>
          <dl className="help-command-ledger" aria-label="Help workflow summary">
            {[
              ["Start", "Find approved media"],
              ["Verify", "Open media record"],
              ["Escalate", "Request DAM review"]
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <section className="help-lane-strip mt-3 grid gap-2 md:grid-cols-3" aria-label="Help decision lanes">
          {assistantLanes.map(([label, detail]) => (
            <DamAssistantLaneCard label={label} detail={detail} key={label} />
          ))}
        </section>

        <section className="help-mobile-decision mt-3 grid gap-2 md:hidden" aria-label="Mobile quick help">
          <DamHelpDecisionPanel items={decisionTree} mobile />
          <a className="inline-flex min-h-10 items-center justify-between rounded-[10px] border border-[#bdd3e4] bg-[#f5f9fc] px-3 text-sm font-black text-[#1f3f5b]" href="mailto:media@tjc.org?subject=Request%20DAM%20review&body=Please%20review%20this%20media%20for%20safe%20reuse.%0AContext:%20">
            Request DAM review
            <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
          </a>
        </section>

        <section className="help-workbench-grid mt-4" aria-label="Help assistant workbench">
          <div className="help-topic-list grid gap-2" aria-label="Help topics">
            {visibleTopics.map((topic) => (
              <DamHelpTopicButton
                key={topic.id}
                active={selected.id === topic.id}
                lane={topic.lane}
                title={topic.title}
                summary={topic.summary}
                onClick={() => setOpenTopic(topic.id)}
              />
            ))}
          </div>

          <section className="help-detail-panel" aria-live="polite">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="dam-kicker">Selected topic</p>
                <h2 className="mt-1 text-xl font-black tracking-[0] text-[#111827]">{selected.title}</h2>
                <p className="mt-1.5 max-w-[60ch] text-sm font-semibold leading-6 text-[#4b5563]">{selected.summary}</p>
              </div>
              <Link className="help-primary-link" href={selected.route}>
                Open page
              </Link>
            </div>

            <dl className="help-selected-record mt-4 grid gap-2 sm:grid-cols-3">
              <div>
                <dt>Lane</dt>
                <dd>{selected.lane}</dd>
              </div>
              <div>
                <dt>Decision</dt>
                <dd>{selected.id === "download" ? "Open record first" : selected.id === "send" ? "Review only" : "Use guidance"}</dd>
              </div>
              <div>
                <dt>Safe next step</dt>
                <dd>{selected.id === "review" || selected.id === "source" ? "Request review" : "Open page"}</dd>
              </div>
            </dl>

            <div className="help-guidance-grid mt-4 grid gap-2">
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

        {!visibleTopics.length ? (
          <div className="mt-5 rounded-xl border border-[#d7dde2] bg-white p-6 text-sm font-medium text-[#4b5563]">
            No help topic matched. Request DAM review when unsure.
          </div>
        ) : null}
      </section>

      <aside className="help-assistant-rail grid h-fit gap-4 lg:sticky lg:top-24">
        <section className="help-side-panel">
          <p className="dam-kicker">Quick decision</p>
          <DamHelpDecisionPanel items={decisionTree} />
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
