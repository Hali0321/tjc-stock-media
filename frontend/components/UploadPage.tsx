"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Clock3, FileCheck2, FolderInput, ShieldCheck, UploadCloud } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { canUpload } from "@/lib/permissions";
import { LARGE_MEDIA_BYTES, uploadDefaultState } from "@/lib/workflow-policy";

type UploadReceipt = {
  status?: string;
  defaultReviewState?: string;
  message?: string;
  eventName?: string;
  fileCount?: number;
};

export function UploadPage() {
  const { role } = useDemoRole();
  const [message, setMessage] = useState("");
  const [largeWarning, setLargeWarning] = useState("");
  const [receipt, setReceipt] = useState<UploadReceipt | null>(null);
  const allowed = canUpload(role);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setReceipt(null);
    const form = new FormData(event.currentTarget);
    form.set("role", role);
    const response = await fetch("/api/upload", { method: "POST", body: form });
    const body = await response.json();
    setMessage(body.message || body.error || "Upload intake checked.");
    if (response.ok) setReceipt(body);
  }

  function checkFiles(files: FileList | null) {
    const hasLarge = Array.from(files || []).some((file) => file.size > LARGE_MEDIA_BYTES);
    setLargeWarning(hasLarge ? uploadDefaultState.largeMediaMessage : "");
  }

  if (!allowed) {
    return (
      <div className="page-shell page-shell--workflow">
        <section className="library-top">
          <div>
            <p className="eyebrow">Upload</p>
            <h1>Upload is available to contributors</h1>
            <p>Contributors provide context, people/rights information, files, tags, and notes. New media starts blocked until reviewer approval.</p>
          </div>
        </section>
        <section className="role-locked-workflow">
          <UploadCloud size={30} aria-hidden="true" />
          <div>
            <h2>Contribution flow</h2>
            <p>Context first, then people and rights, then files and tags. Reviewers approve before anyone can reuse the media.</p>
            <span>Use role switch to Contributor, Reviewer, or DAM Admin to open intake.</span>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell page-shell--workflow">
      <div className="upload-hero upload-hero--dam">
        <section className="form-intro">
          <p className="eyebrow">Contributor intake</p>
          <h1>Upload for review</h1>
          <p>{uploadDefaultState.message}</p>
        </section>

        <section className="intake-steps intake-steps--dam" aria-label="Upload workflow">
          <div>
            <UploadCloud size={18} aria-hidden="true" />
            <strong>Context</strong>
            <span>Event, date, ministry, source.</span>
          </div>
          <div>
            <ShieldCheck size={18} aria-hidden="true" />
            <strong>People and rights</strong>
            <span>Visibility, consent, restrictions.</span>
          </div>
          <div>
            <FileCheck2 size={18} aria-hidden="true" />
            <strong>Files and tags</strong>
            <span>Upload, tag, receive review state.</span>
          </div>
        </section>
      </div>

      <form className="intake-form intake-form--dam" onSubmit={submit}>
        <section className="intake-section">
          <div className="intake-section__title">
            <span>1</span>
            <div>
              <h2>Context</h2>
              <p>Help reviewers understand where this media came from.</p>
            </div>
          </div>
          <label>
            Title
            <input name="title" placeholder="Bible study fellowship photos" required />
          </label>
          <label>
            Event name
            <input name="eventName" placeholder="MVP worship workshop" required />
          </label>
          <div className="form-grid">
            <label>
              Event date
              <input name="eventDate" type="date" defaultValue={today} />
            </label>
            <label>
              Ministry/team
              <input name="ministry" placeholder="Internet Ministry" />
            </label>
          </div>
          <label>
            Source / photographer
            <input name="source" placeholder="lm.photo@tjc.org, volunteer name, or Shared Drive folder" required />
          </label>
        </section>

        <section className="intake-section">
          <div className="intake-section__title">
            <span>2</span>
            <div>
              <h2>People and rights</h2>
              <p>Anything uncertain stays blocked until reviewed.</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              People visible
              <select name="peopleVisible" defaultValue="Unknown">
                <option>Unknown</option>
                <option>No</option>
                <option>Yes</option>
              </select>
            </label>
            <label>
              Children/youth visible
              <select name="minorsVisible" defaultValue="Unknown">
                <option>Unknown</option>
                <option>No</option>
                <option>Yes</option>
              </select>
            </label>
          </div>
          <label>
            Usage rights
            <select name="usageRights" defaultValue="Unknown - needs review">
              <option>Unknown - needs review</option>
              <option>TJC-owned / permission confirmed</option>
              <option>Internal ministry use only</option>
              <option>Do not publish externally</option>
            </select>
          </label>
          <label>
            Suggested approval direction
            <select name="approvalSuggestion" defaultValue="Reviewer decides">
              <option>Reviewer decides</option>
              <option>Likely church-wide use</option>
              <option>Likely internal ministry use only</option>
              <option>Archive only</option>
              <option>Do not publish externally</option>
            </select>
          </label>
          <label>
            Consent/restrictions
            <textarea name="notes" placeholder="Known permissions, event context, internal-only notes..." rows={4} />
          </label>
        </section>

        <section className="intake-section intake-section--files">
          <div className="intake-section__title">
            <span>3</span>
            <div>
              <h2>Files and tags</h2>
              <p>Submissions enter {uploadDefaultState.status}.</p>
            </div>
          </div>
          <label>
            Files
            <input name="files" type="file" multiple onChange={(event) => checkFiles(event.currentTarget.files)} />
          </label>
          <label>
            Suggested tags
            <input name="tags" placeholder="Bible, fellowship, welcome, youth..." />
          </label>
          <label>
            Intake notes
            <textarea name="intakeNotes" placeholder="Anything the reviewer should know before approval..." rows={3} />
          </label>
          {largeWarning ? <div className="large-warning">{largeWarning}</div> : null}
          <div className="large-media-card">
            <FolderInput size={18} aria-hidden="true" />
            <div>
              <strong>Large media intake</strong>
              <span>{uploadDefaultState.largeMediaMessage}</span>
            </div>
          </div>
          <div className="ai-suggestion-note">
            AI tag suggestions may help later, but a person still reviews titles, tags, people visibility, and rights before publishing.
          </div>
        </section>

        <button className="primary-action" type="submit">
          <UploadCloud size={16} aria-hidden="true" />
          Submit intake
        </button>
        {message ? <div className="form-message">{message}</div> : null}

        {receipt ? (
          <section className="upload-receipt" aria-label="Upload receipt">
            <CheckCircle2 size={22} aria-hidden="true" />
            <div>
              <h2>Upload received</h2>
              <dl>
                <div><dt>Status</dt><dd>{receipt.defaultReviewState || uploadDefaultState.status}</dd></div>
                <div><dt>Event</dt><dd>{receipt.eventName || "Not provided"}</dd></div>
                <div><dt>Files</dt><dd>{receipt.fileCount ?? 0}</dd></div>
                <div><dt>Next step</dt><dd>Reviewer checks source, people, rights, and usage before reuse.</dd></div>
              </dl>
            </div>
            <Clock3 size={20} aria-hidden="true" />
          </section>
        ) : null}
      </form>
    </div>
  );
}
