// XUL element construction. Attributes whose value is false/null/undefined are
// omitted; everything else is stringified.

export function xul(tag, attrs) {
  const el = document.createXULElement(tag);
  for (const [name, value] of Object.entries(attrs ?? {})) {
    if (value !== false && value != null) el.setAttribute(name, String(value));
  }
  return el;
}

export const xul_label = (attrs) => xul("label", attrs);
export const xul_hbox = (attrs) => xul("hbox", attrs);
export const xul_vbox = (attrs) => xul("vbox", attrs);
export const xul_box = (attrs) => xul("box", attrs);
export const xul_image = (attrs) => xul("image", attrs);
export const xul_menu_popup = (attrs) => xul("menupopup", attrs);
export const xul_menu_item = (attrs) => xul("menuitem", attrs);
export const xul_menu_separator = (attrs) => xul("menuseparator", attrs);
