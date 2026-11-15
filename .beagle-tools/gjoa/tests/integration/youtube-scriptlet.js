import { equivV as $$bc$equiv } from 'beagle/core.js';

const YT_URL = "https://www.youtube.com/watch?v=jNQXAC9IVRw";

const NAV_JS = ("".concat("\n", "  const [url, resolve] = arguments;\n", "  let done=false; const finish=v=>{if(!done){done=true;resolve(v);}};\n", "  const win = Services.wm.getMostRecentWindow('navigator:browser');\n", "  const b = win.gBrowser.selectedBrowser;\n", "  b.loadURI(Services.io.newURI(url), { triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() });\n", "  const l = { QueryInterface: ChromeUtils.generateQI(['nsIWebProgressListener','nsISupportsWeakReference']),\n", "    onStateChange(wp,req,flags){ const S=Ci.nsIWebProgressListener;\n", "      if((flags&S.STATE_STOP)&&(flags&S.STATE_IS_WINDOW)){ try{b.removeProgressListener(l);}catch{} finish(true);} } };\n", "  b.addProgressListener(l, Ci.nsIWebProgress.NOTIFY_STATE_ALL);\n", "  setTimeout(()=>finish(false), 25000);\n"));

const PROBE = ("".concat("\n", "  const w = (typeof window.wrappedJSObject !== 'undefined' && window.wrappedJSObject) ? window.wrappedJSObject : window;\n", "  let jp=''; try { jp = String(w.JSON.parse); } catch(e){}\n", "  const y = w.ytInitialPlayerResponse;\n", "  return {\n", "    title: document.title,\n", "    jsonPatched: jp.indexOf('[native code]') < 0,\n", "    hasYtipr: !!y,\n", "    adPlacements: y ? (y.adPlacements===undefined ? 'pruned' : 'PRESENT') : 'none',\n", "  };"));

export const tests = [{name: "youtube: player-prune scriptlet strips adPlacements at document-start", run: async (mn) => { await mn.setContext("chrome");
const navOk = await mn.executeAsyncScript(NAV_JS, [YT_URL]);
await mn.setContext("content");
await mn.executeAsyncScript("const[r]=arguments; setTimeout(()=>r(true), 3000);");
const info = await mn.executeScript(PROBE);
return (((!navOk)) ? console.log("[youtube] SKIP — page did not load (network)") : ((!((_truthy) => _truthy !== false && _truthy != null)(info.hasYtipr))) ? console.log(("".concat("[youtube] SKIP — no player response (", info.title, ")"))) : (() => { if ((!((_truthy) => _truthy !== false && _truthy != null)(info.jsonPatched))) {
  (() => { throw new Error("JSON.parse must be wrapped by the document-start scriptlet"); })();
}
if ((!($$bc$equiv(info.adPlacements, "pruned")))) {
  return (() => { throw new Error(("".concat("ytInitialPlayerResponse.adPlacements must be pruned, got ", info.adPlacements))); })();
} })()); }}];

export default tests;
