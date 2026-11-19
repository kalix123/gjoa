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

// Toolbar layout, pinned so Firefox's first-run migrations can't shuffle it.
// currentVersion must match Firefox's (28 in Firefox 160) or it re-migrates.
user_pref("browser.uiCustomization.state", "{\"placements\":{\"widget-overflow-fixed-list\":[],\"unified-extensions-area\":[],\"nav-bar\":[\"sidebar-button\",\"back-button\",\"forward-button\",\"stop-reload-button\",\"urlbar-container\",\"unified-extensions-button\"],\"toolbar-menubar\":[\"menubar-items\"],\"TabsToolbar\":[],\"vertical-tabs\":[\"tabbrowser-tabs\"],\"PersonalToolbar\":[\"personal-bookmarks\"]},\"seen\":[\"reset-pbm-toolbar-button\",\"smartwindow-group-tabs-button\",\"ai-window-toggle\",\"developer-button\",\"screenshot-button\",\"alltabs-button\"],\"dirtyAreaCache\":[\"nav-bar\",\"vertical-tabs\"],\"currentVersion\":28,\"newElementCount\":0}");

// --- Dark everywhere ---------------------------------------------------------
user_pref("extensions.activeThemeID", "firefox-compact-dark@mozilla.org");
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
