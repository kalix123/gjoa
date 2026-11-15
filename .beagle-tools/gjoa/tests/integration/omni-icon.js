import { wait_for } from '../dsl.js';

export const tests = [{name: "omni-icon button + its dropdown actions exist in the nav-bar", run: async (mn) => { await dsl.wait_for(mn, "return !!document.getElementById('gjoa-omni-icon-button');", 5000);
const r = await mn.executeScript("\n        const btn = document.getElementById('gjoa-omni-icon-button');\n        const menu = document.getElementById('gjoa-omni-icon-menu');\n        const items = menu ? [...menu.querySelectorAll('menuitem')].map(m => m.getAttribute('label')) : [];\n        return {\n          btnPresent: !!btn,\n          btnInNavBar: btn ? !!btn.closest('#nav-bar') : false,\n          menuPresent: !!menu,\n          items,\n        };");
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.btnPresent))) {
  (() => { throw new Error("omni-icon button #gjoa-omni-icon-button must exist"); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.btnInNavBar))) {
  (() => { throw new Error("omni-icon button must live in the nav-bar"); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.menuPresent))) {
  (() => { throw new Error("omni-icon menu must exist"); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.items.includes("Back")))) {
  (() => { throw new Error(("".concat("omni menu must include Back; got ", JSON.stringify(r.items)))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.items.includes("Reload")))) {
  (() => { throw new Error(("".concat("omni menu must include Reload; got ", JSON.stringify(r.items)))); })();
}
if ((!((_truthy) => _truthy !== false && _truthy != null)(r.items.includes("Toggle sidebar")))) {
  return (() => { throw new Error(("".concat("omni menu must include the sidebar toggle; got ", JSON.stringify(r.items)))); })();
} }}];

export default tests;
