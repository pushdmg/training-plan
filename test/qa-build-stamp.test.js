"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");

assert.ok(fs.existsSync(path.join(root, "qa-build.js")), "QA branch includes qa-build.js");
assert.match(fs.readFileSync(path.join(root, "index.html"), "utf8"), /qa-build\.js/);

const ctx = { globalThis: {}, window: {} };
ctx.globalThis = ctx.window;
vm.runInNewContext(fs.readFileSync(path.join(root, "qa-build.js"), "utf8"), ctx);
assert.strictEqual(ctx.window.BOTFIT_QA.stamp, "QA build · v31 · GRO-25/26");

console.log("qa-build-stamp.test.js: ok");
