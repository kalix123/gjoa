// Gjoa.tabs: list and activate tabs across every browser window, through each
// window's own Gjoa API.

function* gjoaWindows() {
  const e = Services.wm.getEnumerator("navigator:browser");
  while (e.hasMoreElements()) {
    const api = e.getNext().Gjoa;
    if (api) yield api.windows.current();
  }
}

export function make_cross_window_tabs() {
  return {
    all() {
      const out = [];
      try {
        for (const win of gjoaWindows()) {
          try {
            for (const t of win.tabs.list()) {
              out.push({
                id: t.id, url: t.url, label: t.label, customName: t.customName,
                pinned: t.pinned, selected: t.selected, hidden: t.hidden,
                parentId: t.parentId, depth: t.depth, windowId: win.windowId,
              });
            }
          } catch {}
        }
      } catch (err) {
        console.error("[Gjoa.tabs.all] enumerate failed", err);
      }
      return out;
    },
    activate(gjoaId, windowId) {
      try {
        for (const win of gjoaWindows()) {
          if (win.windowId === windowId) return win.tabs.activate(gjoaId);
        }
        return false;
      } catch (err) {
        console.error("[Gjoa.tabs.activate] failed", err);
        return false;
      }
    },
  };
}
