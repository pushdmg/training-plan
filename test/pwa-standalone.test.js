"use strict";

const assert = require("assert");
const { isStandalonePwa } = require("../pwa-detect.js");

function mockWindow(opts) {
  opts = opts || {};
  const queries = opts.queries || {};
  return {
    navigator: opts.navigator || { standalone: false },
    matchMedia: function (q) {
      return { matches: !!queries[q] };
    }
  };
}

assert.strictEqual(isStandalonePwa(null), false);
assert.strictEqual(isStandalonePwa(mockWindow()), false);
assert.strictEqual(
  isStandalonePwa(mockWindow({ navigator: { standalone: true } })),
  true,
  "iOS home-screen icon sets navigator.standalone"
);
assert.strictEqual(
  isStandalonePwa(mockWindow({ queries: { "(display-mode: standalone)": true } })),
  true,
  "installed PWA reports display-mode standalone"
);
assert.strictEqual(
  isStandalonePwa(mockWindow({
    navigator: { standalone: false },
    queries: { "(display-mode: standalone)": false }
  })),
  false,
  "normal browser tab shows install hint"
);
assert.strictEqual(
  isStandalonePwa({ navigator: {}, matchMedia: function () { throw new Error("no media"); } }),
  false,
  "unavailable detection falls back to browser (show hint)"
);

console.log("pwa-standalone.test.js: ok");
