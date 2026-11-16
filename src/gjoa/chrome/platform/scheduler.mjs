// Microtask-batched reconcile scheduler. Callers mark a domain dirty with a
// reason; once per microtask every dirty domain's reconcilers run, in
// DOMAIN_ORDER, with the reasons collected since the last run. Marks made
// during a run schedule another run. flush() resolves once nothing is pending.

import { create_logger_bang } from "../tabs/log.mjs";

export const DOMAIN_ORDER = ["prefs", "windows", "tabs", "snapshots", "sidebar", "command"];

export function make_scheduler_bang() {
  const log = create_logger_bang("scheduler");
  const reconcilers = new Map(); // domain -> [{domain, run(reasons)}]
  const pending = new Map(); // domain -> [reason]
  let pendingFlush = null;
  let lastReconcileMs = null;
  let destroyed = false;

  function runOnce() {
    if (destroyed) return;
    const startedAt = performance.now();
    const snapshot = new Map(pending);
    pending.clear();
    for (const domain of DOMAIN_ORDER) {
      const reasons = snapshot.get(domain);
      if (!reasons || reasons.length === 0) continue;
      for (const r of reconcilers.get(domain) ?? []) {
        try {
          r.run(reasons);
        } catch (e) {
          log("reconciler:error", { domain, reasons, msg: String(e) });
        }
      }
    }
    lastReconcileMs = performance.now() - startedAt;
    log("reconcile:done", { ms: lastReconcileMs });
  }

  function schedule() {
    if (pendingFlush || destroyed) return;
    pendingFlush = new Promise((resolve) => {
      queueMicrotask(() => {
        try {
          runOnce();
        } finally {
          const moreWork = [...pending.values()].some((reasons) => reasons.length > 0);
          pendingFlush = null;
          if (moreWork) schedule();
          resolve();
        }
      });
    });
  }

  function register(reconciler) {
    if (!reconcilers.has(reconciler.domain)) reconcilers.set(reconciler.domain, []);
    reconcilers.get(reconciler.domain).push(reconciler);
    log("register", { domain: reconciler.domain });
    return () => {
      const arr = reconcilers.get(reconciler.domain);
      const i = arr ? arr.indexOf(reconciler) : -1;
      if (i >= 0) arr.splice(i, 1);
    };
  }

  function markDirty(domain, reason) {
    if (destroyed) return;
    if (!pending.has(domain)) pending.set(domain, []);
    pending.get(domain).push(reason);
    schedule();
  }

  function flush() {
    if (!pendingFlush) return Promise.resolve();
    return pendingFlush.then(() => (pendingFlush ? flush() : undefined));
  }

  function diag() {
    const out = {};
    for (const domain of DOMAIN_ORDER) out[domain] = pending.get(domain) ?? [];
    return { pending: out, nextFlushPending: pendingFlush != null, lastReconcileMs };
  }

  function destroy() {
    destroyed = true;
    pending.clear();
    reconcilers.clear();
  }

  return { register, markDirty, flush, diag, destroy };
}
