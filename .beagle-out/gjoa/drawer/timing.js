
const FALLBACK_TRANSITION_MS = 250;

export const COLLAPSE_PROTECTION_MARGIN_MS = 30;

export function transition_duration_ms() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--gjoa-transition-duration").trim();
  return ((((_truthy) => _truthy !== false && _truthy != null)(raw.endsWith("ms"))) ? (() => { const v = parseFloat(raw); return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (v > 0) : _logical))(Number.isFinite(v))) ? v : FALLBACK_TRANSITION_MS); })() : (((_truthy) => _truthy !== false && _truthy != null)(raw.endsWith("s"))) ? (() => { const f = parseFloat(raw); const v = (f * 1000); return (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (v > 0) : _logical))(Number.isFinite(v))) ? v : FALLBACK_TRANSITION_MS); })() : FALLBACK_TRANSITION_MS);
}

export function collapse_protection_duration_ms() {
  return (transition_duration_ms() + COLLAPSE_PROTECTION_MARGIN_MS);
}
