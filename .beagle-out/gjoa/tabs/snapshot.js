import { CLOSED_MEMORY } from './constants.js';
import { equivV as $$bc$equiv } from 'beagle/core.js';

export function build_envelope_bang(snapshot) {
  const tab_space_map = new Map();
  if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? snapshot.spaces.tabSpaces : _logical))(snapshot.spaces))) {
    snapshot.spaces.tabSpaces.forEach((_pct1) => tab_space_map.set(_pct1[0], _pct1[1]));
  }
  const tabEntries = snapshot.tabs.map((_pct1) => { const d = snapshot.treeData(_pct1);
const sp = tab_space_map.get(d.id);
return {id: d.id, parentId: d.parentId, url: snapshot.tabUrl(_pct1), name: d.name, state: d.state, collapsed: d.collapsed, spaceId: sp}; });
  const groupEntries = [];
  const lastSeen = {id: null};
  Array.from(snapshot.rows()).forEach((_pct1) => { if (((_truthy) => _truthy !== false && _truthy != null)(_pct1._tab)) {
  return (lastSeen.id = snapshot.treeData(_pct1._tab).id);
} else {
  if (((_truthy) => _truthy !== false && _truthy != null)(_pct1._group)) {
    return groupEntries.push({id: 0, parentId: null, type: "group", name: _pct1._group.name, level: _pct1._group.level, state: _pct1._group.state, collapsed: _pct1._group.collapsed, spaceId: _pct1._group.spaceId, afterTabId: lastSeen.id});
  }
} });
  const liveUrls = new Set(tabEntries.map((_pct1) => _pct1.url).filter(Boolean));
  const leftovers = snapshot.savedTabQueue.filter((_pct1) => ((!((_truthy) => _truthy !== false && _truthy != null)(_pct1.url)) || (!((_truthy) => _truthy !== false && _truthy != null)(liveUrls.has(_pct1.url))))).map((_pct1) => Object.assign({}, _pct1));
  const out = tabEntries.concat(groupEntries, leftovers);
  return {nodes: out, closedTabs: snapshot.closedTabs.slice((0 - CLOSED_MEMORY)), nextTabId: snapshot.nextTabId, spaces: snapshot.spaces};
}

function do_save_bang(flags, getSnapshot, history, onErr) {
  if (((_truthy) => _truthy !== false && _truthy != null)(flags.inFlight)) {
    return (flags.pending = true);
  } else {
    (flags.inFlight = true);
    return history.appendEvent(build_envelope_bang(getSnapshot())).catch((_pct1) => onErr(_pct1)).then(() => { (flags.inFlight = false);
if (((_truthy) => _truthy !== false && _truthy != null)(flags.pending)) {
  (flags.pending = false);
  return do_save_bang(flags, getSnapshot, history, onErr);
} });
  }
}

export function make_saver_bang(getSnapshot, history, onError) {
  const fallback = (_pct1) => console.error("gjoa-tabs: save chain", _pct1);
  const onErr = ((_logical) => (_logical !== false && _logical != null ? _logical : fallback))(onError);
  const flags = {inFlight: false, pending: false};
  return () => do_save_bang(flags, getSnapshot, history, onErr);
}

export function pop_saved_by_url(queue, url) {
  if (((_truthy) => _truthy !== false && _truthy != null)(url)) {
    const i = queue.findIndex((_pct1) => ($$bc$equiv(_pct1.url, url)));
    if ((i >= 0)) {
      return queue.splice(i, 1)[0];
    }
  }
}

export function pop_saved_by_index(queue, idx) {
  if ((idx >= 0)) {
    const i = queue.findIndex((_pct1) => ($$bc$equiv(_pct1._origIdx, idx)));
    if ((i >= 0)) {
      return queue.splice(i, 1)[0];
    }
  }
}

export function pop_saved_for_tab(queue, ctx) {
  const currentIdx = ctx.currentIdx;
  const pinnedId = ctx.pinnedId;
  const url = ctx.url;
  const inSessionRestore = ctx.inSessionRestore;
  const log = ctx.log;
  const try_url_fifo = () => { if (((_truthy) => _truthy !== false && _truthy != null)(((_logical) => (_logical !== false && _logical != null ? (!($$bc$equiv(url, "about:blank"))) : _logical))(url))) {
  const node = pop_saved_by_url(queue, url);
  if (((_truthy) => _truthy !== false && _truthy != null)(log)) {
    log("popSavedForTab:url", {idx: currentIdx, url: url, found: ((_truthy) => _truthy !== false && _truthy != null)(node)});
  }
  return node;
} else {
  if (inSessionRestore) {
    const node = (((_truthy) => _truthy !== false && _truthy != null)(queue.length) ? (() => { return queue.shift(); })() : null);
    if (((_truthy) => _truthy !== false && _truthy != null)(log)) {
      log("popSavedForTab:fifo", {idx: currentIdx, pfxId: pinnedId, url: url, nodeId: ((_logical) => (_logical !== false && _logical != null ? node.id : _logical))(node), nodeOrigIdx: ((_logical) => (_logical !== false && _logical != null ? node._origIdx : _logical))(node)});
    }
    return node;
  }
} };
  if (((_truthy) => _truthy !== false && _truthy != null)(pinnedId)) {
    const i = queue.findIndex((_pct1) => ($$bc$equiv(_pct1.id, pinnedId)));
    if ((i >= 0)) {
      if (((_truthy) => _truthy !== false && _truthy != null)(log)) {
        log("popSavedForTab:pfxId", {idx: currentIdx, pfxId: pinnedId, url: url});
      }
      return queue.splice(i, 1)[0];
    } else {
      return try_url_fifo();
    }
  } else {
    return try_url_fifo();
  }
}
