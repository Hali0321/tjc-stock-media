import type { EnterpriseStatus } from "@/lib/enterprise-status";

export type ReviewDecisionAction = {
  id: string;
  label: string;
  helper: string;
  status: EnterpriseStatus;
  action: "Approve Public" | "Request More Info" | "Do Not Use";
  tone?: "approve" | "restrict";
  icon: "check" | "file" | "alert";
};

export const reviewWorkbenchTabs = ["Details", "Metadata", "Rights & Checks", "Comments", "Activity", "History"];

export const reviewDecisionActions: ReviewDecisionAction[] = [
  {
    id: "approve",
    label: "Approve",
    helper: "Queues a pending ResourceSpace write.",
    status: "Approved",
    action: "Approve Public",
    tone: "approve",
    icon: "check"
  },
  {
    id: "request-changes",
    label: "Request Changes",
    helper: "Send back to uploader for updates.",
    status: "Needs Review",
    action: "Request More Info",
    icon: "file"
  },
  {
    id: "missing-consent",
    label: "Missing Consent",
    helper: "Require release or consent evidence before reuse.",
    status: "Missing Consent",
    action: "Request More Info",
    icon: "alert"
  },
  {
    id: "restrict",
    label: "Restrict",
    helper: "Limit or block usage of this asset.",
    status: "Restricted",
    action: "Do Not Use",
    tone: "restrict",
    icon: "alert"
  }
];
