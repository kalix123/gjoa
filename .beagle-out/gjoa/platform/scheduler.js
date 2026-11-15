import { create_logger_bang } from '../tabs/log.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

export const DOMAIN_ORDER = ["prefs", "windows", "tabs", "snapshots", "sidebar", "command"];

export function make_scheduler_bang() {
  const log = create_logger_bang("scheduler");
  const reconcilers = new Map();
  const pending = new Map();
  const state = {pendingFlush: null, pendingResolve: null, lastReconcileMs: null, destroyed: false};
  return (() => { function get_dirty(domain) { return ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { const fresh = []; pending.set(domain, fresh);
return fresh; })()))(pending.get(domain)); } function run_once() { if ((!((_truthy) => _truthy !== false && _truthy != null)(state.destroyed))) {
  const started_at = performance.now();
  const snapshot = (() => { const snap = new Map(); pending.forEach((reasons, domain) => snap.set(domain, reasons));
return snap; })();
  pending.clear();
  DOMAIN_ORDER.forEach((domain) => { const reasons = snapshot.get(domain);
if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(reasons.length, 0))) : _logical))(reasons))) {
  const handlers = ((_logical) => (_logical !== false && _logical != null ? _logical : []))(reconcilers.get(domain));
  return handlers.forEach((_pct1) => (() => { try {
    return _pct1.run(reasons);
  } catch (e) {
    return log("reconciler:error", {domain: domain, reasons: reasons, msg: String(e)});
  } })());
} });
  (state.lastReconcileMs = (performance.now() - started_at));
  return log("reconcile:done", {ms: state.lastReconcileMs});
} } function schedule() { if ((!((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? _logical : state.destroyed))(state.pendingFlush)))) {
  return (state.pendingFlush = new Promise((resolve) => { (state.pendingResolve = resolve);
return queueMicrotask(() => (() => { try {
    return run_once();
  }  finally {
    const co = {v: false};
    pending.forEach((_pct1) => { if ((_pct1.length > 0)) {
  return (co.v = true);
} });
    (state.pendingFlush = null);
    const local_resolve = state.pendingResolve;
    (state.pendingResolve = null);
    if (((_truthy) => _truthy !== false && _truthy != null)(co.v)) {
      schedule();
    }
    if (((_truthy) => _truthy !== false && _truthy != null)(local_resolve)) {
      local_resolve();
    }
  } })()); }));
} } function register(reconciler) { const list = ((_logical) => (_logical !== false && _logical != null ? _logical : (() => { const fresh = []; reconcilers.set(reconciler.domain, fresh);
return fresh; })()))(reconcilers.get(reconciler.domain));
list.push(reconciler);
log("register", {domain: reconciler.domain});
return () => { const arr = reconcilers.get(reconciler.domain);
if (((_truthy) => _truthy !== false && _truthy != null)(arr)) {
  const i = arr.indexOf(reconciler);
  if ((i >= 0)) {
    return arr.splice(i, 1);
  }
} }; } function mark_dirty(domain, reason) { if ((!((_truthy) => _truthy !== false && _truthy != null)(state.destroyed))) {
  get_dirty(domain).push(reason);
  return schedule();
} } function flush_bang() { return ((!((_truthy) => _truthy !== false && _truthy != null)(state.pendingFlush)) ? Promise.resolve(undefined) : state.pendingFlush.then(() => { if (((_truthy) => _truthy !== false && _truthy != null)(state.pendingFlush)) {
  return flush_bang();
} })); } function diag() { const out = DOMAIN_ORDER.reduce((acc, domain) => ({...acc, [domain]: ((_logical) => (_logical !== false && _logical != null ? _logical : []))(pending.get(domain))}), {});
return {pending: out, nextFlushPending: (!($$bc$equiv(state.pendingFlush, null))), lastReconcileMs: state.lastReconcileMs}; } function destroy() { (state.destroyed = true);
pending.clear();
return reconcilers.clear(); } return {register: register, markDirty: mark_dirty, flush: flush_bang, diag: diag, destroy: destroy}; })();
}
