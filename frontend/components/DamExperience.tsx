"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileLock2,
  FolderOpen,
  Info,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  type LucideIcon
} from "lucide-react";
import { MediaPreview } from "@/components/MediaPreview";
import { cn } from "@/lib/ui";
import type { CatalogCollection, DemoRole, StockMediaAsset } from "@/lib/types";
import { assetPresentation, collectionImageUrl } from "@/lib/presentation";
import { requestReviewMailto, viewerVerdictForAsset, type ViewerVerdict, type ViewerVerdictTone } from "@/lib/viewer-verdict";

type PrimaryActionProps = {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  icon?: LucideIcon;
  tone?: "primary" | "secondary" | "quiet" | "danger";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
};

function verdictToneClass(tone: ViewerVerdictTone) {
  if (tone === "ready") return "border-[#b9d8c6] bg-[#eef8f2] text-[#194f34]";
  if (tone === "restricted") return "border-[#d2dbe6] bg-[#f2f6fa] text-[#27435b]";
  if (tone === "request") return "border-[#d8cfd8] bg-[#f7f2f6] text-[#5d4657]";
  if (tone === "unavailable") return "border-[#dfb9b5] bg-[#fff1ef] text-[#7b332f]";
  return "border-[#e5cf93] bg-[#fff8e8] text-[#71500f]";
}

export function PrimaryAction({
  href,
  onClick,
  children,
  icon: Icon,
  tone = "primary",
  className,
  disabled,
  type = "button"
}: PrimaryActionProps) {
  const classes = cn(
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3.5 text-sm font-bold transition duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-55",
    tone === "primary" && "bg-tjc-evergreen text-white hover:bg-[#082f29]",
    tone === "secondary" && "border border-[#c5d1c9] bg-white text-tjc-evergreen hover:bg-[#eef7f1]",
    tone === "quiet" && "bg-transparent text-tjc-evergreen hover:bg-[#edf4ef]",
    tone === "danger" && "bg-[#7d2d2a] text-white hover:bg-[#642320]",
    className
  );
  const content = (
    <>
      {Icon ? <Icon size={16} strokeWidth={1.9} aria-hidden="true" /> : null}
      <span>{children}</span>
    </>
  );
  if (href && !disabled) return <a className={classes} href={href}>{content}</a>;
  return <button className={classes} type={type} onClick={onClick} disabled={disabled}>{content}</button>;
}

export function EmptyState({
  title,
  description,
  primary,
  secondary,
  tertiary,
  className
}: {
  title: string;
  description: string;
  primary?: React.ReactNode;
  secondary?: React.ReactNode;
  tertiary?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("empty-state-stage relative overflow-hidden rounded-lg border border-[#d9e3dc] bg-white p-4", className)} role="status">
      <div className="grid max-w-3xl gap-2.5">
        <div>
          <h2 className="text-base font-black leading-tight text-tjc-ink sm:text-lg">{title}</h2>
          <p className="mt-1 max-w-[62ch] text-sm font-semibold leading-relaxed text-tjc-muted">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {primary}
          {secondary}
          {tertiary}
        </div>
      </div>
    </section>
  );
}

export function HeroSearch({
  value,
  onChange,
  onSubmit,
  ops,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  ops?: boolean;
  placeholder: string;
}) {
  return (
    <form className="hero-search-shell grid gap-2 rounded-lg bg-white p-1 md:grid-cols-[1fr_auto]" onSubmit={onSubmit} aria-label={ops ? "Ops search" : "Find approved media"}>
      <label className="sr-only" htmlFor="find-media-search">{ops ? "Ops Search" : "Search approved media"}</label>
      <input
        id="find-media-search"
        className="min-h-10 min-w-0 rounded-md border border-transparent bg-[#fbfcfb] px-3 text-sm font-semibold text-tjc-ink placeholder:text-[#68756d] focus:border-[#9cb9ab] sm:text-base"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        name="q"
        type="search"
      />
      <PrimaryAction type="submit" icon={Search} className="min-h-10 px-5">Search</PrimaryAction>
    </form>
  );
}

