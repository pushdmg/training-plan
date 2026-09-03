"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  AUTH_SERVICE_UNAVAILABLE_MSG,
  isAuthServiceUnavailable,
  authFailMessage
} = require("../auth-errors.js");

test("network failure is service unavailable", function () {
  assert.equal(isAuthServiceUnavailable({ networkError: true, status: 0, json: {} }), true);
  assert.equal(
    authFailMessage({ networkError: true, status: 0, json: {} }, "Could not sign in."),
    AUTH_SERVICE_UNAVAILABLE_MSG
  );
});

test("5xx responses are service unavailable", function () {
  assert.equal(isAuthServiceUnavailable({ ok: false, status: 503, json: {} }), true);
  assert.equal(
    authFailMessage({ ok: false, status: 502, json: { error: "bad gateway" } }, "Could not sign in."),
    AUTH_SERVICE_UNAVAILABLE_MSG
  );
});

test("invalid credentials stay credential-specific", function () {
  const res = {
    ok: false,
    status: 400,
    json: { error: "invalid_grant", error_description: "Invalid login credentials" }
  };
  assert.equal(isAuthServiceUnavailable(res), false);
  assert.equal(authFailMessage(res, "Could not sign in."), "Invalid login credentials");
});

test("empty 400 without body keeps fallback", function () {
  const res = { ok: false, status: 400, json: {} };
  assert.equal(isAuthServiceUnavailable(res), false);
  assert.equal(authFailMessage(res, "Could not sign in."), "Could not sign in.");
});

test("service unavailable message hides technical details", function () {
  const res = {
    networkError: true,
    status: 0,
    json: { msg: "Failed to fetch", error: "ENOTFOUND" }
  };
  assert.equal(authFailMessage(res, "Could not sign in."), AUTH_SERVICE_UNAVAILABLE_MSG);
  assert.doesNotMatch(AUTH_SERVICE_UNAVAILABLE_MSG, /dns|fetch|supabase/i);
});
