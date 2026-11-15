
import { equiv, truthy } from "../lib/value.mjs";
function compute_filtered(all_items, query, preserve, filter_fn) {
  if (((query === ""))) {
    return all_items.slice();
  } else {
    const matched_set = new Set();
    all_items.forEach((_pct1) => { if (truthy(truthy(filter_fn) ? filter_fn(_pct1, query) : (() => { const hay = ("".concat(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(_pct1.display), " ", ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(_pct1.secondary))).toLowerCase(); return hay.includes(query); })())) {
  return matched_set.add(_pct1);
} });
    if ((!preserve)) {
      const qfirst = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(query.trim().toLowerCase().split(new RegExp("\\s+"))[0]);
      const title_rank = (it) => (truthy((!((qfirst === ""))) && ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(it.display).toLowerCase().includes(qfirst)) ? 0 : 1);
      return all_items.filter((_pct1) => matched_set.has(_pct1)).sort((a, b) => (title_rank(a) - title_rank(b)));
    } else {
      const by_id = new Map();
      all_items.forEach((_pct1) => { if (((!((_pct1.id == null))) && (!(equiv(_pct1.id, undefined))))) {
  return by_id.set(_pct1.id, _pct1);
} });
      const visible = new Set(matched_set);
      matched_set.forEach((_pct1) => (() => { let cur = _pct1; while (true) {
    if (truthy(((_logical) => (_logical !== false && _logical != null ? ((!((cur.parentId == null))) && (!(equiv(cur.parentId, undefined)))) : _logical))(cur))) {  const p = by_id.get(cur.parentId); if (truthy(((_logical) => (_logical !== false && _logical != null ? (!truthy(visible.has(p))) : _logical))(p))) { visible.add(p); const _recur_0 = p; cur = _recur_0; continue; } else { return null; } } else { return null; }
  } })());
      return all_items.filter((_pct1) => visible.has(_pct1));
    }
  }
}

function is_direct_match(item, query) {
  if (((query === ""))) {
    return true;
  } else {
    const hay = ("".concat(((_logical) => (_logical !== false && _logical != null ? _logical : ""))(item.display), " ", ((_logical) => (_logical !== false && _logical != null ? _logical : ""))(item.secondary))).toLowerCase();
    return hay.includes(query);
  }
}

function clear_children(el) {
  if (truthy(el.firstChild)) {
    el.firstChild.remove();
    return clear_children(el);
  }
}

