"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Clock3, FolderInput, UploadCloud } from "lucide-react";
import { useDemoRole } from "@/components/RoleProvider";
import { canUpload } from "@/lib/permissions";

const largeCopy =
  "This file is larger than the normal web upload limit. Upload it to the approved Shared Drive Incoming folder and notify the DAM admin. It will still be tracked in TJC Stock Media after import.";

export function UploadPage() {
  const { role } = useDemoRole();
  const [message, setMessage] = useState("");
  const [largeWarning, setLargeWarning] = useState("");
  const allowed = canUpload(role);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    form.set("role", role);
    const response = await fetch("/api/upload", { method: "POST", body: form });
    const body = await response.json();
    setMessage(body.message || body.error || "Upload intake checked.");
  }

  function checkFiles(files: FileList | null) {
    const hasLarge = Array.from(files || []).some((file) => file.size > 100 * 1024 * 1024);
    setLargeWarning(hasLarge ? largeCopy : "");
  }

  return (
    <div className="page-shell page-shell--narrow">
      <section className="form-intro">
        <p className="eyebrow">Contributor intake</p>
        <h1>Upload for review</h1>
        <p>Uploads enter Needs Review / Do Not Publish. Reviewers approve before public or internal use.</p>
      </section>

      <section className="intake-steps" aria-label="Upload workflow">
        <div>
          <UploadCloud size={18} aria-hidden="true" />
          <strong>Submit context</strong>
          <span>Event, ministry, people/minor risk, notes.</span>
        </div>
        <div>
          <Clock3 size={18} aria-hidden="true" />
          <strong>Needs Review</strong>
          <span>Nothing becomes usable automatically.</span>
        </div>
        <div>
          <CheckCircle2 size={18} aria-hidden="true" />
          <strong>Approved copy</strong>
          <span>Users download only approved use copies.</span>
        </div>
      </section>

      {!allowed ? (
        <div className="empty-state">This role can search approved media but cannot upload. Switch to Contributor, Reviewer, or DAM Admin for intake demo.</div>
      ) : (
        <form className="intake-form" onSubmit={submit}>
          <section className="intake-section">
            <div className="intake-section__title">
              <span>1</span>
              <div>
                <h2>Context</h2>
                <p>Help reviewers understand where this media came from.</p>
              </div>
            </div>
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
              Minors visible
              <select name="minorsVisible" defaultValue="Unknown">
                <option>Unknown</option>
                <option>No</option>
                <option>Yes</option>
              </select>
            </label>
            </div>
            <label>
              Usage notes/restrictions
              <textarea name="notes" placeholder="Known permissions, event context, internal-only notes..." rows={4} />
            </label>
            <label>
              Suggested tags
              <input name="tags" placeholder="Bible, fellowship, welcome, youth..." />
            </label>
          </section>

          <section className="intake-section">
            <div className="intake-section__title">
              <span>3</span>
              <div>
                <h2>Files</h2>
                <p>Submissions enter Needs Review / Do Not Publish.</p>
              </div>
            </div>
            <label>
              Files
              <input name="files" type="file" multiple onChange={(event) => checkFiles(event.currentTarget.files)} />
            </label>
            {largeWarning ? <div className="large-warning">{largeWarning}</div> : null}
            <div className="large-media-card">
              <FolderInput size={18} aria-hidden="true" />
              <div>
                <strong>Large media intake</strong>
                <span>Video/audio over 100 MB goes to Shared Drive Incoming, then DAM admin imports it into ResourceSpace.</span>
              </div>
            </div>
          </section>

          <button className="primary-action" type="submit">
            <UploadCloud size={16} aria-hidden="true" />
            Submit intake
          </button>
          {message ? <div className="form-message">{message}</div> : null}
        </form>
      )}
    </div>
  );
}
