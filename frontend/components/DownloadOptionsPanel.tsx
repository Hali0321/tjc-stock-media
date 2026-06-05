"use client";

import { Download, FileLock2, Mail, Square, View, Image as ImageIcon } from "lucide-react";
import type { DemoRole, StockMediaAsset } from "@/lib/types";
import { downloadState } from "@/lib/presentation";

export function DownloadOptionsPanel({ asset, role }: { asset: StockMediaAsset; role: DemoRole }) {
  const state = downloadState(asset, role);
  const downloadHref = `/api/download/${asset.id}?role=${encodeURIComponent(role)}`;
  const options = [
    { label: "Web image", detail: "Good for website articles and newsletters.", icon: ImageIcon, available: state.approvedCopy.allowed },
    { label: "Slide / presentation", detail: "Use current approved copy; dedicated slide derivative can be configured.", icon: View, available: false },
    { label: "Social square", detail: "Square derivative not configured yet.", icon: Square, available: false }
  ];

  return (
    <section className="download-options-panel" aria-label="Download approved copy">
      <div className="panel-heading">
        <div>
          <h2>Download approved copy</h2>
          <p>{state.panelLabel}</p>
        </div>
      </div>
      <div className="download-option-grid">
        {options.map((option, index) => {
          const Icon = option.icon;
          return option.available ? (
            <a key={option.label} className="download-option download-option--available" href={downloadHref}>
              <Icon size={18} aria-hidden="true" />
              <span>
                <strong>{option.label}</strong>
                <small>{option.detail}</small>
              </span>
              <Download size={16} aria-hidden="true" />
            </a>
          ) : (
            <button key={option.label} className="download-option" type="button" disabled>
              <Icon size={18} aria-hidden="true" />
              <span>
                <strong>{option.label}</strong>
                <small>{index === 0 ? state.panelLabel : option.detail}</small>
              </span>
              <FileLock2 size={16} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <div className="restricted-original-row">
        <FileLock2 size={18} aria-hidden="true" />
        <div>
          <strong>Original/master restricted</strong>
          <span>Master files stay in ResourceSpace and Google Shared Drive. Normal users receive approved copies only.</span>
        </div>
      </div>
      <div className="download-panel-actions">
        <a className="secondary-action secondary-action--quiet" href={`mailto:media@tjc.org?subject=Original access request for ${encodeURIComponent(asset.title)}`}>
          <Mail size={16} aria-hidden="true" />
          Request original access
        </a>
        <a className="secondary-action secondary-action--quiet" href="mailto:media@tjc.org?subject=TJC Stock Media asset question">
          <Mail size={16} aria-hidden="true" />
          Ask a media coworker
        </a>
      </div>
    </section>
  );
}
