
export const state = {panel: null, spacer: null, pinnedContainer: null, spaceHeader: null, contextTab: null, contextGroupRow: null, cursor: null, nextTabId: 1, inSessionRestore: true, lastLoadedNodes: []};

export const tree_of = new WeakMap();

export const row_of = new WeakMap();

export const hz_display = new WeakMap();

export const saved_tab_queue = [];

export const closed_tabs = [];

export const selection = new Set();

export const moving_tabs = new Set();
