"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  FileCheck2,
  FileLock2,
  FileText,
  FolderOpen,
  Globe2,
  MessageCircle,
  Search,
  ShieldCheck,
  UploadCloud
} from "lucide-react";

type HelpTask = {
  id: string;
  title: string;
  summary: string;
  href: string;
  icon: typeof Search;
};

type HelpFaq = {
  question: string;
  answer: string;
};

const gettingStarted = [
  { label: "1. Find media", detail: "Search by use case, event, ministry, topic, or package.", icon: Search },
  { label: "2. Check status", detail: "Open the record to review approval, rights, and usage.", icon: ShieldCheck },
  { label: "3. Download", detail: "Download the approved derivative for your intended use.", icon: Download },
  { label: "4. If unsure", detail: "Request DAM review for help or additional access.", icon: ArrowRight }
];

const commonTasks: HelpTask[] = [
  { id: "find", title: "Find approved media", summary: "Search by use case, event, ministry, topic, or package.", href: "/", icon: Search },
  { id: "status", title: "Check approval status", summary: "View approval, rights, usage scope, and expiration.", href: "/", icon: ShieldCheck },
  { id: "download", title: "Download approved copy", summary: "Open the record and download the approved derivative.", href: "/", icon: Download },
  { id: "package", title: "Use a package", summary: "Start from a curated ministry kit and confirm each item.", href: "/collections", icon: FolderOpen },
  { id: "source", title: "Request source-file access", summary: "Request access to source/original files when needed.", href: "/guide#request-review", icon: FileLock2 },
  { id: "send", title: "Send media for review", summary: "Submit files or links for review and approval.", href: "/upload", icon: UploadCloud },
  { id: "public", title: "Public / external use", summary: "Review rules for public, social, and external use.", href: "/guide#policies", icon: Globe2 },
  { id: "incident", title: "Rights incident or takedown", summary: "Report rights issues or request content removal.", href: "/review?queue=rights-review", icon: FileCheck2 }
];

const reviewReasons = [
  "Approval, rights, or scope is unclear",
  "Need access to source/original files",
  "New use, audience, or channel",
  "Rights incident or takedown"
];

const quickLinks = [
  { title: "Packages", detail: "Browse ministry packages and kits", href: "/collections", icon: FolderOpen },
  { title: "Recent uploads", detail: "View recently uploaded media", href: "/upload", icon: UploadCloud },
  { title: "Source-file access", detail: "Submit or check source-file requests", href: "/guide#request-review", icon: FileLock2 },
  { title: "Review requests", detail: "Track review and access requests", href: "/review", icon: FileText }
];

const policies = [
  { title: "Usage policy", detail: "Approved uses and restrictions" },
  { title: "Rights & consent", detail: "Copyright, consent, and licensing" },
  { title: "Public use rules", detail: "Social, web, and external distribution" },
  { title: "Metadata standards", detail: "Naming, tagging, and descriptions" }
];

const faqs: HelpFaq[] = [
  {
    question: "What is an approved derivative?",
    answer: "The approved derivative is the safe copy cleared for distribution. Source/original access is restricted by default."
  },
  {
    question: "How do I know if I can use this media publicly?",
    answer: "Open the media record and confirm approval status, usage scope, rights evidence, consent notes, reviewer, and review date. If any part is unclear, request DAM review."
  },
  {
    question: "What should I do if I need source files?",
    answer: "Submit a source-file access request. Include the record, ministry use, deadline, and why the approved derivative is not enough."
  },
  {
    question: "How long is media approved for?",
    answer: "Use the review date and expiration or re-review notes on the media record. If approval looks old or scope changed, request a new review."
  }
];

