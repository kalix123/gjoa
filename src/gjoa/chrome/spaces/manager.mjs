import { is_in_active_space } from './visibility.mjs';
import { SPACE_ATTR } from '../tabs/constants.mjs';

import { equiv, truthy } from "../lib/value.mjs";
export const DEFAULT_NAME = "Main";

export function new_space_id() {
  return crypto.randomUUID();
}

export function make_spaces_bang(deps) {
  const on_change = deps.onChange;
  const on_activated = deps.onActivated;
  const tab_by_id = deps.tabById;
  const spaces = new Map();
  const tab_space = new WeakMap();
  const state = {active_id: null, applying: false};
  const default_space = {id: new_space_id(), name: DEFAULT_NAME, createdAt: Date.now()};
  spaces.set(default_space.id, default_space);
  (state.active_id = default_space.id);
  const list_in_order = () => Array.from(spaces.values());
  const default_id = () => list_in_order()[0].id;
  return {list: list_in_order, activeId: () => state.active_id, get: (_pct1) => spaces.get(_pct1), active: () => spaces.get(state.active_id), spaceOf: (tab) => { const cached = tab_space.get(tab);
if (truthy(((_logical) => (_logical !== false && _logical != null ? spaces.has(cached) : _logical))(cached))) {
  return cached;
} else {
  const persisted = (() => { try {
    return tab.getAttribute(SPACE_ATTR);
  } catch (__e) {
    return null;
  } })();
  if (truthy(((_logical) => (_logical !== false && _logical != null ? spaces.has(persisted) : _logical))(persisted))) {
    tab_space.set(tab, persisted);
    return persisted;
  } else {
    return default_id();
  }
} }, create: (name, icon) => { const s = {id: new_space_id(), name: ((_logical) => (_logical !== false && _logical != null ? _logical : "Untitled"))(name), createdAt: Date.now()};
if (truthy(icon)) {
  (s.icon = icon);
}
spaces.set(s.id, s);
on_change();
return s; }, rename: (id, name) => { const s = spaces.get(id);
if (truthy(s)) {
  if ((!(equiv(s.name, name)))) {
    (s.name = name);
    spaces.set(id, s);
    return on_change();
  }
} }, setIcon: (id, icon) => { const s = spaces.get(id);
if (truthy(s)) {
  if (truthy(icon)) {
    (s.icon = icon);
  } else {
    delete s.icon;
  }
  spaces.set(id, s);
  return on_change();
} }, delete: (id) => { const def = default_id();
if (((!(equiv(id, def))) && spaces.has(id))) {
  spaces.delete(id);
  const reactivated = (equiv(state.active_id, id));
  if (reactivated) {
    (state.active_id = def);
  }
  on_change();
  if (truthy(reactivated && on_activated)) {
    return on_activated(id, def);
  }
} }, setActive: (id) => { if (truthy(((_logical) => (_logical !== false && _logical != null ? (!(equiv(state.active_id, id))) : _logical))(spaces.has(id)))) {
  const prev = state.active_id;
  (state.active_id = id);
  on_change();
  if (truthy(on_activated)) {
    return on_activated(prev, id);
  }
} }, assignTab: (tab, id) => { if ((spaces.has(id))) {
  const prev = tab_space.get(tab);
  if ((!(equiv(prev, id)))) {
    tab_space.set(tab, id);
    (() => { try {
    return tab.setAttribute(SPACE_ATTR, id);
  } catch (__e) {
    return null;
  } })();
    return on_change();
  }
} }, isVisible: (_pct1) => is_in_active_space(_pct1, tab_space, spaces, default_id(), state.active_id), isSpaceActive: (_pct1) => { const effective = (truthy(((_logical) => (_logical !== false && _logical != null ? spaces.has(_pct1) : _logical))(_pct1)) ? _pct1 : default_id());
return (equiv(effective, state.active_id)); }, hydrate: (snapshot, tabById) => { spaces.clear();
snapshot.spaces.forEach((_pct1) => spaces.set(_pct1.id, _pct1));
if (((spaces.size === 0))) {
  spaces.set(default_space.id, default_space);
  (state.active_id = default_space.id);
} else {
  (state.active_id = ((spaces.has(snapshot.activeId)) ? snapshot.activeId : default_id()));
}
snapshot.tabSpaces.forEach((entry) => { const tab_id = entry[0];
const space_id = entry[1];
if ((spaces.has(space_id))) {
  const tab = tabById(tab_id);
  if (truthy(tab)) {
    return tab_space.set(tab, space_id);
  }
} });
return on_change(); }, isApplying: () => state.applying, applyRemoteSpaces: (snapshot) => { (state.applying = true);
(() => { try {
    spaces.clear();
  snapshot.spaces.forEach((_pct1) => spaces.set(_pct1.id, _pct1));
  if (((spaces.size === 0))) {
    spaces.set(default_space.id, default_space);
  }
  if ((!(spaces.has(state.active_id)))) {
    (state.active_id = default_id());
  }
  if (truthy(tab_by_id)) {
    snapshot.tabSpaces.forEach((entry) => { const tab_id = entry[0];
const space_id = entry[1];
if ((spaces.has(space_id))) {
  const tab = tab_by_id(tab_id);
  if (truthy(tab)) {
    return tab_space.set(tab, space_id);
  }
} });
  }
  return on_change();
  } catch (e) {
    return console.error("[Gjoa.spaces.applyRemoteSpaces] failed", e);
  } })();
return (state.applying = false); }};
}
