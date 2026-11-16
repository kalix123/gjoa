// Gjoa.history / .sessions / .checkpoints: views over the append-only tab
// history store (tabs/history.mjs). Sessions and checkpoints are tagged
// history events whose tag starts with "session:" / "checkpoint:".

const isOfKind = (kind) => (ev) => !!ev.tag?.startsWith(`${kind}:`);

function taggedView(history, kind) {
  return {
    list: (opts) => history.getTagged(opts?.limit ?? 100).then((evs) => evs.filter(isOfKind(kind))),
    search: (query, opts) =>
      history.search(query, { taggedOnly: true, limit: opts?.limit ?? 50 })
        .then((evs) => evs.filter(isOfKind(kind))),
    tag: (label) => history.tagLatest(kind, label),
  };
}

export function make_persisted(history) {
  return {
    history: {
      recent: (opts) => history.getRecent(opts?.limit ?? 50),
      search: (query, opts) =>
        history.search(query, { taggedOnly: opts?.taggedOnly ?? false, limit: opts?.limit ?? 50 }),
      byId: (id) => history.getById(id),
      instanceId: () => history.instanceId(),
    },
    checkpoints: taggedView(history, "checkpoint"),
    sessions: taggedView(history, "session"),
  };
}
