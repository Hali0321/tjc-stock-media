import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function ensureRuntimeDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readRuntimeJsonFile<TRecord>(filePath: string, normalize: (input: unknown) => TRecord | null) {
  try {
    return normalize(JSON.parse(fs.readFileSync(filePath, "utf8")));
  } catch {
    return null;
  }
}

function writeRuntimeFileAtomically(filePath: string, contents: string) {
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.${randomUUID().slice(0, 8)}.tmp`;
  try {
    fs.writeFileSync(tmpPath, contents, "utf8");
    fs.renameSync(tmpPath, filePath);
  } catch (error) {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // Best-effort temp cleanup; preserve original write failure.
    }
    throw error;
  }
}

export function writeRuntimeJsonFile(filePath: string, record: unknown) {
  ensureRuntimeDir(path.dirname(filePath));
  writeRuntimeFileAtomically(filePath, `${JSON.stringify(record, null, 2)}\n`);
}

export type RuntimeFileListOptions = {
  maxFilesFromEnd?: number;
};

function fileWindow(files: string[], options?: RuntimeFileListOptions) {
  const maxFiles = Math.trunc(options?.maxFilesFromEnd || 0);
  return maxFiles > 0 ? [...files].sort().slice(-maxFiles) : files;
}

export function listRuntimeFiles(dir: string, extension: string, options?: RuntimeFileListOptions) {
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(extension));
  return fileWindow(files, options)
    .map((file) => path.join(dir, file));
}

export function appendRuntimeJsonLine(filePath: string, record: unknown) {
  ensureRuntimeDir(path.dirname(filePath));
  fs.appendFileSync(filePath, `${JSON.stringify(record)}\n`, "utf8");
}

export type RuntimeJsonLinesOptions = {
  maxLinesFromEnd?: number;
};

function lineWindow(lines: string[], options?: RuntimeJsonLinesOptions) {
  const maxLines = Math.trunc(options?.maxLinesFromEnd || 0);
  return maxLines > 0 ? lines.slice(-maxLines) : lines;
}

export function readRuntimeJsonLines<TRecord>(
  filePath: string,
  normalize: (input: unknown) => TRecord | null,
  options?: RuntimeJsonLinesOptions
) {
  try {
    const lines = fs
      .readFileSync(filePath, "utf8")
      .split("\n")
      .filter(Boolean);
    return lineWindow(lines, options)
      .map((line) => {
        try {
          return normalize(JSON.parse(line));
        } catch {
          return null;
        }
      })
      .filter((record): record is TRecord => Boolean(record));
  } catch {
    return [];
  }
}
