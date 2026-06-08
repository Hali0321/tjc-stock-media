"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock3, FileCheck2, FolderInput, RotateCcw, Save, ShieldCheck, UploadCloud } from "lucide-react";
import { TagInput } from "@/components/InputWithTags";
import { useDemoRole } from "@/components/RoleProvider";
import { StateBanner } from "@/components/StatusBanner";
import { UploadDropzone } from "@/components/UploadFileDropzone";
import { UploadIntakePacket } from "@/components/UploadIntakePacket";
import { canUpload } from "@/lib/permissions";
import { toastDraftSaved, toastUploadComplete, toastUploadFailed, toastUploadStarted } from "@/lib/tjc-toasts";
import { parseUploadTags, uploadTagSuggestions } from "@/lib/upload-tags";
import { cn } from "@/lib/ui";
import { LARGE_MEDIA_BYTES, uploadDefaultState } from "@/lib/workflow-policy";

type UploadReceipt = {
  status?: string;
  defaultReviewState?: string;
  message?: string;
  eventName?: string;
  fileCount?: number;
  sourceLink?: string | null;
  reviewWarnings?: string[];
};

const inputClass = "min-h-10 w-full min-w-0 rounded-xl border border-tjc-line bg-white px-3 text-sm font-medium text-tjc-ink placeholder:text-[#858f87]";
const labelClass = "grid gap-2 text-sm font-semibold text-tjc-ink";
const requiredHint = <span className="text-xs font-semibold text-[#7a5a19]">Required</span>;
const uploadMobileSteps = [
  { title: "Context", detail: "Title, event, date, ministry, source." },
  { title: "People and rights", detail: "Visibility, youth, rights, restrictions." },
  { title: "Files or source", detail: "File, source link, tags, notes." },
  { title: "Review and submit", detail: "Packet summary and safety check." }
] as const;

