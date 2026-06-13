const privateSourceTextPattern = /source path|master drive|checksum|[a-f0-9]{32,}/i;

export function containsPrivateSourceText(value: string) {
  return privateSourceTextPattern.test(value);
}

export function containsUnsafePathText(value: string) {
  return value.includes("..") || /[\\/]/.test(value);
}

export function containsUnsafeRouteText(value: string) {
  return value.includes("..") || /[\\]/.test(value);
}

export function isSafeHttpUrl(value: string) {
  return /^https?:\/\//i.test(value) && !containsUnsafeRouteText(value) && !containsPrivateSourceText(value);
}
