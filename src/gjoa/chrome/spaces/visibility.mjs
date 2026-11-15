
import { equiv } from "../lib/value.mjs";
export function is_in_active_space(tab, tab_space, spaces, default_id, active_id) {
  const id = tab_space.get(tab);
  const effective = (((!(equiv(id, undefined))) && spaces.has(id)) ? id : default_id);
  return (effective === active_id);
}
