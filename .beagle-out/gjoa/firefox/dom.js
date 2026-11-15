import { equivV as $$bc$equiv } from 'beagle/core.js';

export function xul(tag, attrs) {
  const el = document.createXULElement(tag);
  if (((_truthy) => _truthy !== false && _truthy != null)(attrs)) {
    Object.entries(attrs).forEach((entry) => { const name = entry[0];
const value = entry[1];
if (((_truthy) => _truthy !== false && _truthy != null)(((!($$bc$equiv(value, false))) && ((!($$bc$equiv(value, null))) && (!($$bc$equiv(value, undefined))))))) {
  return el.setAttribute(name, String(value));
} });
  }
  return el;
}

export function xul_label(attrs) {
  return xul("label", attrs);
}

export function xul_hbox(attrs) {
  return xul("hbox", attrs);
}

export function xul_vbox(attrs) {
  return xul("vbox", attrs);
}

export function xul_box(attrs) {
  return xul("box", attrs);
}

export function xul_image(attrs) {
  return xul("image", attrs);
}

export function xul_menu_popup(attrs) {
  return xul("menupopup", attrs);
}

export function xul_menu_item(attrs) {
  return xul("menuitem", attrs);
}

export function xul_menu_separator(attrs) {
  return xul("menuseparator", attrs);
}
