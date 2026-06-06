"use client";

import { MediaPreview } from "@/components/MediaPreview";
import { assetPresentation } from "@/lib/presentation";
import { reviewRiskFlags } from "@/lib/workflow-policy";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { cn } from "@/lib/ui";

type ReviewTriageStripProps = {
  assets: StockMediaAsset[];
  role: DemoRole;
  selectedId?: string;
  onSelect: (id: string) => void;
};

export function ReviewTriageStrip({ assets, role, selectedId, onSelect }: ReviewTriageStripProps) {
  const stripAssets = assets.slice(0, 12);
  if (!stripAssets.length) return null;

  return (
    <section className="mt-4 dam-dark-panel overflow-hidden p-3" aria-label="Visual triage strip">
      <div className="flex items-center justify-between gap-3 px-1 pb-3">
        <div>
          <span className="text-xs font-black uppercase tracking-[.08em] text-white/60">Visual triage</span>
          <h2 className="text-lg font-black text-white">Scan risk before opening records</h2>
        </div>
        <span className="hidden rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-black text-white/72 sm:inline-flex">
          First {stripAssets.length} loaded
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {stripAssets.map((asset) => {
          const display = assetPresentation(asset, role);
          const risk = reviewRiskFlags(asset)[0] || "Standard review";
          const selected = asset.id === selectedId;
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => onSelect(asset.id)}
              aria-pressed={selected}
              className={cn(
                "group grid min-w-0 gap-2 rounded-2xl border p-2 text-left transition hover:-translate-y-0.5 hover:bg-white/12 focus-visible:outline-white",
                selected ? "border-[#a8d9c0] bg-white/16 shadow-[0_0_0_2px_rgba(168,217,192,.22)]" : "border-white/12 bg-white/7"
              )}
            >
              <span className="block aspect-[4/3] overflow-hidden rounded-xl bg-black/25">
                <MediaPreview src={display.image} alt={asset.thumbnailAlt} imgClassName="transition duration-300 group-hover:scale-[1.035]" className="px-2" loading="eager" />
              </span>
              <span className="line-clamp-1 text-sm font-black text-white">{display.title}</span>
              <span className="line-clamp-1 rounded-full bg-[#fff0c2] px-2 py-1 text-[11px] font-black text-[#684a10]">{risk}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
