
import { truthy } from "../lib/value.mjs";
const FALLBACK_TRANSITION_MS = 250;

export const COLLAPSE_PROTECTION_MARGIN_MS = 30;

export function transition_duration_ms() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--gjoa-transition-duration").trim();
  return (((raw.endsWith("ms"))) ? (() => { const v = parseFloat(raw); return (truthy(((_logical) => (_logical !== false && _logical != null ? (v > 0) : _logical))(Number.isFinite(v))) ? v : FALLBACK_TRANSITION_MS); })() : ((raw.endsWith("s"))) ? (() => { const f = parseFloat(raw); const v = (f * 1000); return (truthy(((_logical) => (_logical !== false && _logical != null ? (v > 0) : _logical))(Number.isFinite(v))) ? v : FALLBACK_TRANSITION_MS); })() : FALLBACK_TRANSITION_MS);
}

export function collapse_protection_duration_ms() {
  return (transition_duration_ms() + COLLAPSE_PROTECTION_MARGIN_MS);
}