export function UseCaseCard({
  label,
  detail,
  icon: Icon,
  href,
  onClick
}: {
  label: string;
  detail: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="min-w-0">
        <strong className="flex items-center gap-2 text-base font-black leading-tight text-tjc-ink">
          <Icon size={17} strokeWidth={1.9} aria-hidden="true" className="shrink-0 text-tjc-evergreen" />
          {label}
        </strong>
        <span className="mt-1 block text-sm font-semibold leading-snug text-tjc-muted">{detail}</span>
      </span>
      <ArrowRight className="mt-1 text-[#7d8a82] transition group-hover:translate-x-0.5 group-hover:text-tjc-evergreen" size={16} strokeWidth={1.9} aria-hidden="true" />
    </>
  );
  const classes = "group grid min-h-[3.75rem] grid-cols-[1fr_auto] items-start gap-3 rounded-md border border-[#e5e7eb] bg-white px-3 py-2.5 text-left transition duration-200 hover:border-[#cbd5e1] hover:bg-[#fafafa] active:translate-y-px";
  if (href) return <Link href={href} className={classes}>{content}</Link>;
  return <button type="button" className={classes} onClick={onClick}>{content}</button>;
}

export function StatusBadge({ tone, children }: { tone: ViewerVerdictTone | "info" | "ok" | "danger"; children: React.ReactNode }) {
  return (
    <span className={cn(
      "inline-flex min-h-7 max-w-full items-center rounded-[9px] border px-2.5 text-xs font-black",
      tone === "info" && "border-[#c8d7e6] bg-[#f2f7fb] text-[#27435b]",
      tone === "ok" && "border-[#b9d8c6] bg-[#eef8f2] text-[#194f34]",
      tone === "danger" && "border-[#dfb9b5] bg-[#fff1ef] text-[#7b332f]",
      tone !== "info" && tone !== "ok" && tone !== "danger" && verdictToneClass(tone)
    )}>
      <span className="truncate">{children}</span>
    </span>
  );
}

export function ProtectedPreview({
  label = "Preview protected",
  detail = "Open the media record for review status.",
  className
}: {
  label?: string;
  detail?: string;
  className?: string;
}) {
  return (
    <div className={cn("protected-preview grid h-full min-h-48 place-items-center overflow-hidden rounded-lg bg-[#eef3ef] p-5 text-center", className)}>
      <div className="protected-preview-frame relative grid min-h-[10rem] w-full max-w-[22rem] place-items-center overflow-hidden rounded-lg border border-white/70 bg-white/65 p-4">
        <div className="absolute inset-2 grid grid-cols-4 gap-1 opacity-70" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, index) => (
            <span className="rounded bg-[#e7eee9]" key={index} />
          ))}
        </div>
        <div className="absolute inset-3 rounded-md border border-dashed border-[#aab9b1] bg-white/35 backdrop-blur-[1px]" aria-hidden="true" />
        <div className="relative z-[1] grid max-w-[18rem] justify-items-center gap-2.5 rounded-md border border-[#dce5df] bg-white/90 px-4 py-3">
          <span className="inline-flex items-center gap-2 rounded border border-[#cbd5e1] bg-white px-2.5 py-1 text-xs font-black text-tjc-evergreen">
            <FileLock2 size={14} strokeWidth={1.8} aria-hidden="true" />
            Protected preview
          </span>
          <span>
            <strong className="block text-base font-black text-tjc-ink">{label}</strong>
            <span className="mt-1 block text-sm font-semibold leading-snug text-tjc-muted">{detail}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function packageCoverTone(name: string) {
  const tones = [
    "from-[#102f2a] via-[#dfe8e2] to-[#f8faf8]",
    "from-[#22364a] via-[#e5ebf1] to-[#f8fafc]",
    "from-[#4a381d] via-[#f3ead5] to-[#fffaf0]",
    "from-[#342f44] via-[#ece9f3] to-[#faf8ff]",
    "from-[#173a33] via-[#e4efe7] to-[#fbfcfb]"
  ];
  const code = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return tones[code % tones.length];
}

function packageInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PK";
}

