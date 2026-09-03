"use strict";

/* Pre-ship check: production/main must have no QA build stamp wiring.
 * Run on main before deploy: node test/verify-production-no-qa-stamp.js */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const failures = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

if (fs.existsSync(path.join(root, "qa-build.js"))) {
  failures.push("qa-build.js exists (QA-only — delete before production ship)");
}

const indexHtml = read("index.html");
if (/qa-build\.js/.test(indexHtml)) {
  failures.push("index.html loads qa-build.js (remove script tag before production ship)");
}

const configJs = read("config.js");
if (/qaBuildStamp/.test(configJs)) {
  failures.push("config.js contains qaBuildStamp (must not ship in shared config)");
}

const swJs = read("sw.js");
if (/qa-build\.js/.test(swJs)) {
  failures.push("sw.js caches qa-build.js (remove from ASSETS before production ship)");
}

const appJs = read("app.js");
if (/qaBuildStampHtml|BOTFIT_QA|qa-build-stamp/.test(appJs)) {
  failures.push("app.js still has QA stamp wiring (qaBuildStampHtml / BOTFIT_QA / qa-build-stamp)");
}

const stylesCss = read("styles.css");
if (/qa-build-stamp/.test(stylesCss)) {
  failures.push("styles.css still has .qa-build-stamp (QA-only)");
}

["app.js", "index.html", "sw.js", "config.js", "styles.css", "pwa-detect.js", "auth-errors.js"].forEach(function (rel) {
  if (/QA build · v31/.test(read(rel))) {
    failures.push(rel + " contains QA build stamp text");
  }
});

if (failures.length) {
  console.error("verify-production-no-qa-stamp: FAIL");
  failures.forEach(function (msg) { console.error("  - " + msg); });
  process.exit(1);
}

console.log("verify-production-no-qa-stamp: ok (no QA stamp artifacts)");
