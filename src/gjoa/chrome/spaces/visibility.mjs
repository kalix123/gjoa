// A tab belongs to its assigned space if that space still exists, otherwise
// to the default space.
export function is_in_active_space(tab, tabSpace, spaces, defaultId, activeId) {
  const id = tabSpace.get(tab);
  const effective = id !== undefined && spaces.has(id) ? id : defaultId;
  return effective === activeId;
}
