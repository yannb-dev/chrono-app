let onUnauthorisez: (() => void) | null = null;

export function setOnUnauthorized(cb: (() => void) | null) {
  onUnauthorisez = cb;
}

export function triggerUnauthorized() {
  onUnauthorisez?.();
}
