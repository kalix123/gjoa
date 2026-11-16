// The chrome's transition duration comes from the --gjoa-transition-duration
// CSS variable ("250ms" or "0.25s"); anything unparsable falls back to 250ms.

const FALLBACK_TRANSITION_MS = 250;
export const COLLAPSE_PROTECTION_MARGIN_MS = 30;

export function transition_duration_ms() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--gjoa-transition-duration").trim();
  let v = NaN;
  if (raw.endsWith("ms")) v = parseFloat(raw);
  else if (raw.endsWith("s")) v = parseFloat(raw) * 1000;
  return Number.isFinite(v) && v > 0 ? v : FALLBACK_TRANSITION_MS;
}

export const collapse_protection_duration_ms = () => transition_duration_ms() + COLLAPSE_PROTECTION_MARGIN_MS;