export function GuidePage() {
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(0);

  const visibleTasks = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return commonTasks;
    return commonTasks.filter((task) => {
      const haystack = `${task.title} ${task.summary}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [query]);

  const leftTasks = visibleTasks.filter((_, index) => index % 2 === 0);
  const rightTasks = visibleTasks.filter((_, index) => index % 2 === 1);

  return (
    <div className="dam-help-center">
      <main className="help-center-main">
        <section className="help-center-hero" aria-labelledby="help-center-title">
          <div>
            <h1 id="help-center-title">Media Help Center</h1>
            <p>Find the right media, check approval and usage rights, and request DAM review when additional access is needed.</p>
          </div>
          <form className="help-center-search" role="search">
            <Search size={19} strokeWidth={1.9} aria-hidden="true" />
            <label htmlFor="help-center-search-input" className="sr-only">Search help articles, topics, and guides</label>
            <input
              id="help-center-search-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search help articles, topics, and guides..."
            />
          </form>
        </section>

        <section className="help-center-proof" aria-label="Safe copy rule">
          <span><ShieldCheck size={22} strokeWidth={1.9} aria-hidden="true" /></span>
          <div>
            <strong>Approved derivative is the safe copy</strong>
            <p>Use the approved copy for distribution. Source/original access is restricted by default.</p>
            <Link href="#faq">Learn more about safe reuse <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
        </section>

        <section className="help-center-start" aria-labelledby="getting-started-title">
          <h2 id="getting-started-title">Getting started</h2>
          <div className="help-start-steps">
            {gettingStarted.map((item, index) => {
              const StepIcon = item.icon;
              return (
                <article key={item.label}>
                  <span><StepIcon size={24} strokeWidth={1.8} aria-hidden="true" /></span>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </div>
                  {index < gettingStarted.length - 1 ? <ArrowRight className="help-step-arrow" size={18} strokeWidth={1.8} aria-hidden="true" /> : null}
                </article>
              );
            })}
          </div>
        </section>

        <section className="help-center-tasks" aria-labelledby="common-tasks-title">
          <h2 id="common-tasks-title">Common tasks</h2>
          {visibleTasks.length ? (
            <div className="help-task-columns">
              {[leftTasks, rightTasks].map((tasks, columnIndex) => (
                <div className="help-task-column" key={columnIndex}>
                  {tasks.map((task) => {
                    const TaskIcon = task.icon;
                    return (
                      <Link className="help-task-row" href={task.href} key={task.id}>
                        <TaskIcon size={22} strokeWidth={1.85} aria-hidden="true" />
                        <span>
                          <strong>{task.title}</strong>
                          <small>{task.summary}</small>
                        </span>
                        <ArrowRight size={17} strokeWidth={1.8} aria-hidden="true" />
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <p className="help-empty-result">No help task matched. Request DAM review when unsure.</p>
          )}
        </section>

        <section id="faq" className="help-center-faq" aria-labelledby="faq-title">
          <header>
            <h2 id="faq-title">Help topics (FAQ)</h2>
            <Link href="/guide">View all articles <ArrowRight size={15} aria-hidden="true" /></Link>
          </header>
          <div className="help-faq-list">
            {faqs.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <article className={isOpen ? "is-open" : ""} key={item.question}>
                  <button type="button" onClick={() => setOpenFaq(isOpen ? -1 : index)} aria-expanded={isOpen}>
                    <span>{item.question}</span>
                    <ChevronDown size={18} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                  {isOpen ? <p>{item.answer}</p> : null}
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <aside className="help-center-rail" aria-label="Media help actions">
        <section id="request-review" className="help-review-card">
          <header>
            <MessageCircle size={22} strokeWidth={1.8} aria-hidden="true" />
            <div>
              <h2>Request DAM Review</h2>
              <p>If approval, source access, rights, or use scope is unclear, open a request with the media team.</p>
            </div>
          </header>
          <a className="help-review-primary" href="mailto:media@tjc.org?subject=Request%20DAM%20review&body=Please%20review%20this%20media%20for%20safe%20reuse.%0AContext:%20">
            Open review request <ExternalLink size={15} strokeWidth={1.8} aria-hidden="true" />
          </a>
          <div>
            <h3>When to request review</h3>
            <ul>
              {reviewReasons.map((reason) => (
                <li key={reason}><CheckCircle2 size={15} strokeWidth={1.9} aria-hidden="true" />{reason}</li>
              ))}
            </ul>
          </div>
          <Link href="#faq">Learn more about request types <ArrowRight size={15} aria-hidden="true" /></Link>
        </section>

        <section className="help-side-card">
          <h2>Quick links</h2>
          <div className="help-link-list">
            {quickLinks.map((item) => {
              const LinkIcon = item.icon;
              return (
                <Link href={item.href} key={item.title}>
                  <LinkIcon size={21} strokeWidth={1.8} aria-hidden="true" />
                  <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                  <ChevronDown size={16} strokeWidth={1.7} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>

        <section id="policies" className="help-side-card">
          <h2>Policies &amp; Guidelines</h2>
          <div className="help-link-list is-policy">
            {policies.map((item) => (
              <Link href="/guide" key={item.title}>
                <BookOpen size={20} strokeWidth={1.8} aria-hidden="true" />
                <span><strong>{item.title}</strong><small>{item.detail}</small></span>
              </Link>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
