import { cn } from "@/lib/ui";

export {
  EvidenceChecklist as DamEvidenceChecklist,
  GovernanceMetric as DamGovernanceMetric
} from "@/components/DamExperience";

export { HoldReleaseButton as DamHoldReleaseButton, HoldToConfirmButton as DamHoldToConfirmButton } from "@/components/HoldReleaseButton";
export { ReviewActionDialog as DamReviewActionDialog } from "@/components/ReviewActionDialog";
export { ReviewQueueAssetCard as DamReviewQueueAssetCard } from "@/components/ReviewQueueAssetCard";
export { ReviewTriageStrip as DamReviewTriageStrip } from "@/components/ReviewTriageStrip";

export function DamReviewDecisionLockPanel({
  missingLabels,
  completed,
  total
}: {
  missingLabels: string[];
  completed: number;
  total: number;
}) {
  const locked = missingLabels.length > 0;
  const visibleMissing = missingLabels.slice(0, 4).join(", ");
  return (
    <section
      className={cn("mt-2 rounded-xl border p-3 text-sm", locked ? "border-[#ead6a8] bg-[#fff8e8] text-[#725216]" : "border-[#b8d9c6] bg-[#f3fbf6] text-[#24583d]")}
      data-testid="review-decision-requirements"
      aria-label="Decision requirements"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="font-black">{locked ? "Decision locked" : "Decision ready"}</strong>
        <span className="rounded-md bg-white px-2 py-1 text-xs font-black tabular-nums">{completed}/{total} complete</span>
      </div>
      <p className="mt-1 text-xs font-semibold leading-relaxed">
        {locked
          ? `Complete before approval: ${visibleMissing}${missingLabels.length > 4 ? ` and ${missingLabels.length - 4} more` : ""}.`
          : "Evidence and note are ready for a pending review write."}
      </p>
    </section>
  );
}