function PackageCover({
  collection,
  readyCount,
  reviewNeeded
}: {
  collection: CatalogCollection;
  readyCount: number;
  reviewNeeded: number;
}) {
  const images = collection.images.slice(0, 4);
  if (images.length) {
    return (
      <div className="package-cover grid aspect-[4/3] grid-cols-2 gap-1 overflow-hidden rounded-[10px] bg-[#edf2ee] p-1">
        {images.map((image) => (
          <span className="overflow-hidden rounded-[7px] bg-white" key={image.src}>
            <img className="h-full min-h-12 w-full object-cover" src={image.src} alt={image.alt} loading="lazy" />
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className={cn("package-cover generated-package-cover relative grid aspect-[4/3] overflow-hidden rounded-[10px] bg-gradient-to-br p-3 text-white", packageCoverTone(collection.name))}>
      <div className="absolute inset-0 opacity-[.18]" aria-hidden="true">
        <div className="h-full w-full bg-[linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>
      <div className="relative z-[1] grid h-full content-between">
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-black text-tjc-evergreen">{packageInitials(collection.name)}</span>
          <span className="text-right text-[11px] font-black uppercase tracking-[.08em] text-white/85">Package</span>
        </div>
        <div>
          <strong className="line-clamp-2 text-sm font-black leading-tight text-white drop-shadow-sm">{collection.name}</strong>
          <span className="mt-2 block text-[11px] font-black text-white/90">{readyCount.toLocaleString()} ready / {reviewNeeded.toLocaleString()} review</span>
        </div>
      </div>
    </div>
  );
}

export function VerdictPanel({
  verdict,
  title,
  onRequestReview,
  requestHref,
  compact
}: {
  verdict: ViewerVerdict;
  title?: string;
  onRequestReview?: () => void;
  requestHref?: string;
  compact?: boolean;
}) {
  function secondaryActionProps(action: string) {
    if (action === "View credit") return { href: "#credit", icon: Info };
    if (action === "View use guidance") return { href: "#use-guidance", icon: Info };
    return requestHref ? { href: requestHref, icon: action.includes("source") ? FileLock2 : Mail } : { onClick: onRequestReview, icon: action.includes("source") ? FileLock2 : Mail };
  }
  return (
    <section className={cn("verdict-panel rounded-[14px] border p-4", verdictToneClass(verdict.tone), compact ? "p-3" : "p-5")} data-testid="asset-primary-verdict">
      <div className="min-w-0">
        <span className="text-xs font-black">{title || "Can I use this?"}</span>
        <h2 className="mt-1 text-2xl font-black leading-tight text-current">{verdict.title}</h2>
        <p className="mt-2 max-w-[62ch] text-sm font-semibold leading-relaxed opacity-90">{verdict.reason}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {verdict.canDownload ? (
            <PrimaryAction href={verdict.downloadHref} icon={Download}>Download approved copy</PrimaryAction>
          ) : (
            <PrimaryAction href={requestHref} onClick={requestHref ? undefined : onRequestReview} icon={Mail}>Request DAM review</PrimaryAction>
          )}
          {verdict.secondaryActions.slice(0, 2).map((action) => {
            return <PrimaryAction key={action} tone="secondary" {...secondaryActionProps(action)}>{action}</PrimaryAction>;
          })}
        </div>
      </div>
    </section>
  );
}

export function MediaCard({ asset, role, priority = false }: { asset: StockMediaAsset; role: DemoRole; priority?: boolean }) {
  const display = assetPresentation(asset, role);
  const verdict = viewerVerdictForAsset(asset, role);
  const previewDetail = verdict.canDownload ? display.cardSubtitle : verdict.reason;
  return (
    <article className="media-card group grid h-full overflow-hidden rounded-[12px] bg-white transition duration-200">
      <Link href={`/assets/${asset.id}`} className={cn("relative block overflow-hidden bg-[#e9efeb]", priority ? "aspect-[16/10]" : "aspect-[4/3]")} aria-label={`Open ${display.title}`}>
        <MediaPreview
          src={display.image}
          alt={asset.thumbnailAlt}
          label={verdict.canDownload ? "Preview available" : "Preview protected"}
          detail={previewDetail}
          imgClassName="transition duration-300 group-hover:scale-[1.025]"
        />
        <span className="absolute left-3 top-3">
          <StatusBadge tone={verdict.tone}>{verdict.label}</StatusBadge>
        </span>
      </Link>
      <div className="grid gap-3 p-3">
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-base font-black leading-tight text-tjc-ink">{display.title}</h2>
          <p className="mt-1 line-clamp-1 text-sm font-semibold text-tjc-muted">{display.cardSubtitle}</p>
        </div>
        <div className="grid min-w-0 gap-1 border-t border-[#eef1f3] pt-3">
          <span className="min-w-0 text-xs font-black text-tjc-muted">Best use</span>
          <span className="line-clamp-1 text-sm font-semibold text-[#3f4a43]">{display.usage || display.cardSubtitle}</span>
        </div>
        {verdict.canDownload ? (
          <PrimaryAction href={verdict.downloadHref} icon={Download}>Download approved copy</PrimaryAction>
        ) : (
          <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#c5d1c9] bg-white px-4 text-sm font-black text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px" href={`/assets/${asset.id}`}>
            View guidance
            <ArrowRight size={16} strokeWidth={1.9} aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}

export function PackageCard({
  collection,
  role,
  active,
  onOpen,
  onInspect
}: {
  collection: CatalogCollection;
  role: DemoRole;
  active?: boolean;
  onOpen: () => void;
  onInspect: () => void;
}) {
  const readyMatch = collection.approvalSummary.match(/\d+/);
  const rawReadyCount = readyMatch ? Number(readyMatch[0]) : collection.count;
  const readyCount = role === "Reviewer" || role === "DAM Admin" ? rawReadyCount : 0;
  const reviewNeeded = Math.max(0, collection.count - readyCount);
  const bestUse = collection.searchQuery || `${collection.ministry} media`;
  const safetySummary = `${readyCount.toLocaleString()} ready, ${reviewNeeded.toLocaleString()} need review`;
  return (
    <article className={cn("package-card grid gap-3 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white p-3 transition hover:border-[#cbd5e1] sm:p-4", active && "ring-2 ring-[#9cb9ab]")}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8.5rem]">
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-xl font-black leading-tight text-tjc-ink">{collection.name}</h2>
          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-relaxed text-tjc-muted">{collection.description}</p>
        </div>
        <PackageCover collection={collection} readyCount={readyCount} reviewNeeded={reviewNeeded} />
      </div>
      <div className="grid grid-cols-3 divide-x divide-[#e5e7eb] border-y border-[#e5e7eb] py-2 text-sm">
        <span className="px-2 font-black text-[#194f34]">{readyCount.toLocaleString()}<small className="mt-0.5 block font-semibold text-tjc-muted">ready</small></span>
        <span className="px-2 font-black text-[#71500f]">{reviewNeeded.toLocaleString()}<small className="mt-0.5 block font-semibold text-tjc-muted">review</small></span>
        <span className="min-w-0 px-2 font-black text-[#27435b]"><span className="block truncate">{collection.ministry}</span><small className="mt-0.5 block font-semibold text-tjc-muted">ministry</small></span>
      </div>
      <div className="grid gap-1 text-sm leading-relaxed">
        <p className="font-semibold text-tjc-muted"><strong className="font-black text-tjc-ink">Best use:</strong> {bestUse}</p>
        <p className="font-semibold text-tjc-muted"><strong className="font-black text-tjc-ink">Safety:</strong> {safetySummary}</p>
      </div>
      <p className="package-safety-line border-t border-[#eef1f3] pt-2 text-xs font-black leading-relaxed text-[#71500f]">Item-level approval required before reuse.</p>
      <div className="flex flex-wrap gap-2">
        <PrimaryAction onClick={onOpen} icon={Search}>Open media</PrimaryAction>
        <PrimaryAction onClick={onInspect} tone="secondary" icon={FolderOpen}>View details</PrimaryAction>
      </div>
    </article>
  );
}

export function PackageInspector({
  collection,
  totalCollections,
  onOpen,
  opsView
}: {
  collection?: CatalogCollection;
  totalCollections: number;
  onOpen: (collection: CatalogCollection) => void;
  opsView?: boolean;
}) {
  if (!collection) {
    return (
      <EmptyState
        title="Select a package"
        description="Choose a ministry package to see its purpose, safety summary, and item-level reuse reminder."
      />
    );
  }
  const readyMatch = collection.approvalSummary.match(/\d+/);
  const rawReadyCount = readyMatch ? Number(readyMatch[0]) : collection.count;
  const readyCount = opsView ? rawReadyCount : 0;
  const reviewNeeded = Math.max(0, collection.count - readyCount);
  const bestUse = collection.searchQuery || `${collection.ministry} media`;
  return (
    <aside className="package-inspector grid gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 sm:p-5">
      <div>
        <span className="text-sm font-black text-tjc-evergreen">{opsView ? "Package readiness" : "Package details"}</span>
        <h2 className="mt-1 text-2xl font-black leading-tight text-tjc-ink">{collection.name}</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-tjc-muted">{collection.description}</p>
      </div>
      <PackageCover collection={collection} readyCount={readyCount} reviewNeeded={reviewNeeded} />
      <div className="grid grid-cols-3 divide-x divide-[#e5e7eb] border-y border-[#e5e7eb] py-2 text-sm">
        <span className="px-2 font-black text-[#194f34]">{readyCount}<br /><small className="font-semibold text-tjc-muted">ready</small></span>
        <span className="px-2 font-black text-[#71500f]">{reviewNeeded}<br /><small className="font-semibold text-tjc-muted">review</small></span>
        <span className="px-2 font-black text-[#27435b]">{totalCollections}<br /><small className="font-semibold text-tjc-muted">packages</small></span>
      </div>
      <section className="grid gap-2">
        <h3 className="text-sm font-black text-tjc-ink">Suggested use</h3>
        <p className="text-sm font-semibold leading-relaxed text-tjc-muted">{bestUse}</p>
      </section>
        <section className="rounded-md border border-[#e5cf93] bg-[#fff8e8] p-3 text-sm font-semibold leading-relaxed text-[#71500f]">
        Package approval is not enough. Open each media record to confirm item-level approval before reuse.
      </section>
      {collection.peopleWarning ? (
        <section className="rounded-[10px] border border-[#dfb9b5] bg-[#fff1ef] p-3 text-sm font-semibold leading-relaxed text-[#7b332f]">
          {collection.peopleWarning}
        </section>
      ) : null}
      <PrimaryAction onClick={() => onOpen(collection)} icon={Search}>Open media</PrimaryAction>
    </aside>
  );
}

export function EvidenceChecklist({
  items,
  onToggle
}: {
  items: Array<{ id: string; label: string; complete: boolean }>;
  onToggle?: (id: string) => void;
}) {
  return (
    <div className="grid gap-2" aria-label="Evidence checklist">
      {items.map((item) => (
        <button
          type="button"
          className={cn("grid min-h-11 grid-cols-[auto_1fr] items-center gap-3 rounded-[10px] border px-3 text-left text-sm font-black transition", item.complete ? "border-[#b9d8c6] bg-[#eef8f2] text-[#194f34]" : "border-[#d8e1da] bg-white text-[#3f4a43] hover:bg-[#f8faf8]")}
          onClick={() => onToggle?.(item.id)}
          key={item.id}
        >
          {item.complete ? <CheckCircle2 size={17} strokeWidth={1.9} aria-hidden="true" /> : <span className="h-4 w-4 rounded-full border border-[#a7b5ac]" aria-hidden="true" />}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

export function GovernanceMetric({
  label,
  value,
  detail,
  tone = "info",
  href
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: "ok" | "warn" | "info" | "danger";
  href?: string;
}) {
  const classes = cn(
    "governance-metric block rounded-lg p-4 transition",
    tone === "ok" && "bg-[#eef8f2] text-[#194f34]",
    tone === "warn" && "bg-[#fff8e8] text-[#71500f]",
    tone === "danger" && "bg-[#fff1ef] text-[#7b332f]",
    tone === "info" && "bg-[#f2f6fa] text-[#27435b]"
  );
  const content = (
    <>
      <span className="text-sm font-black">{label}</span>
      <strong className="mt-2 block text-3xl font-black tabular-nums text-current">{typeof value === "number" ? value.toLocaleString() : value}</strong>
      <span className="mt-2 block text-sm font-semibold leading-snug opacity-85">{detail}</span>
    </>
  );
  if (href) return <Link className={classes} href={href}>{content}</Link>;
  return <div className={classes}>{content}</div>;
}

export function ViewerReadyHint({ asset, role }: { asset: StockMediaAsset; role: DemoRole }) {
  const verdict = viewerVerdictForAsset(asset, role);
  return (
    <div className={cn("rounded-[14px] border px-3 py-2 text-sm font-semibold", verdictToneClass(verdict.tone))}>
      <strong className="block font-black">{verdict.label}</strong>
      <span className="mt-1 block">{verdict.reason}</span>
    </div>
  );
}

export function packageCoverImages(collection: CatalogCollection, role: DemoRole, assets: StockMediaAsset[] = []) {
  if (collection.images.length) return collection.images;
  return assets.slice(0, 4).map((asset) => ({
    src: collectionImageUrl(asset, role) || "",
    alt: asset.thumbnailAlt
  })).filter((image) => image.src);
}

export const findUseCases = [
  { label: "Website image", detail: "Approved visuals for church web pages.", view: "website-hero", icon: Search },
  { label: "Slide background", detail: "Worship, class, and sermon deck images.", view: "sermon-slides", icon: Sparkles },
  { label: "Newsletter/social", detail: "Recap and announcement media.", view: "newsletter", icon: Mail },
  { label: "Youth-safe media", detail: "Start from lower-risk people visibility.", view: "no-people", icon: ShieldCheck },
  { label: "Logos and graphics", detail: "Graphics, flyers, and brand assets.", view: "graphics", icon: Info },
  { label: "Browse packages", detail: "Open curated ministry kits.", href: "/collections", icon: FolderOpen },
  { label: "Send new media", detail: "Submit files or links for review.", href: "/upload", icon: UploadCloud }
] as const;

export { requestReviewMailto };
