"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileLock2, MessageCircle, Search, UploadCloud } from "lucide-react";
import { DamAssistantLaneCard as AssistantLaneCard, DamHelpDecisionPanel, DamHelpTopicButton, DamTrustSignalStrip as TrustSignalStrip } from "@/components/dam/DamWorkspace";

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
    title: "Download only approved copy",
    summary: "Open the media record and download only the approved derivative when verdict and scope match.",
    route: "/",
    lane: "Record check",
    doText: "Use Download Approved Copy only when the record says Ready to use and the guidance matches your channel.",
    avoidText: "Do not use Google Drive originals, remembered files, screenshots, or source files as a shortcut."
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
    title: "Source/original access is restricted",
    summary: "Master originals remain restricted and require a separate request.",
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
    id: "public",
    title: "Public or external use",
    summary: "Public/social/web use needs stronger evidence than internal drafts or slides.",
    route: "/review?queue=rights-review",
    lane: "Strict gate",
    doText: "Confirm source, owner/license, usage scope, attribution, proof link, reviewer, review date, and re-review date.",
    avoidText: "Do not treat online free images, package membership, or old use as proof."
  },
  {
    id: "incident",
    title: "Rights incident or takedown",
    summary: "If an asset becomes unsafe, stop reuse and make the audit trail answer who used it and why.",
    route: "/review?queue=rights-review",
    lane: "Incident path",
    doText: "Use Do Not Use, request review, and preserve notes about source, license, downloads, package use, and allowed scope.",
    avoidText: "Do not quietly replace or keep sharing media after rights, people, or source concerns appear."
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
  ["Need media now?", "Search approved media first. If nothing is ready, browse Packages."],
  ["Opened media record?", "Confirm verdict, scope, evidence, and derivative state before reuse."],
  ["Verdict says Ready to use?", "Download approved copy and follow guidance."],
  ["Public/external use?", "Requires source, owner/license, usage scope, attribution, proof, reviewer, and re-review evidence."],
  ["People/youth, rights, or source unclear?", "Stop and request DAM review."],
  ["Need original/source file?", "Request source-file access. It is restricted by default."]
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
    <div className="dam-help-shell mx-auto grid w-full max-w-[1760px] gap-5 px-4 py-5 md:px-6 xl:grid-cols-[minmax(0,1fr)_minmax(26rem,30rem)]">
      <section className="min-w-0">
        <div className="help-hero">
          <div className="help-command-main">
            <p className="dam-kicker">Media use guide</p>
            <h1 className="mt-1 text-2xl font-black leading-tight tracking-[0] text-[#111827] sm:text-3xl">
              Safe reuse guide
            </h1>
            <p className="mt-2 max-w-[58ch] text-sm font-semibold leading-6 text-[#4b5563]">
              Find approved media first. Open the media record before reuse. Download only approved copies. If rights, people, source, or scope is unclear, request DAM review.
            </p>
            <p className="mt-2 max-w-[72ch] text-xs font-black uppercase tracking-[.04em] text-[#725216]">
              Package approval does not mean item approval. Source/original access is restricted by default.
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
              ["Download", "Approved copy only"],
              ["Escalate", "Request DAM review"]
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-3">
          <TrustSignalStrip
            signals={[
              { label: "First answer", value: "Open media record", tone: "info" },
              { label: "Use media", value: "Only if verdict says ready", tone: "approved" },
              { label: "Public use", value: "Evidence required", tone: "review" },
              { label: "Unclear rights", value: "Request DAM review", tone: "review" },
              { label: "Source files", value: "Restricted by default", tone: "blocked" }
            ]}
          />
        </div>

        <section className="help-lane-strip mt-4 grid gap-3 lg:grid-cols-3" aria-label="Safe media use paths">
          <AssistantLaneCard label="Find" detail="Start from approved copies, saved views, or ministry packages." />
          <AssistantLaneCard label="Verify" detail="Open the media record for approval, restrictions, evidence, and source state." />
          <AssistantLaneCard label="Escalate" detail="Request DAM review when people, rights, source, scope, proof, or attribution is unclear." />
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
            <section className="mt-4 rounded-[12px] border border-[#ead6a8] bg-[#fff8e8] p-4 text-sm font-semibold leading-relaxed text-[#725216]">
              <strong className="block text-[#5c3c05]">Fast safety rule</strong>
              <span>No evidence = no public/external download. Approved derivative is the safe copy. Master/original remains restricted. DAM review remains the approval truth.</span>
            </section>
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
