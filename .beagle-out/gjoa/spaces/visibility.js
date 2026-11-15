import { equivV as $$bc$equiv } from 'beagle/core.js';

export function is_in_active_space(tab, tab_space, spaces, default_id, active_id) {
  const id = tab_space.get(tab);
  const effective = (((_truthy) => _truthy !== false && _truthy != null)(((!($$bc$equiv(id, undefined))) && spaces.has(id))) ? id : default_id);
  return (effective === active_id);
}
