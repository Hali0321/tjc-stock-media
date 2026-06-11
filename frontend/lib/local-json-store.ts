import fs from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type LocalJsonStoreOptions<TRecord> = {
  filePath: () => string;
  maxRecords: number;
  normalize: (input: unknown) => TRecord | null;
  order: (records: TRecord[]) => TRecord[];
  memoryStore?: () => TRecord[];
  localFileEnabled?: () => boolean;
};

function localFilesEnabled<TRecord>(options: LocalJsonStoreOptions<TRecord>) {
  return options.localFileEnabled ? options.localFileEnabled() : true;
}

function normalizeWindow<TRecord>(records: unknown[], options: LocalJsonStoreOptions<TRecord>) {
  return options.order(records.map(options.normalize).filter(Boolean) as TRecord[]).slice(0, options.maxRecords);
}

function memoryWindow<TRecord>(options: LocalJsonStoreOptions<TRecord>) {
  return options.memoryStore ? normalizeWindow(options.memoryStore(), options) : [];
}

function replaceMemory<TRecord>(records: TRecord[], options: LocalJsonStoreOptions<TRecord>) {
  const store = options.memoryStore?.();
  if (!store) return false;
  store.splice(0, store.length, ...normalizeWindow(records, options));
  return true;
}

export async function readLocalJsonStore<TRecord>(options: LocalJsonStoreOptions<TRecord>) {
  if (!localFilesEnabled(options)) return memoryWindow(options);
  try {
    const raw = await readFile(options.filePath(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? normalizeWindow(parsed, options) : [];
  } catch {
    return memoryWindow(options);
  }
}

export async function writeLocalJsonStore<TRecord>(records: TRecord[], options: LocalJsonStoreOptions<TRecord>) {
  const windowed = normalizeWindow(records, options);
  if (!localFilesEnabled(options)) {
    replaceMemory(windowed, options);
    return;
  }
  const filePath = options.filePath();
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(windowed, null, 2)}\n`);
  } catch (error) {
    if (!replaceMemory(windowed, options)) throw error;
  }
}

export function readLocalJsonStoreSync<TRecord>(options: LocalJsonStoreOptions<TRecord>) {
  if (!localFilesEnabled(options)) return memoryWindow(options);
  try {
    const parsed = JSON.parse(fs.readFileSync(options.filePath(), "utf8")) as unknown;
    return Array.isArray(parsed) ? normalizeWindow(parsed, options) : [];
  } catch {
    return memoryWindow(options);
  }
}