export function make_picker_bang(deps) {
  const st = {pickerEl: null, pickerInput: null, pickerList: null, active: false, items: [], filtered: [], selectedIdx: 0, onSelect: null, actions: [], preserveTree: false, filterItem: null};
  const show_ref = {fn: null};
  const reset_st_bang = () => { (st.active = false);
(st.onSelect = null);
(st.actions = []);
(st.preserveTree = false);
if (truthy(st.pickerEl)) {
  return (st.pickerEl.hidden = true);
} };
  const dismiss = () => { if (truthy(st.active)) {
  reset_st_bang();
  return deps.restoreFocus();
} };
  const commit = () => { if (truthy(st.active)) {
  const item = st.filtered[st.selectedIdx];
  const cb = st.onSelect;
  const query = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____0 = st.pickerInput; return ((some_thread____0 == null) ? null : some_thread____0.value); })());
  reset_st_bang();
  if (truthy(((_logical) => (_logical !== false && _logical != null ? cb : _logical))(item))) {
    return cb(item, query);
  }
} };
  const render_list = () => { if (truthy(st.pickerList)) {
  clear_children(st.pickerList);
  if (((st.filtered.length === 0))) {
    const empty = (() => { const __e____scope__6__1__4__1__17__3__3__2__1__2__1__0 = document.createXULElement("label"); (__e____scope__6__1__4__1__17__3__3__2__1__2__1__0.className = "gjoa-picker-empty");
return __e____scope__6__1__4__1__17__3__3__2__1__2__1__0; })();
    empty.setAttribute("value", "(no matches)");
    return st.pickerList.appendChild(empty);
  } else {
    const query = ((_logical) => (_logical !== false && _logical != null ? _logical : ""))((() => { const some_thread____1 = st.pickerInput; if ((some_thread____1 == null)) {
  return null;
} else {
  const some_thread____2 = some_thread____1.value;
  if ((some_thread____2 == null)) {
    return null;
  } else {
    const some_thread____3 = some_thread____2.trim();
    return ((some_thread____3 == null) ? null : some_thread____3.toLowerCase());
  }
} })());
    st.filtered.forEach((item, idx) => { const row = (() => { const __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__1__2__1__0 = document.createXULElement("hbox"); (__e____scope__6__1__4__1__17__3__3__3__1__2__3__3__1__2__1__0.className = "gjoa-picker-row");
return __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__1__2__1__0; })();
if ((equiv(idx, st.selectedIdx))) {
  row.setAttribute("gjoa-picker-selected", "true");
}
if (truthy(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? (!is_direct_match(item, query)) : _logical))(query) : _logical))(st.preserveTree))) {
  row.setAttribute("gjoa-picker-context", "true");
}
const depth = item.depth;
if (truthy((typeof depth === 'number') && ((_logical) => (_logical !== false && _logical != null ? (!((depth === 0))) : _logical))(Number.isFinite(depth)))) {
  row.style.setProperty("padding-left", ("".concat((14 + (depth * 14.0)), "px")), "important");
}
if (truthy(item.icon)) {
  if ((new RegExp("^page-icon:|^data:|^chrome:|^moz-").test(item.icon))) {
    const img = (() => { const __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__5__2__2__1__2__1__0 = document.createElement("img"); (__e____scope__6__1__4__1__17__3__3__3__1__2__3__3__5__2__2__1__2__1__0.className = "gjoa-picker-icon");
return __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__5__2__2__1__2__1__0; })();
    (img.src = item.icon);
    (img.alt = "");
    row.appendChild(img);
  } else {
    const ic = (() => { const __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__5__2__3__1__2__1__0 = document.createXULElement("label"); (__e____scope__6__1__4__1__17__3__3__3__1__2__3__3__5__2__3__1__2__1__0.className = "gjoa-picker-icon-text");
return __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__5__2__3__1__2__1__0; })();
    ic.setAttribute("value", item.icon);
    row.appendChild(ic);
  }
}
const text = (() => { const __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__1__2__1__0 = document.createXULElement("hbox"); (__e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__1__2__1__0.className = "gjoa-picker-text");
return __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__1__2__1__0; })();
text.setAttribute("flex", "1");
const primary = (() => { const __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__3__1__2__1__0 = document.createXULElement("label"); (__e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__3__1__2__1__0.className = "gjoa-picker-label");
return __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__3__1__2__1__0; })();
primary.setAttribute("value", item.display);
primary.setAttribute("crop", "end");
text.appendChild(primary);
if (truthy(item.secondary)) {
  const sec = (() => { const __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__4__2__1__2__1__0 = document.createXULElement("label"); (__e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__4__2__1__2__1__0.className = "gjoa-picker-secondary");
return __e____scope__6__1__4__1__17__3__3__3__1__2__3__3__6__4__2__1__2__1__0; })();
  sec.setAttribute("value", item.secondary);
  sec.setAttribute("crop", "end");
  text.appendChild(sec);
}
row.appendChild(text);
row.addEventListener("click", () => { (st.selectedIdx = idx);
return commit(); });
return st.pickerList.appendChild(row); });
    return (() => { const some_thread____4 = st.pickerList.querySelector("[gjoa-picker-selected='true']"); return ((some_thread____4 == null) ? null : some_thread____4.scrollIntoView({block: "nearest"})); })();
  }
} };
  const move_selection = (delta) => { const match_count = st.filtered.length;
const selected_idx = st.selectedIdx;
if ((match_count > 0)) {
  (st.selectedIdx = ((selected_idx + delta + match_count) % match_count));
  return render_list();
} };
  const open_action_menu = () => { const target = st.filtered[st.selectedIdx];
const local_actions = st.actions;
if (truthy(((_logical) => (_logical !== false && _logical != null ? local_actions.length : _logical))(target))) {
  dismiss();
  const show_fn = show_ref.fn;
  return show_fn({prompt: "actions >", items: local_actions.map((_pct1) => { const label = ("".concat(_pct1.label, (truthy(_pct1.key) ? ("".concat("   (", _pct1.key, ")")) : "")));
return {display: label, data: _pct1}; }), onSelect: (_pct1) => { const action = _pct1.data;
return (() => { try {
    return action.run(target);
  } catch (e) {
    return deps.modelineMsg(("".concat("action failed: ", e.message)), 4000);
  } })(); }});
} };
  const ensure_built = () => { if ((!truthy(st.pickerEl))) {
  const root = document.createXULElement("vbox");
  const input_box = (() => { const __e____scope__6__1__4__1__26__3__2__1__5__1__0 = document.createXULElement("hbox"); (__e____scope__6__1__4__1__26__3__2__1__5__1__0.className = "gjoa-picker-input-box");
return __e____scope__6__1__4__1__26__3__2__1__5__1__0; })();
  const prompt = (() => { const __e____scope__6__1__4__1__26__3__2__1__8__1__0 = document.createXULElement("label"); (__e____scope__6__1__4__1__26__3__2__1__8__1__0.className = "gjoa-picker-prompt");
return __e____scope__6__1__4__1__26__3__2__1__8__1__0; })();
  const input = (() => { const __e____scope__6__1__4__1__26__3__2__1__11__1__0 = document.createElement("input"); (__e____scope__6__1__4__1__26__3__2__1__11__1__0.className = "gjoa-picker-input");
return __e____scope__6__1__4__1__26__3__2__1__11__1__0; })();
  const list = (() => { const __e____scope__6__1__4__1__26__3__2__1__14__1__0 = document.createXULElement("vbox"); (__e____scope__6__1__4__1__26__3__2__1__14__1__0.className = "gjoa-picker-list");
return __e____scope__6__1__4__1__26__3__2__1__14__1__0; })();
  (root.id = "gjoa-picker");
  (root.hidden = true);
  root.setAttribute("aria-modal", "true");
  prompt.setAttribute("value", ">");
  (input.placeholder = "Filter...");
  input_box.append(prompt, input);
  root.append(input_box, list);
  document.documentElement.appendChild(root);
  (st.pickerEl = root);
  (st.pickerInput = input);
  (st.pickerList = list);
  input.addEventListener("input", () => { const query = input.value.trim().toLowerCase();
(st.filtered = compute_filtered(st.items, query, st.preserveTree, st.filterItem));
(st.selectedIdx = 0);
return render_list(); });
  return input.addEventListener("keydown", (_pct1) => { if (truthy(st.active)) {
  const key = _pct1.key;
  return ((((key === "Escape"))) ? (() => { _pct1.preventDefault();
_pct1.stopImmediatePropagation();
return dismiss(); })() : (((key === "Enter"))) ? (() => { _pct1.preventDefault();
_pct1.stopImmediatePropagation();
return commit(); })() : ((((key === "Tab")) && (st.actions.length > 0))) ? (() => { _pct1.preventDefault();
_pct1.stopImmediatePropagation();
return open_action_menu(); })() : (truthy(((key === "ArrowDown")) || ((_logical) => (_logical !== false && _logical != null ? (((key === "j")) || ((key === "n"))) : _logical))(_pct1.ctrlKey))) ? (() => { _pct1.preventDefault();
_pct1.stopImmediatePropagation();
return move_selection(1); })() : (truthy(((key === "ArrowUp")) || ((_logical) => (_logical !== false && _logical != null ? (((key === "k")) || ((key === "p"))) : _logical))(_pct1.ctrlKey))) ? (() => { _pct1.preventDefault();
_pct1.stopImmediatePropagation();
return move_selection(-1); })() : null);
} }, true);
} };
  const show = (opts) => { ensure_built();
if (truthy(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? st.pickerList : _logical))(st.pickerInput) : _logical))(st.pickerEl))) {
  (st.items = opts.items);
  (st.selectedIdx = 0);
  (st.onSelect = opts.onSelect);
  (st.actions = ((_logical) => (_logical !== false && _logical != null ? _logical : []))(opts.actions));
  (st.preserveTree = truthy(opts.preserveTree));
  (st.filterItem = opts.filterItem);
  (st.filtered = opts.items.slice());
  (st.active = true);
  const prompt_el = st.pickerEl.querySelector(".gjoa-picker-prompt");
  if (truthy(((_logical) => (_logical !== false && _logical != null ? opts.prompt : _logical))(prompt_el))) {
    prompt_el.setAttribute("value", opts.prompt);
  } else if (truthy(prompt_el)) {
    prompt_el.setAttribute("value", ">");
  } else {
    null;
  }
  (st.pickerInput.value = "");
  render_list();
  (st.pickerEl.hidden = false);
  return st.pickerInput.focus();
} };
  const destroy = () => { document.removeEventListener("keydown", on_doc_keydown, true);
document.removeEventListener("mousedown", on_doc_mousedown, true);
dismiss();
(() => { const some_thread____5 = st.pickerEl; return ((some_thread____5 == null) ? null : some_thread____5.remove()); })();
(st.pickerEl = null);
(st.pickerInput = null);
return (st.pickerList = null); };
  const on_doc_keydown = (_pct1) => { if (truthy(st.active)) {
  if (((_pct1.key === "Escape"))) {
    _pct1.preventDefault();
    _pct1.stopImmediatePropagation();
    return dismiss();
  }
} };
  const on_doc_mousedown = (_pct1) => { if (truthy(((_logical) => (_logical !== false && _logical != null ? st.pickerEl : _logical))(st.active))) {
  const t = _pct1.target;
  if (((!truthy(t)) || (!truthy(st.pickerEl.contains(t))))) {
    return dismiss();
  }
} };
  (show_ref.fn = show);
  document.addEventListener("keydown", on_doc_keydown, true);
  document.addEventListener("mousedown", on_doc_mousedown, true);
  return {show: show, isActive: () => st.active, dismiss: dismiss, destroy: destroy};
}
