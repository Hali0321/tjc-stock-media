"use client";

import { useState } from "react";
import { Copy, ExternalLink, Link as LinkIcon } from "lucide-react";
import { DropdownActionMenu, type DropdownAction } from "@/components/DropdownActionMenu";
import type { StockMediaAsset } from "@/lib/types";

type AssetActionsMenuProps = {
  asset: StockMediaAsset;
  resourceSpaceUrl: string | null;
  canOpenResourceSpace: boolean;
};

export function AssetActionsMenu({ asset, resourceSpaceUrl, canOpenResourceSpace }: AssetActionsMenuProps) {
  const [status, setStatus] = useState("");
  const resourceSpaceId = asset.resourceSpaceId || asset.id;

  async function copyText(value: string, label: string) {
    if (!navigator.clipboard?.writeText) {
      setStatus("Copy unavailable in this browser.");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setStatus(`${label} copied.`);
    } catch {
      setStatus(`${label} could not be copied.`);
    }
  }

  const actions: DropdownAction[] = [
    {
      id: "copy-resource-id",
      label: "Copy ResourceSpace ID",
      detail: resourceSpaceId,
      icon: <Copy size={15} strokeWidth={1.8} aria-hidden="true" />,
      onSelect: () => copyText(resourceSpaceId, "ResourceSpace ID")
    },
    {
      id: "copy-portal-link",
      label: "Copy portal link",
      detail: "Local portal asset URL",
      icon: <LinkIcon size={15} strokeWidth={1.8} aria-hidden="true" />,
      onSelect: () => copyText(window.location.href, "Portal link")
    }
  ];

  if (resourceSpaceUrl && canOpenResourceSpace) {
    actions.push({
      id: "open-resourcespace",
      label: "Open in ResourceSpace",
      detail: "DAM Admin source-of-truth view",
      icon: <ExternalLink size={15} strokeWidth={1.8} aria-hidden="true" />,
      href: resourceSpaceUrl,
      external: true
    });
  }

  return <DropdownActionMenu label="Asset actions" actions={actions} status={status} />;
}
