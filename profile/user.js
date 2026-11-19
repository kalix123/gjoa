// about:config settings. Firefox applies this file on every start, so a value
// set here wins over one changed in about:config — edit it here instead.

// --- Allow the profile's chrome/ folder to restyle Firefox ----------------
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);

// --- Layout: native vertical tabs in the sidebar ---------------------------
user_pref("sidebar.revamp", true);
user_pref("sidebar.verticalTabs", true);
user_pref("sidebar.visibility", "always-show");      // or "expand-on-hover" for a slim strip
user_pref("sidebar.expandOnHover", false);
user_pref("browser.toolbars.bookmarks.visibility", "never");
user_pref("browser.uidensity", 1);                    // compact toolbars
user_pref("browser.compactmode.show", true);
user_pref("browser.tabs.firefox-view", false);
user_pref("browser.tabs.tabmanager.enabled", false);  // the "list all tabs" arrow
user_pref("browser.download.autohideButton", false);  // downloads button always in the sidebar footer

// Toolbar layout, pinned so Firefox's first-run migrations can't shuffle it.
// currentVersion must match Firefox's (28 in Firefox 160) or it re-migrates.
user_pref("browser.uiCustomization.state", "{\"placements\":{\"widget-overflow-fixed-list\":[],\"unified-extensions-area\":[],\"nav-bar\":[\"downloads-button\",\"preferences-button\",\"unified-extensions-button\",\"vertical-spacer\",\"back-button\",\"forward-button\",\"stop-reload-button\",\"sidebar-button\",\"urlbar-container\"],\"toolbar-menubar\":[\"menubar-items\"],\"TabsToolbar\":[],\"vertical-tabs\":[\"tabbrowser-tabs\"],\"PersonalToolbar\":[\"personal-bookmarks\"]},\"seen\":[\"reset-pbm-toolbar-button\",\"smartwindow-group-tabs-button\",\"ai-window-toggle\",\"developer-button\",\"screenshot-button\",\"alltabs-button\"],\"dirtyAreaCache\":[\"nav-bar\",\"vertical-tabs\"],\"currentVersion\":28,\"newElementCount\":0}");

// --- See-through window (Windows 11 acrylic blur) ------------------------------
// toplevel-backdrop: 0 auto, 1 Mica, 2 acrylic (blurs what's behind the window),
// 3 Mica Alt. userChrome.css keeps the chrome translucent so it shows through.
user_pref("widget.windows.mica", true);
user_pref("widget.windows.mica.toplevel-backdrop", 2);
user_pref("widget.windows.mica.popups", 2);
user_pref("browser.tabs.allow_transparent_browser", true); // lets the new tab page be see-through
user_pref("layout.css.backdrop-filter.enabled", true);

// --- Dark everywhere ---------------------------------------------------------
// The default (system) theme: built-in color themes disable the backdrop.
user_pref("extensions.activeThemeID", "default-theme@mozilla.org");
user_pref("layout.css.prefers-color-scheme.content-override", 0); // sites get dark mode when they support it
user_pref("browser.theme.content-theme", 0);
user_pref("browser.theme.toolbar-theme", 0);

// --- Quieter new tab page ----------------------------------------------------
user_pref("browser.newtabpage.activity-stream.showSponsored", false);
user_pref("browser.newtabpage.activity-stream.showSponsoredTopSites", false);
user_pref("browser.newtabpage.activity-stream.feeds.section.topstories", false);
user_pref("browser.newtabpage.activity-stream.showWeather", false);
user_pref("browser.newtabpage.activity-stream.feeds.weatherfeed", false);
user_pref("browser.newtabpage.activity-stream.feeds.topsites", true);
user_pref("browser.newtabpage.activity-stream.topSitesRows", 1);

// --- No nags, popups or onboarding ------------------------------------------
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.aboutwelcome.enabled", false);
user_pref("browser.aboutConfig.showWarning", false);
user_pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.addons", false);
user_pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.features", false);
user_pref("browser.messaging-system.whatsNewPanel.enabled", false);
user_pref("browser.preferences.moreFromMozilla", false);
user_pref("extensions.pocket.enabled", false);
user_pref("browser.tabs.warnOnClose", false);

// --- No AI features ---------------------------------------------------------
user_pref("browser.ml.enable", false);
user_pref("browser.ml.chat.enabled", false);
user_pref("browser.ml.chat.sidebar", false);
user_pref("browser.ml.linkPreview.enabled", false);
user_pref("browser.tabs.groups.smart.enabled", false);

// --- Telemetry off ----------------------------------------------------------
user_pref("datareporting.healthreport.uploadEnabled", false);
user_pref("datareporting.policy.dataSubmissionEnabled", false);
user_pref("toolkit.telemetry.enabled", false);
user_pref("toolkit.telemetry.unified", false);
user_pref("app.shield.optoutstudies.enabled", false);
user_pref("app.normandy.enabled", false);
