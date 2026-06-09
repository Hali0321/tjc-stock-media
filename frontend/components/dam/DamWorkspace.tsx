"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FolderOpen,
  Info,
  Mail,
  PackageCheck,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  type LucideIcon
} from "lucide-react";
import { MediaPreview } from "@/components/MediaPreview";
import { FilterPills } from "@/components/FilterPills";
import { FilterSidebar } from "@/components/FilterSidebar";
import { LibraryPagination } from "@/components/LibraryPagination";
import { SavedViewCard } from "@/components/SavedViewCard";
import { assetPresentation } from "@/lib/presentation";
import { cn } from "@/lib/ui";
import { viewerVerdictForAsset, type ViewerVerdictTone } from "@/lib/viewer-verdict";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import type { ReactNode } from "react";

type PrimaryActionProps = {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
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

function PrimaryAction({
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
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-55",
    tone === "primary" && "bg-tjc-evergreen text-white shadow-[0_12px_26px_rgba(15,61,46,.18)] hover:bg-[#082f29]",
    tone === "secondary" && "border border-[#b9c9bf] bg-white text-tjc-evergreen hover:bg-[#eef7f1]",
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

function EmptyState({
  title,
  description,
  primary,
  secondary,
  tertiary,
  className
}: {
  title: string;
  description: string;
  primary?: ReactNode;
  secondary?: ReactNode;
  tertiary?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("empty-state-stage relative overflow-hidden rounded-2xl border border-[#c9d8cf] bg-[#f8fbf8] p-5", className)} role="status">
      <div className="absolute inset-y-0 right-0 hidden w-56 bg-[linear-gradient(135deg,rgba(15,61,46,.12)_0_1px,transparent_1px)] bg-[size:18px_18px] md:block" aria-hidden="true" />
      <div className="relative z-[1] grid max-w-3xl gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#b8d9c6] bg-white px-3 py-1 text-xs font-black text-tjc-evergreen">
          <PackageCheck size={14} strokeWidth={1.9} aria-hidden="true" />
          Approved-copy workspace
        </span>
        <div>
          <h2 className="text-xl font-black leading-tight text-tjc-ink sm:text-2xl">{title}</h2>
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

function HeroSearch({
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
    <form className="hero-search-shell grid gap-2 rounded-2xl bg-white p-1 md:grid-cols-[auto_1fr_auto]" onSubmit={onSubmit} aria-label={ops ? "Ops search" : "Find approved media"}>
      <span className="hidden h-13 w-13 place-items-center rounded-xl bg-[#eef7f1] text-tjc-evergreen md:grid" aria-hidden="true">
        <Search size={20} strokeWidth={2} />
      </span>
      <label className="sr-only" htmlFor="find-media-search">{ops ? "Ops Search" : "Search approved media"}</label>
      <input
        id="find-media-search"
        className="min-h-13 min-w-0 rounded-xl border border-transparent bg-[#fbfcfb] px-4 text-sm font-semibold text-tjc-ink placeholder:text-[#68756d] focus:border-[#9cb9ab] sm:text-base"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        name="q"
        type="search"
      />
      <PrimaryAction type="submit" icon={Search} className="min-h-13 px-6">Search</PrimaryAction>
    </form>
  );
}

function UseCaseCard({
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
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf7f1] text-tjc-evergreen">
        <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <strong className="block text-base font-black leading-tight text-tjc-ink">{label}</strong>
        <span className="mt-1 block text-sm font-semibold leading-snug text-tjc-muted">{detail}</span>
      </span>
      <ArrowRight className="ml-auto mt-1 shrink-0 text-[#7d8a82] transition group-hover:translate-x-0.5 group-hover:text-tjc-evergreen" size={16} strokeWidth={1.9} aria-hidden="true" />
    </>
  );
  const classes = "group grid min-h-[4.6rem] grid-cols-[auto_1fr_auto] items-start gap-3 rounded-xl border border-[#d6dfd8] bg-white px-3 py-3 text-left transition duration-200 hover:border-[#9ebdac] hover:bg-[#f4faf6] active:translate-y-px";
  if (href) return <Link href={href} className={classes}>{content}</Link>;
  return <button type="button" className={classes} onClick={onClick}>{content}</button>;
}

function StatusBadge({ tone, children }: { tone: ViewerVerdictTone | "info" | "ok" | "danger"; children: ReactNode }) {
  return (
    <span className={cn(
      "inline-flex min-h-7 max-w-full items-center rounded-lg border px-2.5 text-xs font-black",
      tone === "info" && "border-[#c8d7e6] bg-[#f2f7fb] text-[#27435b]",
      tone === "ok" && "border-[#b9d8c6] bg-[#eef8f2] text-[#194f34]",
      tone === "danger" && "border-[#dfb9b5] bg-[#fff1ef] text-[#7b332f]",
      tone !== "info" && tone !== "ok" && tone !== "danger" && verdictToneClass(tone)
    )}>
      <span className="truncate">{children}</span>
    </span>
  );
}

function MediaCard({ asset, role, priority = false }: { asset: StockMediaAsset; role: DemoRole; priority?: boolean }) {
  const display = assetPresentation(asset, role);
  const verdict = viewerVerdictForAsset(asset, role);
  const previewDetail = verdict.canDownload ? display.cardSubtitle : verdict.reason;
  return (
    <article className={cn("media-card group grid h-full overflow-hidden rounded-2xl bg-white transition duration-200", priority && "md:row-span-2")}>
      <Link href={`/assets/${asset.id}`} className={cn("relative block overflow-hidden bg-[#e9efeb]", priority ? "aspect-[16/11] md:aspect-[4/3]" : "aspect-[4/3]")} aria-label={`Open ${display.title}`}>
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
        <span className="absolute bottom-3 right-3 rounded-lg bg-white/92 px-2.5 py-1 text-[11px] font-black text-tjc-evergreen shadow-sm">
          Media record
        </span>
      </Link>
      <div className="grid gap-3 p-4">
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-lg font-black leading-tight text-tjc-ink">{display.title}</h2>
          <p className="mt-1 line-clamp-1 text-sm font-semibold text-tjc-muted">{display.cardSubtitle}</p>
        </div>
        <div className="grid min-w-0 gap-1 rounded-xl bg-[#f5f8f5] p-3">
          <span className="min-w-0 text-xs font-black text-tjc-evergreen">Best use</span>
          <span className="line-clamp-2 text-sm font-semibold text-[#3f4a43]">{display.usage || display.cardSubtitle}</span>
        </div>
        {verdict.canDownload ? (
          <PrimaryAction href={verdict.downloadHref} icon={Download}>Use this media</PrimaryAction>
        ) : (
          <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#c5d1c9] bg-white px-4 text-sm font-black text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px" href={`/assets/${asset.id}`}>
            View guidance
            <ArrowRight size={16} strokeWidth={1.9} aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
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

export { MediaCard as DamMediaCard };
export { StatusBadge as DamRecordStatusBadge };
export { EmptyState as DamEmptyState };
export { HeroSearch as DamHeroSearch };
export { PrimaryAction as DamPrimaryAction };
export { UseCaseCard as DamUseCaseCard };
export { FilterPills as DamFilterPills };
export { FilterSidebar as DamFilterSidebar };
export { LibraryPagination as DamLibraryPagination };
export { SavedViewCard as DamSavedViewCard };
