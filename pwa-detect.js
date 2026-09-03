/* BotFit PWA standalone detection — browser + node testable */
(function (root) {
  "use strict";

  function isStandalonePwa(win) {
    win = win || (typeof window !== "undefined" ? window : null);
    if (!win) return false;
    try {
      if (win.navigator && win.navigator.standalone === true) return true;
    } catch (e) {}
    try {
      if (win.matchMedia && win.matchMedia("(display-mode: standalone)").matches) return true;
    } catch (e) {}
    return false;
  }

  var api = { isStandalonePwa: isStandalonePwa };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.BOTFIT_PWA = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
