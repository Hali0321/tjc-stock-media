export const inspectorDrawerTabs = ["Details", "Rights & restrictions", "Versions", "Activity"];

export const assetDetailTabs = ["Metadata", "Keywords", "AI Insights", "Comments", "Activity", "Usage History"];

export function isActivityTab(tab: string) {
  return tab === "Activity" || tab === "Usage History";
}
