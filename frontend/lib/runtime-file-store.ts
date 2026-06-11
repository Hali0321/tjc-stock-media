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
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, contents, "utf8");
  fs.renameSync(tmpPath, filePath);
}

export function writeRuntimeJsonFile(filePath: string, record: unknown) {
  ensureRuntimeDir(path.dirname(filePath));
  writeRuntimeFileAtomically(filePath, `${JSON.stringify(record, null, 2)}\n`);
}

export function listRuntimeFiles(dir: string, extension: string) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(extension))
    .map((file) => path.join(dir, file));
}

export function appendRuntimeJsonLine(filePath: string, record: unknown) {
  ensureRuntimeDir(path.dirname(filePath));
  fs.appendFileSync(filePath, `${JSON.stringify(record)}\n`, "utf8");
}

export function readRuntimeJsonLines<TRecord>(filePath: string, normalize: (input: unknown) => TRecord | null) {
  try {
    return fs
      .readFileSync(filePath, "utf8")
      .split("\n")
      .filter(Boolean)
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
