/* QA REFERENCE ONLY — DO NOT SHIP TO PRODUCTION
 * Remove this file and its script tag from index.html before any production deploy.
 * Run: node test/verify-production-no-qa-stamp.js (must pass on main/production). */
(function (root) {
  "use strict";
  root.BOTFIT_QA = { stamp: "QA build · v31 · GRO-25/26" };
})(typeof globalThis !== "undefined" ? globalThis : this);
