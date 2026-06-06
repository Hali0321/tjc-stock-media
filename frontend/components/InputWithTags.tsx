"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
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
  const errorId = `${id}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const tags = useMemo(() => uniqueTags(parseTags(value)), [value]);
  const canonicalSuggestions = useMemo(() => uniqueTags(suggestions), [suggestions]);
  const canonicalLookup = useMemo(() => new Map(canonicalSuggestions.map((suggestion) => [suggestion.toLowerCase(), suggestion])), [canonicalSuggestions]);
  const normalizedSuggestions = useMemo(
    () => canonicalSuggestions.filter((suggestion) => !tags.some((tag) => tag.toLowerCase() === suggestion.toLowerCase())).slice(0, 10),
    [canonicalSuggestions, tags]
  );
  const serialized = tags.join(", ");

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const message = required && !tags.length ? "Choose at least one suggested taxonomy term." : "";
    input.setCustomValidity(message);
  }, [required, tags.length]);

  function commitTags(nextTags: string[]) {
    onChange(uniqueTags(nextTags).join(", "));
    setError("");
  }

  function addTags(rawValue: string) {
    const parsed = parseTags(rawValue);
    if (!parsed.length) return;
    const accepted = parsed.map((tag) => canonicalLookup.get(tag.toLowerCase())).filter((tag): tag is string => Boolean(tag));
    const rejected = parsed.filter((tag) => !canonicalLookup.has(tag.toLowerCase()));
    if (accepted.length) commitTags([...tags, ...accepted]);
    if (rejected.length) {
      setError(`${rejected.join(", ")} ${rejected.length === 1 ? "is" : "are"} not in the current taxonomy. Add new wording to intake notes for reviewer consideration.`);
      setDraft(rejected.join(", "));
      return;
    }
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
            <span className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-md border border-[#c9d9d0] bg-[#eef7f1] px-2 text-xs font-semibold text-tjc-evergreen sm:min-h-8" key={tag}>
              <span className="truncate">{tag}</span>
              <button className="grid h-11 w-11 shrink-0 place-items-center rounded text-tjc-evergreen hover:bg-white sm:h-6 sm:w-6" type="button" onClick={() => removeTag(index)} aria-label={`Remove ${tag}`}>
                <X size={13} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            id={id}
            className="min-h-11 min-w-[11rem] flex-1 bg-transparent px-1 text-sm font-medium text-tjc-ink placeholder:text-[#858f87] focus:outline-none sm:min-h-8"
            value={draft}
            onBlur={() => addTags(draft)}
            onChange={(event) => {
              setDraft(event.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            onInvalid={() => setError("Choose at least one suggested taxonomy term.")}
            placeholder={tags.length ? "Add another tag..." : placeholder}
            aria-required={required || undefined}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={`${helperId} ${errorId}`}
          />
        </div>
      </div>
      {normalizedSuggestions.length ? (
        <div className="flex flex-wrap gap-1.5" aria-label={`${label} suggestions`}>
          {normalizedSuggestions.map((suggestion) => (
            <button
              className="min-h-11 rounded-md border border-tjc-line bg-[#fbfcfa] px-3 text-xs font-semibold text-[#4d554d] transition hover:bg-[#eef7f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f4f45] sm:min-h-8 sm:px-2"
              type="button"
              key={suggestion}
              onClick={() => {
                commitTags([...tags, suggestion]);
                setDraft("");
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      <p className="text-xs leading-relaxed text-tjc-muted" id={helperId}>
        {helperText || "Use existing ministry taxonomy terms where possible. Press Enter or comma to add a tag."}
      </p>
      <p className={cn("text-xs font-semibold leading-relaxed text-[#8b391f]", !error && "sr-only")} id={errorId} role="status">
        {error || "No tag validation errors."}
      </p>
    </div>
  );
}
