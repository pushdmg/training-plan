/* BotFit auth error helpers — browser + Node testable */
(function (root) {
  "use strict";

  const AUTH_SERVICE_UNAVAILABLE_MSG =
    "Sign-in service is temporarily unavailable. Try again in a few minutes.";

  function isAuthServiceUnavailable(res) {
    if (!res) return false;
    if (res.networkError) return true;
    const status = typeof res.status === "number" ? res.status : 0;
    if (status === 0) return true;
    if (status >= 500) return true;
    return false;
  }

  function authFailMessage(res, fallback) {
    if (isAuthServiceUnavailable(res)) return AUTH_SERVICE_UNAVAILABLE_MSG;
    const d = res && res.json ? res.json : res || {};
    const msg = d.msg || d.error_description || d.error || "";
    const code = d.error_code || "";
    if (msg && code && String(msg).indexOf(code) === -1) return msg + " (" + code + ")";
    if (msg) return msg;
    if (code) return code;
    return fallback;
  }

  const api = {
    AUTH_SERVICE_UNAVAILABLE_MSG: AUTH_SERVICE_UNAVAILABLE_MSG,
    isAuthServiceUnavailable: isAuthServiceUnavailable,
    authFailMessage: authFailMessage
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.BOTFIT_AUTH = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
