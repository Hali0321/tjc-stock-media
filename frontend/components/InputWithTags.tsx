"use client";

import { useId, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/ui";

type InputWithTagsProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  helperText?: string;
};

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function uniqueTags(tags: string[]) {
  const seen = new Set<string>();
  return tags.filter((tag) => {
    const key = tag.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function InputWithTags({ name, label, value, onChange, suggestions, placeholder, required, helperText }: InputWithTagsProps) {
  const id = useId();
  const helperId = `${id}-helper`;
  const [draft, setDraft] = useState("");
  const tags = useMemo(() => uniqueTags(parseTags(value)), [value]);
  const normalizedSuggestions = useMemo(
    () => uniqueTags(suggestions).filter((suggestion) => !tags.some((tag) => tag.toLowerCase() === suggestion.toLowerCase())).slice(0, 10),
    [suggestions, tags]
  );
  const serialized = uniqueTags([...tags, ...parseTags(draft)]).join(", ");

  function commitTags(nextTags: string[]) {
    onChange(uniqueTags(nextTags).join(", "));
  }

  function addTags(rawValue: string) {
    const next = parseTags(rawValue);
    if (!next.length) return;
    commitTags([...tags, ...next]);
    setDraft("");
  }

  function removeTag(index: number) {
    commitTags(tags.filter((_, tagIndex) => tagIndex !== index));
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTags(draft);
    } else if (event.key === "Backspace" && !draft && tags.length) {
      removeTag(tags.length - 1);
    }
  }

  return (
    <div className="grid gap-2 text-sm font-semibold text-tjc-ink">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id}>{label}</label>
        {required ? <span className="text-xs font-semibold text-[#7a5a19]">Required</span> : null}
      </div>
      <input type="hidden" name={name} value={serialized} />
      <div
        className={cn(
          "min-w-0 rounded-md border border-tjc-line bg-white p-2 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#0f4f45]",
          !serialized && "border-[#ead6a8]"
        )}
      >
        <div className="flex min-h-10 flex-wrap items-center gap-1.5">
          {tags.map((tag, index) => (
            <span className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-md border border-[#c9d9d0] bg-[#eef7f1] px-2 text-xs font-semibold text-tjc-evergreen" key={tag}>
              <span className="truncate">{tag}</span>
              <button className="grid h-6 w-6 shrink-0 place-items-center rounded text-tjc-evergreen hover:bg-white" type="button" onClick={() => removeTag(index)} aria-label={`Remove ${tag}`}>
                <X size={13} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </span>
          ))}
          <input
            id={id}
            className="min-h-8 min-w-[11rem] flex-1 bg-transparent px-1 text-sm font-medium text-tjc-ink placeholder:text-[#858f87] focus:outline-none"
            value={draft}
            onBlur={() => addTags(draft)}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length ? "Add another tag..." : placeholder}
            aria-describedby={helperId}
          />
        </div>
      </div>
      {normalizedSuggestions.length ? (
        <div className="flex flex-wrap gap-1.5" aria-label={`${label} suggestions`}>
          {normalizedSuggestions.map((suggestion) => (
            <button
              className="min-h-8 rounded-md border border-tjc-line bg-[#fbfcfa] px-2 text-xs font-semibold text-[#4d554d] transition hover:bg-[#eef7f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f4f45]"
              type="button"
              key={suggestion}
              onClick={() => commitTags([...tags, suggestion])}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      <p className="text-xs leading-relaxed text-tjc-muted" id={helperId}>
        {helperText || "Use existing ministry taxonomy terms where possible. Press Enter or comma to add a tag."}
      </p>
    </div>
  );
}