export function UploadPage() {
  const { role, ready } = useDemoRole();
  const [message, setMessage] = useState("");
  const [largeWarning, setLargeWarning] = useState("");
  const [receipt, setReceipt] = useState<UploadReceipt | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sourceLink, setSourceLink] = useState("");
  const [suggestedTags, setSuggestedTags] = useState("");
  const [intakeNotes, setIntakeNotes] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const [mobileStep, setMobileStep] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceLinkRef = useRef<HTMLInputElement>(null);
  const intakeNotesRef = useRef<HTMLTextAreaElement>(null);
  const filesSectionRef = useRef<HTMLElement>(null);
  const receiptRef = useRef<HTMLElement>(null);
  const allowed = ready && canUpload(role);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const hasValidSourceLink = useMemo(() => {
    const value = sourceLink.trim();
    if (!value) return false;
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  }, [sourceLink]);
  const hasFileOrSource = selectedFiles.length > 0 || hasValidSourceLink;
  const tagCount = parseUploadTags(suggestedTags).length;
  const hasSuggestedTags = tagCount > 0;
  const hasIntakeNotes = intakeNotes.trim().length > 0;
  const submitReady = hasFileOrSource && hasSuggestedTags && hasIntakeNotes;
  const submitReadiness = [
    { label: "File or source", complete: hasFileOrSource, detail: hasFileOrSource ? selectedFiles.length ? `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} selected` : "Source link captured" : "Add a file or source link" },
    { label: "Suggested tags", complete: hasSuggestedTags, detail: hasSuggestedTags ? `${tagCount} tag${tagCount === 1 ? "" : "s"} added` : "Add at least one tag" },
    { label: "Intake notes", complete: hasIntakeNotes, detail: hasIntakeNotes ? "Reviewer note captured" : "Tell reviewer what to check" },
    { label: "Review visibility", complete: true, detail: "Blocked by default" }
  ];
  const submitHelp = submitReady
    ? "Ready for reviewer intake. This still does not approve or publish media."
    : !hasFileOrSource
      ? "Add a file or source link before submitting."
      : !hasSuggestedTags
        ? "Add suggested tags before submitting."
        : "Add intake notes before submitting.";

  function findUploadStepIssue(stepIndex: number) {
    const container = formRef.current?.querySelector<HTMLElement>(`[data-upload-step="${stepIndex}"]`);
    const missingControl = Array.from(container?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input[required], select[required], textarea[required]") || [])
      .find((control) => !control.disabled && !String(control.value || "").trim());
    if (missingControl) {
      return { step: stepIndex, control: missingControl, message: `Complete ${uploadMobileSteps[stepIndex].title} before continuing.` };
    }
    if (stepIndex === 2 && sourceLink.trim() && !hasValidSourceLink) {
      return { step: stepIndex, control: sourceLinkRef.current || undefined, message: "Use a full http or https source link." };
    }
    if (stepIndex === 2 && !hasFileOrSource) {
      return { step: stepIndex, control: sourceLinkRef.current || undefined, message: "Add a file or source link before continuing." };
    }
    if (stepIndex === 2 && !suggestedTags.trim()) {
      return { step: stepIndex, message: "Add at least one suggested tag before continuing." };
    }
    if (stepIndex === 2 && !intakeNotes.trim()) {
      return { step: stepIndex, control: intakeNotesRef.current || undefined, message: "Add intake notes before continuing." };
    }
    return null;
  }

  function showUploadStepIssue(issue: ReturnType<typeof findUploadStepIssue>) {
    if (!issue) return;
    setMobileStep(issue.step);
    setMessage(issue.message);
    window.setTimeout(() => {
      issue.control?.focus({ preventScroll: true });
      issue.control?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 0);
  }

  function continueMobileStep() {
    const issue = findUploadStepIssue(mobileStep);
    if (issue) {
      showUploadStepIssue(issue);
      return;
    }
    setMessage("");
    setMobileStep((current) => Math.min(uploadMobileSteps.length - 1, current + 1));
  }

  function focusFileOrSource() {
    setMessage("Add a file or source link before submitting.");
    const target = sourceLinkRef.current || document.querySelector<HTMLInputElement>('input[name="sourceLink"]');
    if (target) {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "center", behavior: "smooth" });
      window.setTimeout(() => target.focus({ preventScroll: true }), 150);
      return;
    }
    filesSectionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function focusSubmitIssue() {
    if (!hasFileOrSource) {
      focusFileOrSource();
      return;
    }
    if (!hasSuggestedTags) {
      setMessage("Add suggested tags before submitting.");
      filesSectionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
    if (!hasIntakeNotes) {
      setMessage("Add intake notes before submitting.");
      intakeNotesRef.current?.focus({ preventScroll: true });
      intakeNotesRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setReceipt(null);
    const firstIssue = [0, 1, 2].map((step) => findUploadStepIssue(step)).find(Boolean) || null;
    if (firstIssue) {
      showUploadStepIssue(firstIssue);
      return;
    }
    if (!submitReady) {
      focusSubmitIssue();
      return;
    }
    const form = new FormData(event.currentTarget);
    form.delete("files");
    selectedFiles.forEach((file) => form.append("files", file));
    form.set("role", role);
    toastUploadStarted(selectedFiles.length ? `${selectedFiles.length} file(s) staged for review.` : "Source-link intake will be reviewed without a browser file.");
    const response = await fetch("/api/upload", { method: "POST", body: form });
    const body = await response.json();
    setMessage(body.message || body.error || "Upload intake checked.");
    if (response.ok) {
      setReceipt(body);
      setTimeout(() => receiptRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 0);
      toastUploadComplete({ label: "View summary", onClick: () => receiptRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }) });
    } else {
      toastUploadFailed(body.error || "No files were approved or published.");
    }
  }

  function checkFiles(files: FileList | null) {
    const nextFiles = Array.from(files || []);
    setSelectedFiles(nextFiles);
    const hasLarge = nextFiles.some((file) => file.size > LARGE_MEDIA_BYTES);
    setLargeWarning(hasLarge ? uploadDefaultState.largeMediaMessage : "");
    if (nextFiles.length) toastUploadStarted(`${nextFiles.length} selected file${nextFiles.length === 1 ? "" : "s"} staged for review.`);
  }

  function syncFileInput(nextFiles: File[]) {
    if (fileInputRef.current && typeof DataTransfer !== "undefined") {
      try {
        const transfer = new DataTransfer();
        nextFiles.forEach((file) => transfer.items.add(file));
        fileInputRef.current.files = transfer.files;
      } catch {
        fileInputRef.current.value = "";
      }
    }
    setSelectedFiles(nextFiles);
    const hasLarge = nextFiles.some((file) => file.size > LARGE_MEDIA_BYTES);
    setLargeWarning(hasLarge ? uploadDefaultState.largeMediaMessage : "");
  }

  function addDroppedFiles(files: File[]) {
    syncFileInput([...selectedFiles, ...files]);
    toastUploadStarted(`${files.length} dropped file${files.length === 1 ? "" : "s"} added to reviewer intake.`);
  }

  function removeFile(index: number) {
    const file = selectedFiles[index];
    syncFileInput(selectedFiles.filter((_, fileIndex) => fileIndex !== index));
    toastDraftSaved(`${file?.name || "File"} removed from intake.`);
  }

  function clearFiles() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSelectedFiles([]);
    setLargeWarning("");
    if (selectedFiles.length) toastDraftSaved("Selected files cleared.");
  }

  function saveDraftNotice() {
    setMessage("Draft capture is local-only in this demo. Files still need Submit for DAM review before server intake.");
    setDraftSaved(true);
    toastDraftSaved("Draft capture is local-only in this demo. Submit for DAM review before server intake.");
  }

  if (!ready) {
    return <div className="px-3 py-5 md:px-5"><div className="skeleton h-[70dvh] rounded-lg" /></div>;
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-5xl px-3 py-5 md:px-5">
        <section className="min-w-0 dam-card p-5">
          <span className="text-sm font-semibold text-tjc-evergreen">Contributor intake</span>
          <h1 className="mt-2 dam-page-title">Intake is for Contributors</h1>
          <p className="mt-2 max-w-[64ch] text-base leading-relaxed text-tjc-muted">Contributors provide context, people and rights information, files, tags, and notes. New media starts blocked until reviewer approval.</p>
        </section>
        <section className="mt-4 grid grid-cols-[auto_1fr] gap-4 dam-card p-5">
          <UploadCloud size={30} strokeWidth={1.8} aria-hidden="true" className="text-tjc-evergreen" />
          <div>
            <h2 className="text-xl font-semibold">Contribution flow</h2>
            <p className="mt-1 text-tjc-muted">Context first, then people and rights, then files and tags. Reviewers approve before anyone can reuse media.</p>
            <span className="mt-3 block rounded-md bg-[#eef7f1] px-3 py-2 text-sm font-semibold text-tjc-evergreen">Use role switch to Contributor, Reviewer, or DAM Admin to open intake.</span>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dam-shell max-w-[1600px]">
      <section className="grid gap-5 border-b border-[#d6dfd8] pb-5 lg:grid-cols-[minmax(0,1fr)_38rem]">
        <div>
          <span className="text-sm font-black text-tjc-evergreen">Contributor intake</span>
          <h1 className="mt-2 dam-page-title">Intake session</h1>
          <p className="mt-2 max-w-[64ch] text-base font-semibold leading-relaxed text-tjc-muted">Create a reviewer packet. This does not publish media or write final ResourceSpace metadata.</p>
        </div>
        <div className="grid gap-2 border-t border-[#d6dfd8] pt-4 sm:grid-cols-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0" aria-label="Upload workflow">
          {[
            { icon: UploadCloud, title: "Context", body: "Event, date, ministry, source." },
            { icon: ShieldCheck, title: "People and rights", body: "Visibility, consent, restrictions." },
            { icon: FileCheck2, title: "Files and tags", body: "Stage files, tag, and submit packet." }
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div className="border-l border-[#d6dfd8] pl-3" key={step.title}>
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" className="text-tjc-evergreen" />
                <strong className="mt-2 block font-black text-tjc-ink">{step.title}</strong>
                <span className="mt-1 block text-sm font-semibold text-tjc-muted">{step.body}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <StateBanner tone="info" title="Autosave checkpoint">
          Context, rights, files, and tags are reviewed together. Submitted media stays Needs Review / Do Not Publish until reviewer evidence is complete.
        </StateBanner>
        <div className="grid content-center rounded-[1.35rem] border border-[#d7e1d9] bg-white px-4 py-3 text-sm shadow-[0_10px_28px_rgba(25,34,29,.035)]">
          <strong className="text-tjc-ink">{selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"} selected</strong>
          <span className="text-xs font-semibold text-tjc-muted">Review visibility: blocked by default</span>
        </div>
      </div>

      <section className="mt-4 rounded-[1.25rem] border border-[#d6dfd8] bg-white p-3 md:hidden" aria-label="Upload steps">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-black text-tjc-evergreen" data-testid="upload-stepper-current-step">Step {mobileStep + 1} of {uploadMobileSteps.length}</span>
            <h2 className="mt-1 text-xl font-black leading-tight text-tjc-ink">{uploadMobileSteps[mobileStep].title}</h2>
            <p className="mt-1 text-sm font-semibold leading-snug text-tjc-muted">{uploadMobileSteps[mobileStep].detail}</p>
          </div>
          <span className="rounded-full border border-[#d6dfd8] bg-[#f8fbf8] px-3 py-1 text-xs font-black tabular-nums text-tjc-evergreen">{mobileStep + 1}/{uploadMobileSteps.length}</span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1" aria-hidden="true">
          {uploadMobileSteps.map((step, index) => (
            <span className={cn("h-1.5 rounded-full", index <= mobileStep ? "bg-tjc-evergreen" : "bg-[#dbe4dd]")} key={step.title} />
          ))}
        </div>
      </section>

      <form ref={formRef} className="upload-intake-layout mt-4 grid gap-3" onSubmit={submit} noValidate>
        <section data-upload-step="0" className={cn("upload-context-card dam-soft-card min-w-0 self-start p-4", mobileStep !== 0 && "max-md:hidden")}>
          <div className="mb-4">
            <h2 className="text-lg font-black">1. Context</h2>
            <p className="text-sm font-semibold text-tjc-muted">Help reviewers understand where this media came from.</p>
          </div>
          <label className={labelClass}>
            <span className="flex items-center justify-between gap-2">Title {requiredHint}</span>
            <input className={inputClass} name="title" placeholder="Bible study fellowship photos" required />
          </label>
          <label className={`${labelClass} mt-4`}>
            <span className="flex items-center justify-between gap-2">Event name {requiredHint}</span>
            <input className={inputClass} name="eventName" placeholder="MVP worship workshop" required />
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className="flex items-center justify-between gap-2">Event date {requiredHint}</span>
              <input className={inputClass} name="eventDate" type="date" defaultValue={today} required />
            </label>
            <label className={labelClass}>
              <span className="flex items-center justify-between gap-2">Ministry/team {requiredHint}</span>
              <input className={inputClass} name="ministry" placeholder="Internet Ministry" required />
            </label>
          </div>
          <label className={`${labelClass} mt-4`}>
            <span className="flex items-center justify-between gap-2">Source / photographer {requiredHint}</span>
            <input className={inputClass} name="source" placeholder="lm.photo@tjc.org, volunteer name, or Shared Drive folder" required />
          </label>
        </section>

        <section data-upload-step="1" className={cn("upload-people-card dam-soft-card min-w-0 self-start p-4", mobileStep !== 1 && "max-md:hidden")}>
          <div className="mb-4">
            <h2 className="text-lg font-black">2. People and rights</h2>
            <p className="text-sm font-semibold text-tjc-muted">Anything uncertain stays blocked until reviewed.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className="flex items-center justify-between gap-2">People visible {requiredHint}</span>
              <select className={inputClass} name="peopleVisible" defaultValue="Unknown" required>
                <option>Unknown</option>
                <option>No</option>
                <option>Yes</option>
              </select>
            </label>
            <label className={labelClass}>
              <span className="flex items-center justify-between gap-2">Children/youth visible {requiredHint}</span>
              <select className={inputClass} name="minorsVisible" defaultValue="Unknown" required>
                <option>Unknown</option>
                <option>No</option>
                <option>Yes</option>
              </select>
            </label>
          </div>
          <label className={`${labelClass} mt-4`}>
            <span className="flex items-center justify-between gap-2">Usage rights {requiredHint}</span>
            <select className={inputClass} name="usageRights" defaultValue="Unknown - needs review" required>
              <option>Unknown - needs review</option>
              <option>TJC-owned / permission confirmed</option>
              <option>Internal ministry use only</option>
              <option>Do not publish externally</option>
            </select>
          </label>
          <label className={`${labelClass} mt-4`}>
            Suggested approval direction
            <select className={inputClass} name="approvalSuggestion" defaultValue="Reviewer decides">
              <option>Reviewer decides</option>
              <option>Likely church-wide use</option>
              <option>Likely internal ministry use only</option>
              <option>Archive only</option>
              <option>Do not publish externally</option>
            </select>
          </label>
          <label className={`${labelClass} mt-4`}>
            <span className="flex items-center justify-between gap-2">Consent/restrictions {requiredHint}</span>
            <textarea className="min-h-28 w-full min-w-0 rounded-lg border border-tjc-line bg-white p-3 font-medium text-tjc-ink placeholder:text-[#858f87]" name="notes" placeholder="Known permissions, event context, internal-only notes..." rows={4} required />
          </label>
        </section>

        <section data-upload-step="2" ref={filesSectionRef} className={cn("upload-files-card dam-soft-card min-w-0 scroll-mt-24 self-start p-4 xl:sticky xl:top-24", mobileStep !== 2 && "max-md:hidden")} data-testid="upload-desktop-submission-rail">
          <div className="mb-4">
          <h2 className="text-lg font-black">3. Files and tags</h2>
            <p className="text-sm font-semibold text-tjc-muted">Submissions enter {uploadDefaultState.status}.</p>
          </div>
          {!hasFileOrSource ? (
            <div className="mb-3 rounded-xl border border-[#ead6a8] bg-[#fff8e8] p-3 text-sm font-black leading-snug text-[#725216]" role="status">
              Required before submit: add a file or paste a Google Drive / ResourceSpace link.
            </div>
          ) : null}
          <UploadDropzone
            inputRef={fileInputRef}
            selectedFiles={selectedFiles}
            onInputFiles={checkFiles}
            onDropFiles={addDroppedFiles}
            onRemove={removeFile}
            onClear={clearFiles}
          />
          <label className={`${labelClass} mt-4`}>
            Existing Google / ResourceSpace link
            <input ref={sourceLinkRef} className={inputClass} name="sourceLink" placeholder="https://drive.google.com/... or ResourceSpace ref" value={sourceLink} onChange={(event) => setSourceLink(event.target.value)} />
            {sourceLink.trim() && !hasValidSourceLink ? <span className="text-xs font-semibold text-[#7a5a19]">Use a full http or https source link.</span> : null}
          </label>
          <div className="mt-4">
              <TagInput
              name="tags"
              label="Suggested tags"
              value={suggestedTags}
              onChange={setSuggestedTags}
              required
              placeholder="Bible, fellowship, welcome, youth..."
              suggestions={uploadTagSuggestions}
              helperText="Use existing visible-content or TJC terms. Press Enter or comma to add; Backspace removes the last chip when the field is empty. Reviewers approve final taxonomy before ResourceSpace updates."
            />
          </div>
          <label className={`${labelClass} mt-4`}>
            <span className="flex items-center justify-between gap-2">Intake notes {requiredHint}</span>
            <textarea ref={intakeNotesRef} className="min-h-24 w-full min-w-0 rounded-lg border border-tjc-line bg-white p-3 font-medium text-tjc-ink placeholder:text-[#858f87]" name="intakeNotes" placeholder="Anything the reviewer should know before approval..." rows={3} required value={intakeNotes} onChange={(event) => setIntakeNotes(event.target.value)} />
          </label>
          {largeWarning ? <div className="sr-only" role="status">{largeWarning}</div> : null}
          <section className="mt-4 rounded-2xl border border-[#d6dfd8] bg-[#fbfcfa] p-3" aria-label="Submission readiness" data-testid="upload-desktop-readiness-checklist">
            <div className="flex items-start justify-between gap-3">
              <div>
                <strong className="block text-sm font-black text-tjc-ink">Ready to send?</strong>
                <span className="mt-1 block text-xs font-semibold leading-snug text-tjc-muted">Media stays blocked until a reviewer approves reuse.</span>
              </div>
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-black", submitReady ? "bg-[#e8f6ee] text-tjc-evergreen" : "bg-[#fff8e8] text-[#725216]")}>
                {submitReadiness.filter((item) => item.complete).length}/{submitReadiness.length}
              </span>
            </div>
            <div className="mt-3 grid gap-2">
              {submitReadiness.map((item) => (
                <div className="grid grid-cols-[auto_1fr] gap-2 rounded-xl border border-[#e1e8e2] bg-white px-3 py-2 text-xs" key={item.label}>
                  {item.complete ? <CheckCircle2 size={15} strokeWidth={1.9} aria-hidden="true" className="mt-0.5 text-tjc-evergreen" /> : <Clock3 size={15} strokeWidth={1.9} aria-hidden="true" className="mt-0.5 text-[#9a6a10]" />}
                  <span>
                    <strong className="block font-black text-tjc-ink">{item.label}</strong>
                    <span className="mt-0.5 block font-semibold leading-snug text-tjc-muted">{item.detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="mt-4 hidden gap-3 rounded-2xl border border-[#cbd8cf] bg-white p-3 shadow-[0_12px_28px_rgba(25,34,29,.045)] md:grid" aria-label="Desktop upload actions" data-testid="upload-desktop-actions-rail">
            <div>
              <strong className="text-sm font-black text-tjc-ink">Submit for DAM review</strong>
              <span className="mt-1 block text-xs font-semibold leading-snug text-tjc-muted">{submitHelp}</span>
              {draftSaved ? <span className="mt-2 block text-xs font-black text-tjc-evergreen" data-testid="upload-draft-local-state">Draft saved locally</span> : null}
            </div>
            <div className="grid gap-2">
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-tjc-line bg-white px-4 text-sm font-black text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px" type="button" onClick={saveDraftNotice}>
                <Save size={15} strokeWidth={1.8} aria-hidden="true" />
                Save draft
              </button>
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-tjc-line bg-white px-4 text-sm font-black text-[#6b4c11] transition hover:bg-[#fff8e8] active:translate-y-px" type="button" onClick={() => {
                clearFiles();
                setSuggestedTags("");
                setSourceLink("");
                setIntakeNotes("");
                setMessage("File selection, source link, suggested tags, and intake notes cleared.");
                toastDraftSaved("File selection, source link, suggested tags, and intake notes cleared.");
              }}>
                <RotateCcw size={15} strokeWidth={1.8} aria-hidden="true" />
                Clear all
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 dam-button-primary px-5 text-base font-black transition active:translate-y-px disabled:cursor-not-allowed disabled:!border-[#c5d1c9] disabled:!bg-[#edf1ed] disabled:!text-[#69746d] disabled:!shadow-none"
                type="submit"
                aria-label="Submit intake"
                disabled={!submitReady}
              >
                <UploadCloud size={16} strokeWidth={1.8} aria-hidden="true" />
                Submit for DAM review
              </button>
            </div>
          </section>
          <div className="mt-4 grid grid-cols-[auto_1fr] gap-3 rounded-2xl border border-[#c9d6ce] bg-[#f6faf7] p-3">
            <FolderInput size={18} strokeWidth={1.8} aria-hidden="true" className="text-tjc-evergreen" />
            <div>
              <strong className="block font-semibold">Large media intake</strong>
              <span className="mt-1 block text-sm leading-snug text-tjc-muted">{uploadDefaultState.largeMediaMessage}</span>
            </div>
          </div>
          <div className="mt-4 rounded-md border border-[#cbd8e4] bg-[#f2f7fb] p-3 text-sm leading-snug text-[#52677a]">
            AI tag suggestions may help later, but a person still reviews titles, tags, people visibility, and rights before publishing.
          </div>
        </section>

        <div data-upload-step="3" className={cn("upload-packet-card min-w-0", mobileStep !== 3 && "max-md:hidden")}>
          <UploadIntakePacket selectedFiles={selectedFiles} suggestedTags={suggestedTags} hasSourceLink={hasValidSourceLink} largeWarning={largeWarning} />
        </div>

        <section className="upload-actions-card sticky bottom-3 z-20 grid gap-3 rounded-[1.45rem] border border-[#cbd8cf] bg-white/94 p-3 shadow-[0_18px_42px_rgba(25,34,29,.09)] backdrop-blur md:hidden" aria-label="Upload actions" data-component="UploadMobileActionBar" data-testid="upload-mobile-action-bar">
          <div className="grid content-center">
            <strong className="text-sm font-black text-tjc-ink">Submit for DAM review</strong>
            <span className="text-xs font-semibold text-tjc-muted">{submitHelp}</span>
            {draftSaved ? <span className="mt-1 text-xs font-black text-tjc-evergreen" data-testid="upload-draft-local-state">Draft saved locally</span> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-tjc-line bg-white px-4 text-sm font-black text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px" type="button" onClick={saveDraftNotice}>
              <Save size={15} strokeWidth={1.8} aria-hidden="true" />
              Save draft
            </button>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-tjc-line bg-white px-4 text-sm font-black text-[#6b4c11] transition hover:bg-[#fff8e8] active:translate-y-px" type="button" onClick={() => {
              clearFiles();
              setSuggestedTags("");
              setSourceLink("");
              setIntakeNotes("");
              setMessage("File selection, source link, suggested tags, and intake notes cleared.");
              toastDraftSaved("File selection, source link, suggested tags, and intake notes cleared.");
            }}>
              <RotateCcw size={15} strokeWidth={1.8} aria-hidden="true" />
              Clear all
            </button>
            {mobileStep > 0 ? (
              <button className="inline-flex min-h-11 items-center justify-center rounded-full border border-tjc-line bg-white px-4 text-sm font-black text-tjc-evergreen transition hover:bg-[#eef7f1] active:translate-y-px md:hidden" type="button" onClick={() => setMobileStep((current) => Math.max(0, current - 1))}>
                Back
              </button>
            ) : null}
            {mobileStep < uploadMobileSteps.length - 1 ? (
              <button className="inline-flex min-h-11 items-center justify-center rounded-full bg-tjc-evergreen px-5 text-sm font-black text-white transition hover:bg-[#0d4a37] active:translate-y-px md:hidden" type="button" onClick={continueMobileStep}>
                Next
              </button>
            ) : null}
            <button
              className={cn(
                "inline-flex min-h-11 min-w-[12rem] items-center justify-center gap-2 dam-button-primary px-5 text-base font-black transition active:translate-y-px",
                mobileStep < uploadMobileSteps.length - 1 && "max-md:hidden",
                !submitReady && "cursor-not-allowed !border-[#c5d1c9] !bg-[#edf1ed] !text-[#69746d] !shadow-none hover:!bg-[#edf1ed]"
              )}
              type={submitReady ? "submit" : "button"}
              aria-label="Submit intake"
              aria-disabled={!submitReady}
              onClick={!submitReady ? focusSubmitIssue : undefined}
            >
              <UploadCloud size={16} strokeWidth={1.8} aria-hidden="true" />
              Submit for DAM review
            </button>
          </div>
        </section>
        {message ? <div className="upload-message-card rounded-xl border border-tjc-line bg-white p-4 text-sm font-semibold text-tjc-evergreen">{message}</div> : null}

        {receipt ? (
          <section ref={receiptRef} className="upload-receipt-card grid gap-4 rounded-md border border-[#b9d9c6] bg-[#eef8f2] p-5 text-[#24583d] sm:grid-cols-[auto_1fr_auto]" aria-label="Final submission summary" data-component="UploadFinalSubmissionSummary">
            <CheckCircle2 size={22} strokeWidth={1.8} aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold">Intake received</h2>
              <p className="mt-1 text-sm font-semibold">This media is blocked until a reviewer approves reuse.</p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-4">
                <div><dt className="text-xs font-semibold">Status</dt><dd>{receipt.defaultReviewState || uploadDefaultState.status}</dd></div>
                <div><dt className="text-xs font-semibold">Event</dt><dd>{receipt.eventName || "Not provided"}</dd></div>
                <div><dt className="text-xs font-semibold">Files</dt><dd>{receipt.fileCount ?? 0}</dd></div>
                <div><dt className="text-xs font-semibold">Source link</dt><dd>{receipt.sourceLink ? "Captured" : "Not provided"}</dd></div>
              </dl>
              <p className="mt-3 text-sm">Persistence mode: server-routed demo/export intake. ResourceSpace API write mapping must be configured for production writes.</p>
              {receipt.reviewWarnings?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {receipt.reviewWarnings.map((warning) => (
                    <span className="rounded-md border border-[#ead6a8] bg-[#fff8e8] px-2.5 py-1 text-xs font-semibold text-[#725216]" key={warning}>{warning}</span>
                  ))}
                </div>
              ) : null}
            </div>
            <Clock3 size={20} strokeWidth={1.8} aria-hidden="true" />
          </section>
        ) : null}
      </form>
    </div>
  );
}
