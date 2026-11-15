import { create_logger_bang } from './log.mjs';
import { all_rows, data_of_bang, level_of_row_bang, same_node_p } from './helpers.mjs';
import { row_of, state } from './state.mjs';

import { equiv, truthy } from "../lib/value.mjs";
export function collapse_flags(launcher_expanded, compact, hover) {
  const compact_revealed = (compact && hover);
  return {iconsOnly: ((!launcher_expanded) && (!truthy(compact_revealed))), sidebarCollapsed: ((!launcher_expanded) || compact)};
}

export function make_layout_bang(deps) {
  const sidebar_main = deps.sidebarMain;
  const rows = deps.rows;
  const log = create_logger_bang("tabs/layout");
  const priv = {toolboxResizeObs: null, alignSpacer: null, lastVertical: null, posPanelRaf: 0};
  const is_vertical = () => (() => { try {
    return Services.prefs.getBoolPref("sidebar.verticalTabs", true);
  } catch (__e____scope__4__1__4__1__14__3__2__1__0) {
    return true;
  } })();
  const apply_layout_tree_collapse = () => { const vertical = is_vertical();
const space_filter = deps.isTabInActiveSpace;
const all = all_rows();
const mutated = {v: false};
const set_lc_bang = (row, val) => { const d = data_of_bang(row);
const cur = (truthy(((_logical) => (_logical !== false && _logical != null ? d.layoutCollapsed : _logical))(d)) ? true : false);
if (truthy(((_logical) => (_logical !== false && _logical != null ? (!(cur === val)) : _logical))(d))) {
  (d.layoutCollapsed = val);
  rows.syncAnyRow(row);
  return (mutated.v = true);
} };
if (truthy(vertical)) {
  all.forEach((row) => { if (((level_of_row_bang(row) === 0))) {
  return set_lc_bang(row, false);
} });
} else {
  const active_tab = ((_logical) => (_logical !== false && _logical != null ? gBrowser.selectedTab : _logical))(gBrowser);
  const active_row = ((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? _logical : all.find((_pct1) => (equiv(_pct1._tab, active_tab)))))(row_of.get(active_tab)) : _logical))(active_tab);
  const found = {root: null};
  if (truthy(active_row)) {
    (() => { let i = all.indexOf(active_row); while (true) {
    if ((i >= 0)) {  if (((level_of_row_bang(all[i]) === 0))) { return (found.root = all[i]); } else { const _recur_0 = (i - 1); i = _recur_0; continue; } } else { return null; }
  } })();
  }
  if (truthy(found.root)) {
    all.forEach((row) => { if (truthy(((level_of_row_bang(row) === 0)) && (() => { const t = row._tab; return ((!truthy(t)) || ((!truthy(space_filter)) || space_filter(t))); })())) {
  return set_lc_bang(row, (!(equiv(row, found.root))));
} });
  }
}
if (truthy(mutated.v)) {
  return rows.updateVisibility();
} };
  const setup_horizontal_align_spacer = () => { const target = document.getElementById("TabsToolbar-customization-target");
if (truthy(target)) {
  if ((!truthy(priv.alignSpacer))) {
    const el = document.createXULElement("box");
    (el.id = "gjoa-content-alignment-spacer");
    (el.style.flex = "0 0 auto");
    (el.style.width = "10px");
    (priv.alignSpacer = el);
  }
  if ((!truthy(same_node_p(target.firstChild, priv.alignSpacer)))) {
    return target.prepend(priv.alignSpacer);
  }
} };
  const teardown_horizontal_align_spacer = () => { if (truthy(priv.alignSpacer)) {
  return priv.alignSpacer.remove();
} };
  const set_urlbar_top_layer = (in_top_layer) => { const urlbar = document.getElementById("urlbar");
if (truthy(urlbar)) {
  if ((!(sidebar_main.hasAttribute("data-gjoa-compact")))) {
    if (truthy(in_top_layer && (!truthy(urlbar.hasAttribute("popover"))))) {
      urlbar.setAttribute("popover", "manual");
      return (() => { try {
    return urlbar.showPopover();
  } catch (__e) {
    return null;
  } })();
    } else {
      if (((!in_top_layer) && urlbar.hasAttribute("popover"))) {
        return urlbar.removeAttribute("popover");
      }
    }
  }
} };
  const position_panel = () => { if (truthy(state.panel)) {
  const vertical = is_vertical();
  state.panel.toggleAttribute("gjoa-horizontal", (!truthy(vertical)));
  if (truthy(state.pinnedContainer)) {
    state.pinnedContainer.toggleAttribute("gjoa-horizontal", (!truthy(vertical)));
  }
  document.documentElement.toggleAttribute("gjoa-horizontal-tabs", (!truthy(vertical)));
  if (truthy(priv.toolboxResizeObs)) {
    priv.toolboxResizeObs.disconnect();
    (priv.toolboxResizeObs = null);
  }
  const toolbox = document.getElementById("navigator-toolbox");
  const toolbox_in_sidebar = ((_logical) => (_logical !== false && _logical != null ? same_node_p(toolbox.parentNode, sidebar_main) : _logical))(toolbox);
  const launcher_expanded = sidebar_main.hasAttribute("sidebar-launcher-expanded");
  if (truthy(vertical)) {
    const flags = collapse_flags(launcher_expanded, sidebar_main.hasAttribute("data-gjoa-compact"), sidebar_main.hasAttribute("gjoa-has-hover"));
    const sidebar_collapsed = flags.sidebarCollapsed;
    const icons_only = flags.iconsOnly;
    state.panel.toggleAttribute("gjoa-icons-only", icons_only);
    if (truthy(state.pinnedContainer)) {
      state.pinnedContainer.toggleAttribute("gjoa-icons-only", icons_only);
    }
    if (truthy(state.spaceHeader)) {
      state.spaceHeader.toggleAttribute("gjoa-icons-only", icons_only);
    }
    document.documentElement.toggleAttribute("gjoa-sidebar-collapsed", sidebar_collapsed);
    if (truthy(((_logical) => (_logical !== false && _logical != null ? ((_logical) => (_logical !== false && _logical != null ? state.pinnedContainer : _logical))(toolbox) : _logical))(toolbox_in_sidebar))) {
      if (truthy(((_logical) => (_logical !== false && _logical != null ? (!truthy(same_node_p(toolbox.nextElementSibling, state.spaceHeader))) : _logical))(state.spaceHeader))) {
        toolbox.after(state.spaceHeader);
      }
      const header_anchor = ((_logical) => (_logical !== false && _logical != null ? _logical : toolbox))(state.spaceHeader);
      if ((!truthy(same_node_p(header_anchor.nextElementSibling, state.pinnedContainer)))) {
        header_anchor.after(state.pinnedContainer);
      }
      if ((!truthy(same_node_p(state.pinnedContainer.nextElementSibling, state.panel)))) {
        state.pinnedContainer.after(state.panel);
      }
    } else {
      if (truthy(((_logical) => (_logical !== false && _logical != null ? ((!truthy(same_node_p(state.panel.parentNode, sidebar_main))) || (!truthy(same_node_p(sidebar_main.firstElementChild, ((_logical) => (_logical !== false && _logical != null ? _logical : state.pinnedContainer))(state.spaceHeader))))) : _logical))(state.pinnedContainer))) {
        sidebar_main.prepend(state.panel);
        sidebar_main.prepend(state.pinnedContainer);
        if (truthy(state.spaceHeader)) {
          sidebar_main.prepend(state.spaceHeader);
        }
      }
    }
    teardown_horizontal_align_spacer();
    set_urlbar_top_layer(true);
  } else {
    state.panel.removeAttribute("gjoa-icons-only");
    if (truthy(state.pinnedContainer)) {
      state.pinnedContainer.removeAttribute("gjoa-icons-only");
    }
    document.documentElement.removeAttribute("gjoa-sidebar-collapsed");
    if (truthy(((_logical) => (_logical !== false && _logical != null ? state.spaceHeader.parentNode : _logical))(state.spaceHeader))) {
      state.spaceHeader.remove();
    }
    const tabbrowser_tabs = document.getElementById("tabbrowser-tabs");
    if (truthy(tabbrowser_tabs)) {
      if (truthy(((_logical) => (_logical !== false && _logical != null ? (!truthy(same_node_p(tabbrowser_tabs.nextElementSibling, state.pinnedContainer))) : _logical))(state.pinnedContainer))) {
        tabbrowser_tabs.after(state.pinnedContainer);
      }
      const anchor = ((_logical) => (_logical !== false && _logical != null ? _logical : tabbrowser_tabs))(state.pinnedContainer);
      if ((!truthy(same_node_p(anchor.nextElementSibling, state.panel)))) {
        anchor.after(state.panel);
      }
    }
    setup_horizontal_align_spacer();
  }
  if (truthy((!truthy(toolbox_in_sidebar)) && toolbox)) {
    const update_height = () => { const h = toolbox.getBoundingClientRect().height;
return document.documentElement.style.setProperty("--gjoa-toolbox-height", ("".concat(h, "px"))); };
    update_height();
    (priv.toolboxResizeObs = new ResizeObserver(update_height));
    priv.toolboxResizeObs.observe(toolbox);
  } else {
    document.documentElement.style.removeProperty("--gjoa-toolbox-height");
  }
  if (truthy(vertical)) {
    rows.clearHorizontalGrid();
  }
  all_rows().forEach((_pct1) => rows.syncAnyRow(_pct1));
  rows.updateVisibility();
  const mode_changed = ((!((priv.lastVertical == null))) && (!(equiv(priv.lastVertical, vertical))));
  const initial_horizontal = (((priv.lastVertical == null)) && (!truthy(vertical)));
  log("positionPanel:transitionCheck", {lastVertical: priv.lastVertical, vertical: vertical, modeChanged: mode_changed, initialHorizontal: initial_horizontal, willTrigger: ((_logical) => (_logical !== false && _logical != null ? _logical : initial_horizontal))(mode_changed)});
  if (truthy(((_logical) => (_logical !== false && _logical != null ? _logical : initial_horizontal))(mode_changed))) {
    apply_layout_tree_collapse();
  }
  if (truthy(deps.reconcileSelection)) {
    deps.reconcileSelection();
  }
  return (priv.lastVertical = vertical);
} };
  const request_position_panel = () => { if (((priv.posPanelRaf === 0))) {
  return (priv.posPanelRaf = requestAnimationFrame(() => { (priv.posPanelRaf = 0);
return position_panel(); }));
} };
  return {positionPanel: position_panel, requestPositionPanel: request_position_panel, isVertical: is_vertical, setUrlbarTopLayer: set_urlbar_top_layer};
}
