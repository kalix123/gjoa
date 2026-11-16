// gjoa GenAI/ML feature prefs — default branch.
// Shipped as DEFAULTS by appending this file
// onto the branding pref file (firefox-branding.js) by scripts/prepare.mjs
// — the same channel as perf-prefs / adblock-prefs / dark-mode-prefs.
//
//
// Mozilla's "Link Preview" (browser/components/genai/LinkPreview.sys.mjs) is an
// AI/ML feature: long-press or right-click a link → it generates an on-device
// summary (reading time, key points). On gjoa it surfaces a broken
// "can't preview this link" overlay (the model/fetch backend is unavailable)
// and is an AI/egress surface gjoa does not enable by default. Disable it at
// the single entry-point gate so no long-press trigger, no "Preview Link"
// context-menu item, and no onboarding callout appear. (LinkPreview.init reads
// lazy.enabled before wiring any listener, and shouldShowContextMenu checks it.)

// The master gate — false disables every Link Preview entry point.
pref("browser.ml.linkPreview.enabled", false);
// Belt: explicitly disable the click-and-hold trigger too, so a future default
// flip of one pref can't silently re-arm the long-press.
pref("browser.ml.linkPreview.longPress", false);
