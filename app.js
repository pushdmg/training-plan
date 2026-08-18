/* BotFit walkthrough — vanilla, localStorage, no build */
(function () {
  "use strict";

  const D = window.BOTFIT;
  const STORE = "botfit-logs-v1";
  const UI = "botfit-ui-v1";
  const ADJUST = "botfit-adjust-v1";
  const SBQ = "botfit-sb-queue";
  const AUTH = "botfit-sb-auth";
  const LAST = "botfit-last-session-v1";
  const PROPOSAL = "botfit-week-proposal-v1";
  const WEEK1 = parseISO(D.week1Monday);

  const INTERVALS = (function () {
    const steps = [{ label: "Easy spin warmup", sec: 360, hard: false }];
    for (let i = 1; i <= 8; i++) {
      steps.push({ label: "Hard 30s · " + i + " of 8", sec: 30, hard: true });
      steps.push({ label: "Easy 90s", sec: 90, hard: false });
    }
    steps.push({ label: "Easy cooldown", sec: 120, hard: false });
    return steps;
  })();

  const state = {
    view: "home",
    selectedDate: (function () { var t = startOfDay(new Date()); return t < WEEK1 ? new Date(WEEK1) : t; })(),
    satChoice: null,
    rideStep: 0,
    exIndex: 0,
    round: 0,
    currentSet: 0,
    rest: null,
    hold: null,
    interval: null,
    mobIndex: 0,
    calMonth: null,
    showCal: false,
    leaveKind: null,
    leaveReturn: null,
    watchUrl: null,
    logHint: ""
  };

  let restTimer = null;
  let holdTimer = null;
  let intervalTimer = null;
  let audioCtx = null;
  let authErr = "";
  let wuTapAt = 0;

  const $app = document.getElementById("app");
  const $overlay = document.getElementById("rest-overlay");

  function parseISO(s) {
    const [y, m, d] = s.split("-").map(Number);
    return startOfDay(new Date(y, m - 1, d));
  }
  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return startOfDay(x);
  }
  function iso(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }
  function weekdayMon0(d) {
    return (d.getDay() + 6) % 7;
  }
  function weekStartFor(date) {
    const d = startOfDay(date);
    if (d < WEEK1) return new Date(WEEK1);
    return addDays(d, -weekdayMon0(d));
  }
  function weekNumber(date) {
    const d = startOfDay(date);
    if (d < WEEK1) return 1;
    const diff = Math.floor((d - WEEK1) / 86400000);
    return Math.min(8, Math.floor(diff / 7) + 1);
  }
  function afterPlan(date) {
    const d = startOfDay(date);
    return Math.floor((d - WEEK1) / 86400000) >= 56;
  }
  function prettyDate(d) {
    return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  }
  function jsDay(d) {
    return d.getDay();
  }
  function dayMeta(date) {
    return D.days[jsDay(date)];
  }
  function setsFor(ex, week, highStress, date) {
    const override = date ? getAdjust(iso(date)) : null;
    if (!ex) {
      if (override && override.sets) return override.sets;
      return highStress || week === 1 || week === 8 ? 2 : 3;
    }
    if (ex.optional) return 1;
    if (ex.log === "done") return 2;
    if (override && override.sets) return override.sets;
    if (highStress) return 2;
    if (week === 1 || week === 8) return 2;
    return 3;
  }
  function circuitRounds(week, highStress) {
    if (highStress || week === 1 || week === 8) return 3;
    return 4;
  }
  function rideDur(key, week) {
    return (D.rideDurations[key] && D.rideDurations[key][week]) || D.rideDurations[key][1];
  }
  function rideSecs(key, week) {
    return (D.rideTimerSeconds[key] && D.rideTimerSeconds[key][week]) || D.rideTimerSeconds[key][1];
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loadAuth() {
    try {
      const raw = JSON.parse(localStorage.getItem(AUTH) || "null");
      return raw && typeof raw === "object" ? raw : null;
    } catch (e) {
      return null;
    }
  }
  function saveAuth(rec) {
    try { localStorage.setItem(AUTH, JSON.stringify(rec)); } catch (e) {}
  }
  function clearAuth() {
    try { localStorage.removeItem(AUTH); } catch (e) {}
  }
  function isAuthed() {
    const a = loadAuth();
    return !!(a && a.access_token && a.user && a.user.id);
  }
  function allowedEmail() {
    return String((sbCfg() && sbCfg().allowedEmail) || "jon@pushdmg.com").toLowerCase();
  }
  function allowedEmails() {
    const cfg = sbCfg() || {};
    const list = [];
    const extra = cfg.allowedEmails;
    if (Array.isArray(extra)) {
      extra.forEach(function (item) {
        const email = cleanEmail(item);
        if (email && list.indexOf(email) === -1) list.push(email);
      });
    }
    const one = allowedEmail();
    if (one && list.indexOf(one) === -1) list.unshift(one);
    return list;
  }
  function cleanEmail(email) {
    return String(email || "")
      .replace(/[\u200B-\u200D\u2060\uFEFF\u00A0]/g, "")
      .trim()
      .toLowerCase();
  }
  function loginEmail(email) {
    return cleanEmail(email) || allowedEmail();
  }
  function emailAllowed(email) {
    return allowedEmails().indexOf(cleanEmail(email)) !== -1;
  }
  function sessionEmailOk(email) {
    const cleaned = cleanEmail(email);
    return !cleaned || emailAllowed(email);
  }
  function athleteId() {
    const a = loadAuth();
    return a && a.user && a.user.id ? a.user.id : null;
  }
  function authBase() {
    const c = sbCfg();
    return c && c.supabaseUrl ? c.supabaseUrl.replace(/\/$/, "") : "";
  }
  function stashAuth(data) {
    if (!data || !data.access_token || !data.user || !data.user.id) return false;
    saveAuth({
      access_token: data.access_token,
      refresh_token: data.refresh_token || "",
      user: { id: data.user.id, email: data.user.email || "" }
    });
    return true;
  }

  let storeMem = null;
  function emptyDay() {
    return {
      warmup: {},
      exercises: {},
      completed: false,
      started: false,
      status: null,
      reason: null,
      satChoice: null,
      highStress: false,
      startedLifts: {}
    };
  }
  function loadAll() {
    if (storeMem) return storeMem;
    try {
      const raw = JSON.parse(localStorage.getItem(STORE) || "{}");
      storeMem = raw && typeof raw === "object" ? raw : {};
    } catch (e) {
      storeMem = {};
    }
    return storeMem;
  }
  function saveAll(all) {
    storeMem = all && typeof all === "object" ? all : (storeMem || {});
    try { localStorage.setItem(STORE, JSON.stringify(storeMem)); } catch (e) {}
  }
  function dayLog(date) {
    const all = loadAll();
    const key = iso(date);
    if (!all[key]) {
      if (!isAuthed()) return emptyDay();
      all[key] = emptyDay();
      saveAll(all);
    }
    return all[key];
  }
  function patchDay(date, fn) {
    if (!isAuthed()) return;
    const all = loadAll();
    const key = iso(date);
    if (!all[key]) all[key] = emptyDay();
    fn(all[key]);
    saveAll(all);
  }
  function blankSet() {
    return { weight: "", reps: "", time: "", note: "", done: false, logged: false };
  }
  function isolateSet(row) {
    if (!row || typeof row !== "object") return blankSet();
    return {
      weight: row.weight == null ? "" : row.weight,
      reps: row.reps == null ? "" : row.reps,
      time: row.time == null ? "" : row.time,
      note: row.note == null ? "" : row.note,
      done: row.done === true,
      logged: row.logged === true
    };
  }
  function setHasValue(s) {
    if (!s) return false;
    return !!(String(s.weight || "").trim() || String(s.reps || "").trim() || String(s.time || "").trim());
  }
  function isBareDoneLift(exId) {
    const ex = D.exercises[liftBaseId(exId)];
    return !!(ex && ex.log === "done");
  }
  function isLoggedSet(s, exId) {
    if (!s || s.logged !== true) return false;
    if (setHasValue(s)) return true;
    return !!(exId && isBareDoneLift(exId) && s.done === true);
  }
  function helpSeedFor(exId) {
    const id = liftBaseId(exId);
    if (id !== "assisted-pullup" && id !== "assisted-dip") return "";
    const ex = D.exercises[id];
    let seed = id === "assisted-dip" ? 110 : 100;
    if (ex && ex.seedWeight != null) {
      const n = parseFloat(ex.seedWeight);
      if (isFinite(n) && n > 0) seed = n;
    }
    const top = ex && ex.stackTop != null ? parseFloat(ex.stackTop) : NaN;
    if (isFinite(top) && top > 0 && seed > top) seed = top;
    if (!(seed > 0)) seed = id === "assisted-dip" ? 110 : 100;
    return String(seed);
  }
  function defaultReps(ex) {
    return String((ex && ex.reps) || "").split(/[^\d]/)[0] || "8";
  }
  function lastSetValuesBefore(exId, date, setIdx) {
    const want = liftBaseId(exId);
    const out = { weight: "", reps: "", time: "" };
    function consider(row) {
      if (!row) return false;
      const w = String(row.weight || "").trim();
      const r = String(row.reps || "").trim();
      const t = String(row.time || "").trim();
      if (!w && !r && !t && !(row.logged === true && row.done === true)) return false;
      if (w) out.weight = w;
      if (r) out.reps = r;
      if (t) out.time = t;
      return !!(w || r || t);
    }
    const exs = (dayLog(date).exercises || {});
    const ids = Object.keys(exs);
    for (let k = 0; k < ids.length; k++) {
      if (!sameLift(ids[k], want)) continue;
      const sets = exs[ids[k]] || [];
      const last = sameLift(ids[k], exId) && ids[k] === exId ? setIdx : sets.length;
      for (let i = last - 1; i >= 0; i--) {
        if (consider(sets[i])) return out;
      }
    }
    const all = loadAll();
    const keys = Object.keys(all).sort().reverse();
    const except = iso(date);
    for (let i = 0; i < keys.length; i++) {
      if (except && keys[i] === except) continue;
      const session = all[keys[i]] && all[keys[i]].exercises;
      if (!session || typeof session !== "object") continue;
      const sids = Object.keys(session);
      for (let k = 0; k < sids.length; k++) {
        if (!sameLift(sids[k], want)) continue;
        const sets = session[sids[k]];
        if (!Array.isArray(sets)) continue;
        for (let s = sets.length - 1; s >= 0; s--) {
          if (consider(sets[s])) return out;
        }
      }
    }
    return out;
  }
  function shownSetValues(ex, key, date, idx, row) {
    const s = isolateSet(row);
    const last = lastSetValuesBefore(key, date, idx);
    const help = helpSeedFor(key);
    let weight = String(s.weight || "").trim();
    if (help) {
      if (!weight || weight === "0") {
        const prev = last.weight && last.weight !== "0" ? last.weight : "";
        weight = prev || help;
      }
    } else if (!weight) {
      weight = last.weight || "";
    }
    return {
      weight: weight,
      reps: String(s.reps || "").trim() || last.reps || defaultReps(ex),
      time: String(s.time || "").trim() || last.time || (ex && ex.hold ? String(ex.hold) : ""),
      note: s.note == null ? "" : String(s.note)
    };
  }
  function readStepperField(key, idx, field) {
    const el = $app && $app.querySelector(
      'input[data-act="log"][data-ex="' + key + '"][data-set="' + String(idx) + '"][data-field="' + field + '"]'
    );
    return el ? String(el.value) : null;
  }
  function pickScreenField(key, idx, field, fallback) {
    const raw = readStepperField(key, idx, field);
    if (raw != null) return String(raw).trim();
    return fallback == null ? "" : String(fallback);
  }
  function commitScreenSet(date, key, idx, ex) {
    const row = isolateSet(((dayLog(date).exercises || {})[key] || [])[idx]);
    const shown = shownSetValues(ex, key, date, idx, row);
    if (ex.log === "done") {
      writeSet(date, key, idx, "done", true);
      const after = isolateSet(((dayLog(date).exercises || {})[key] || [])[idx]);
      return after.done === true || after.logged === true;
    }
    const vals = {
      weight: pickScreenField(key, idx, "weight", shown.weight),
      reps: pickScreenField(key, idx, "reps", shown.reps),
      time: pickScreenField(key, idx, "time", shown.time),
      note: pickScreenField(key, idx, "note", shown.note)
    };
    if (ex.log === "weight-reps" || ex.log === "weight-time") {
      writeSet(date, key, idx, "weight", vals.weight);
    }
    if (ex.log === "weight-reps") {
      writeSet(date, key, idx, "reps", vals.reps);
    }
    if (ex.log === "time" || ex.log === "weight-time") {
      writeSet(date, key, idx, "time", vals.time);
    }
    if (vals.note) writeSet(date, key, idx, "note", vals.note);
    const saved = isolateSet(((dayLog(date).exercises || {})[key] || [])[idx]);
    if (!setHasValue(saved)) return false;
    writeSet(date, key, idx, "done", true);
    return isLoggedSet(isolateSet(((dayLog(date).exercises || {})[key] || [])[idx]), key);
  }
  function prefillSetFrom(date, key, fromIdx, toIdx) {
    const src = isolateSet(((dayLog(date).exercises || {})[key] || [])[fromIdx]);
    if (!setHasValue(src)) return;
    if (String(src.weight || "").trim()) writeSet(date, key, toIdx, "weight", String(src.weight));
    if (String(src.reps || "").trim()) writeSet(date, key, toIdx, "reps", String(src.reps));
    if (String(src.time || "").trim()) writeSet(date, key, toIdx, "time", String(src.time));
  }
  function isLiftStarted(log, key) {
    if (!log || !key) return false;
    const map = log.startedLifts;
    if (map && typeof map === "object" && map[key]) return true;
    const sets = (log.exercises && log.exercises[key]) || [];
    for (let i = 0; i < sets.length; i++) {
      if (isLoggedSet(sets[i])) return true;
      if (sets[i] && sets[i].done === true) return true;
    }
    return false;
  }
  function markLiftStarted(key) {
    if (!key) return;
    patchDay(state.selectedDate, function (log) {
      if (!log.startedLifts || typeof log.startedLifts !== "object") log.startedLifts = {};
      log.startedLifts[key] = true;
    });
    scheduleSync(state.selectedDate);
  }
  function liftBaseId(exId) {
    return String(exId || "").split("::")[0];
  }
  function sameLift(id, want) {
    const a = liftBaseId(id);
    const b = liftBaseId(want);
    return !!(a && b && a === b);
  }
  function lastWeight(exId, exceptDate) {
    const want = liftBaseId(exId);
    if (!want) return "";
    const all = loadAll();
    const keys = Object.keys(all).sort().reverse();
    for (let i = 0; i < keys.length; i++) {
      if (exceptDate && keys[i] === exceptDate) continue;
      const exs = all[keys[i]] && all[keys[i]].exercises;
      if (!exs || typeof exs !== "object") continue;
      const ids = Object.keys(exs);
      for (let k = 0; k < ids.length; k++) {
        if (!sameLift(ids[k], want)) continue;
        const sets = exs[ids[k]];
        if (!Array.isArray(sets)) continue;
        for (let s = sets.length - 1; s >= 0; s--) {
          if (sets[s] && String(sets[s].weight || "").trim()) return String(sets[s].weight);
        }
      }
    }
    return "";
  }
  function lastWeightBefore(exId, date, setIdx) {
    const want = liftBaseId(exId);
    const exs = (dayLog(date).exercises || {});
    const ids = Object.keys(exs);
    for (let k = 0; k < ids.length; k++) {
      if (!sameLift(ids[k], want)) continue;
      const sets = exs[ids[k]] || [];
      const last = sameLift(ids[k], exId) && ids[k] === exId ? setIdx : sets.length;
      for (let i = last - 1; i >= 0; i--) {
        if (sets[i] && String(sets[i].weight || "").trim()) return String(sets[i].weight);
      }
    }
    return lastWeight(exId, iso(date));
  }
  function ensureSets(date, exId, n) {
    let out = [];
    patchDay(date, function (log) {
      if (!Array.isArray(log.exercises[exId])) log.exercises[exId] = [];
      const src = log.exercises[exId];
      const next = [];
      const seen = [];
      const count = Math.max(n, src.length);
      for (let i = 0; i < count; i++) {
        const row = src[i];
        if (row && seen.indexOf(row) !== -1) {
          next.push(blankSet());
        } else {
          if (row) seen.push(row);
          next.push(isolateSet(row));
        }
      }
      while (next.length < n) next.push(blankSet());
      log.exercises[exId] = next;
      out = next;
    });
    return out;
  }
  function writeSet(date, exId, idx, field, value) {
    if (!isAuthed()) return;
    const i = Number(idx);
    if (!isFinite(i) || i < 0) return;
    const bareOk = isBareDoneLift(exId);
    patchDay(date, function (log) {
      if (!Array.isArray(log.exercises[exId])) log.exercises[exId] = [];
      while (log.exercises[exId].length <= i) {
        log.exercises[exId].push(blankSet());
      }
      const row = isolateSet(log.exercises[exId][i]);
      if (field === "done") {
        row.done = value === true || value === "true";
        row.logged = row.done && (setHasValue(row) || bareOk);
        if (!row.logged) row.done = false;
      } else if (field === "logged") {
        row.logged = (value === true || value === "true") && (setHasValue(row) || bareOk);
        if (!row.logged) row.done = false;
      } else row[field] = value;
      if (row.logged && !setHasValue(row) && !bareOk) {
        row.logged = false;
        row.done = false;
      }
      log.exercises[exId][i] = row;
    });
    scheduleSync(date);
  }

  function sanitizeUpcomingSet(exId, idx) {
    if (exId == null || !isFinite(Number(idx)) || Number(idx) < 0) return;
    const i = Number(idx);
    const baseId = String(exId).split("::")[0];
    const ex = D.exercises[baseId];
    if (ex && ex.log === "done") return;
    patchDay(state.selectedDate, function (log) {
      if (!Array.isArray(log.exercises[exId])) log.exercises[exId] = [];
      while (log.exercises[exId].length <= i) log.exercises[exId].push(blankSet());
      const row = isolateSet(log.exercises[exId][i]);
      if (!isLoggedSet(row, exId)) {
        row.done = false;
        row.logged = false;
      }
      log.exercises[exId][i] = row;
    });
  }

  function advanceCurrentSet() {
    state.currentSet += 1;
    const list = currentExerciseList();
    if (list[state.exIndex]) {
      sanitizeUpcomingSet(circuitKey(list[state.exIndex]), state.currentSet);
    }
  }

  function loadAdjust() {
    try {
      return JSON.parse(localStorage.getItem(ADJUST) || "{}");
    } catch (e) {
      return {};
    }
  }
  function saveAdjust(all) {
    try { localStorage.setItem(ADJUST, JSON.stringify(all)); } catch (e) {}
  }
  function getAdjust(key) {
    const all = loadAdjust();
    return all[key] || null;
  }
  function setAdjust(key, rec) {
    const all = loadAdjust();
    all[key] = rec;
    saveAdjust(all);
  }
  function sameAdjust(key, rec) {
    const cur = getAdjust(key);
    if (!cur) return false;
    return cur.sets === rec.sets && cur.modifier === rec.modifier && cur.reason === rec.reason;
  }

  function loadProposal() {
    try {
      const raw = JSON.parse(localStorage.getItem(PROPOSAL) || "null");
      return raw && typeof raw === "object" ? raw : null;
    } catch (e) {
      return null;
    }
  }
  function saveProposal(rec) {
    try { localStorage.setItem(PROPOSAL, JSON.stringify(rec)); } catch (e) {}
  }
  function clearProposal() {
    try { localStorage.removeItem(PROPOSAL); } catch (e) {}
  }
  function proposalDays(p) {
    if (!p || typeof p !== "object") return null;
    if (p.days && typeof p.days === "object" && !Array.isArray(p.days)) return p.days;
    if (p.adjustments && typeof p.adjustments === "object" && !Array.isArray(p.adjustments)) return p.adjustments;
    const out = {};
    Object.keys(p).forEach(function (k) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && p[k] && typeof p[k] === "object") out[k] = p[k];
    });
    return Object.keys(out).length ? out : null;
  }
  function proposalCopy(p) {
    const note = (p && p.note) || (p && p.reason ? ("Week change. " + p.reason) : "Week change.");
    const dock = (p && (p.label || p.dock)) || "Rest of the week";
    return { note: note, dock: dock };
  }
  function remainingLiftDaysThisWeek(fromDate) {
    const start = weekStartFor(fromDate);
    const all = loadAll();
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i);
      if (iso(d) <= iso(fromDate)) continue;
      if (dayMeta(d).type !== "lift") continue;
      const log = all[iso(d)];
      if (log && (log.completed || log.status === "incomplete" || log.status === "skipped")) continue;
      out.push(d);
    }
    return out;
  }
  function writeTooHardProposal(date) {
    const days = remainingLiftDaysThisWeek(date);
    if (!days.length) return;
    const recs = {};
    days.forEach(function (d) {
      recs[iso(d)] = { sets: 2, modifier: 0.75, reason: "Too hard · 2 sets" };
    });
    saveProposal({
      source: "too_hard",
      fromDate: iso(date),
      dayId: dayMeta(date).id,
      note: "Week change. Too hard · 2 sets on remaining lift days",
      label: "Rest of the week",
      days: recs
    });
  }
  function acceptProposal() {
    const p = loadProposal();
    const days = proposalDays(p);
    if (days) {
      const all = loadAdjust();
      Object.keys(days).forEach(function (key) {
        const rec = days[key];
        if (!rec || typeof rec !== "object") return;
        all[key] = rec;
        queueAdjustment("proposal", rec, key);
      });
      saveAdjust(all);
    }
    clearProposal();
  }

  function loadQueue() {
    try {
      const q = JSON.parse(localStorage.getItem(SBQ) || "[]");
      return Array.isArray(q) ? q : [];
    } catch (e) {
      return [];
    }
  }
  function saveQueue(q) {
    try { localStorage.setItem(SBQ, JSON.stringify(q)); } catch (e) {}
  }
  function enqueue(item) {
    const q = loadQueue();
    if (item.op === "sync") {
      const exists = q.some(function (x) { return x.op === "sync" && x.date === item.date; });
      if (exists) return;
    }
    q.push(item);
    saveQueue(q);
  }

  function sbCfg() {
    return window.BOTFIT_CFG || null;
  }
  function sbReady() {
    const c = sbCfg();
    return !!(c && c.supabaseUrl && c.supabaseKey && athleteId());
  }
  function sbHeaders(extra) {
    const c = sbCfg();
    const a = loadAuth();
    const token = a && a.access_token ? a.access_token : c.supabaseKey;
    const h = {
      apikey: c.supabaseKey,
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    };
    if (extra) {
      Object.keys(extra).forEach(function (k) { h[k] = extra[k]; });
    }
    return h;
  }
  function sbFetch(method, path, body, extra) {
    if (!sbReady()) return Promise.resolve({ ok: false, skipped: true, status: 0, json: null });
    const url = sbCfg().supabaseUrl.replace(/\/$/, "") + "/rest/v1" + path;
    const opts = { method: method, headers: sbHeaders(extra) };
    if (body !== undefined && method !== "GET" && method !== "HEAD") {
      opts.body = JSON.stringify(body);
    }
    return fetch(url, opts).then(function (res) {
      return res.text().then(function (text) {
        let json = null;
        if (text) {
          try { json = JSON.parse(text); } catch (e) { json = null; }
        }
        return { ok: res.ok, status: res.status, json: json };
      });
    }).catch(function () {
      return { ok: false, status: 0, json: null };
    });
  }
  function numOrNull(v) {
    if (v === "" || v == null) return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  function sessionTypeFor(date, log) {
    const meta = dayMeta(date);
    if (meta.type === "sat") {
      const choice = (log && log.satChoice) || state.satChoice;
      if (choice === "circuit") return "circuit";
      if (choice === "intervals") return "intervals";
      return "sat";
    }
    return meta.type;
  }
  function sessionStatus(log) {
    if (log.status === "incomplete" || log.status === "skipped") return log.status;
    if (log.completed) return "completed";
    if (log.started) return "started";
    return "planned";
  }
  function sessionPayload(date, log) {
    const adj = getAdjust(iso(date));
    return {
      athlete_id: athleteId(),
      session_date: iso(date),
      plan_week: weekNumber(date),
      session_type: sessionTypeFor(date, log),
      title: dayMeta(date).title,
      status: sessionStatus(log),
      rpe: log.rpe == null || log.rpe === "" ? null : Number(log.rpe),
      feel: log.feel || null,
      feel_note: log.feel_note || null,
      high_stress: !!log.highStress,
      sleep: log.sleep == null || log.sleep === "" ? null : Number(log.sleep),
      work_stress: log.stress == null || log.stress === "" ? null : Number(log.stress),
      smoked: log.smoked || null,
      volume_modifier: adj && adj.modifier != null ? adj.modifier : 1,
      started_at: log.started_at || null,
      completed_at: log.completed_at || null,
      source: "app"
    };
  }
  function setLogRows(sessionId, log) {
    const rows = [];
    const exs = log.exercises || {};
    Object.keys(exs).forEach(function (id) {
      const baseId = id.split("::")[0];
      const ex = D.exercises[baseId];
      (exs[id] || []).forEach(function (s, i) {
        if (!s) return;
        if (!s.weight && !s.reps && !s.time && !s.note && !s.done) return;
        rows.push({
          session_id: sessionId,
          exercise_id: id,
          exercise_name: ex ? ex.name : baseId,
          set_index: i + 1,
          weight: numOrNull(s.weight),
          reps: numOrNull(s.reps),
          hold_seconds: numOrNull(s.time),
          note: s.note || null,
          done: !!s.done
        });
      });
    });
    return rows;
  }
  function upsertSessionRow(payload) {
    return sbFetch("POST", "/sessions?on_conflict=athlete_id,session_date,session_type", payload, {
      Prefer: "resolution=merge-duplicates,return=representation"
    }).then(function (res) {
      if (res.ok && res.json && res.json[0] && res.json[0].id) return res.json[0];
      const q =
        "/sessions?athlete_id=eq." + encodeURIComponent(payload.athlete_id) +
        "&session_date=eq." + payload.session_date +
        "&session_type=eq." + encodeURIComponent(payload.session_type) +
        "&select=*&limit=1";
      return sbFetch("GET", q).then(function (found) {
        if (found.ok && found.json && found.json[0] && found.json[0].id) {
          return sbFetch("PATCH", "/sessions?id=eq." + found.json[0].id, payload, {
            Prefer: "return=representation"
          }).then(function (patched) {
            if (patched.ok && patched.json && patched.json[0]) return patched.json[0];
            return found.json[0];
          });
        }
        return sbFetch("POST", "/sessions", payload, {
          Prefer: "return=representation"
        }).then(function (created) {
          if (created.ok && created.json && created.json[0]) return created.json[0];
          throw new Error("session upsert failed");
        });
      });
    });
  }
  function replaceSetLogs(sessionId, log) {
    return sbFetch("DELETE", "/set_logs?session_id=eq." + sessionId).then(function (del) {
      if (!del.ok && !del.skipped) throw new Error("set_logs delete failed");
      const rows = setLogRows(sessionId, log);
      if (!rows.length) return true;
      return sbFetch("POST", "/set_logs", rows, { Prefer: "return=minimal" }).then(function (res) {
        if (!res.ok && !res.skipped) throw new Error("set_logs insert failed");
        return true;
      });
    });
  }
  function doSyncSession(date) {
    if (!sbReady()) return Promise.resolve();
    const log = dayLog(date);
    return upsertSessionRow(sessionPayload(date, log)).then(function (row) {
      if (!row || !row.id) throw new Error("no session id");
      return replaceSetLogs(row.id, log);
    });
  }
  function syncSession(date) {
    const d = date || state.selectedDate;
    doSyncSession(d).catch(function () {
      enqueue({ op: "sync", date: iso(d) });
    });
  }
  let syncTimer = null;
  function scheduleSync(date) {
    const d = date || state.selectedDate;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(function () {
      syncTimer = null;
      syncSession(d);
    }, 700);
  }
  function postAdjustmentRow(row) {
    return sbFetch("POST", "/adjustments", row, { Prefer: "return=minimal" }).then(function (res) {
      if (!res.ok && !res.skipped) throw new Error("adjustment failed");
    });
  }
  function queueAdjustment(source, rec, appliedOn) {
    if (!sbReady()) return;
    const row = {
      athlete_id: athleteId(),
      applied_on: appliedOn,
      source: source,
      reason: rec.reason || "",
      change: { sets: rec.sets, modifier: rec.modifier, reason: rec.reason }
    };
    postAdjustmentRow(row).catch(function () {
      enqueue({ op: "adjust", row: row });
    });
  }
  function flushQueue() {
    if (!sbReady()) return;
    const q = loadQueue();
    if (!q.length) return;
    saveQueue([]);
    function next(i) {
      if (i >= q.length) return;
      const item = q[i];
      const p = item.op === "adjust"
        ? postAdjustmentRow(item.row)
        : doSyncSession(parseISO(item.date));
      Promise.resolve(p).then(function () {
        next(i + 1);
      }).catch(function () {
        enqueue(item);
        next(i + 1);
      });
    }
    next(0);
  }
  function upcomingLiftDates(fromDate, count, includeFrom) {
    const out = [];
    let d = includeFrom ? startOfDay(fromDate) : addDays(startOfDay(fromDate), 1);
    let guard = 0;
    while (out.length < count && guard < 60) {
      if (dayMeta(d).type === "lift") out.push(new Date(d));
      d = addDays(d, 1);
      guard += 1;
    }
    return out;
  }
  function completedLiftLogs(upToDate) {
    const all = loadAll();
    const keys = Object.keys(all).sort().reverse();
    const upTo = iso(upToDate);
    const out = [];
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] > upTo) continue;
      const d = parseISO(keys[i]);
      if (dayMeta(d).type !== "lift") continue;
      if (!all[keys[i]] || !all[keys[i]].completed) continue;
      out.push({ date: d, log: all[keys[i]] });
      if (out.length >= 3) break;
    }
    return out;
  }
  function applyFeelAdjustments(date) {
    const log = dayLog(date);
    const rpe = log.rpe == null || log.rpe === "" ? null : Number(log.rpe);
    const hard = log.feel === "hard" || log.feel === "too_hard" || (rpe != null && rpe >= 8);
    if (hard) {
      const fromShort = dayMeta(date).short;
      upcomingLiftDates(date, 2, false).forEach(function (d) {
        const rec = {
          sets: 2,
          modifier: 0.75,
          reason: "Hard session on " + fromShort + " · 2 sets today"
        };
        if (sameAdjust(iso(d), rec)) return;
        setAdjust(iso(d), rec);
        queueAdjustment("rpe", rec, iso(d));
      });
      return;
    }
    const lifts = completedLiftLogs(date);
    const easyStreak = lifts.length >= 3 && lifts.slice(0, 3).every(function (x) {
      const r = x.log.rpe;
      const rpeOk = r == null || r === "" || Number(r) <= 5;
      return x.log.feel === "easy" && rpeOk;
    });
    if (!easyStreak) return;
    upcomingLiftDates(date, 2, false).forEach(function (d) {
      const w = weekNumber(d);
      const cur = getAdjust(iso(d));
      if (cur && cur.modifier != null && Number(cur.modifier) < 1) return;
      const rec = {
        modifier: 1.1,
        reason: "Last sessions felt easy · room to push"
      };
      if (w >= 2 && w <= 7) rec.sets = 3;
      if (sameAdjust(iso(d), rec)) return;
      setAdjust(iso(d), rec);
      queueAdjustment("rpe", rec, iso(d));
    });
  }
  function fetchExternalAndAdjust() {
    if (!sbReady()) return;
    const today = startOfDay(new Date());
    const from = iso(addDays(today, -1));
    const to = iso(today);
    const path =
      "/external_activities?athlete_id=eq." + encodeURIComponent(athleteId()) +
      "&activity_date=gte." + from + "&activity_date=lte." + to + "&select=*";
    sbFetch("GET", path).then(function (res) {
      if (!res.ok || !Array.isArray(res.json)) return;
      const hit = res.json.some(function (a) {
        return Number(a.load) >= 80 || Number(a.duration_sec) >= 7200;
      });
      if (!hit) return;
      const days = upcomingLiftDates(today, 1, true);
      if (!days.length) return;
      const rec = { sets: 2, modifier: 0.75, reason: "Heavy activity nearby · 2 sets today" };
      if (sameAdjust(iso(days[0]), rec)) return;
      setAdjust(iso(days[0]), rec);
      queueAdjustment("external", rec, iso(days[0]));
      if (state.view === "home") render();
    });
  }
  function shiftCalMonth(delta) {
    if (!state.calMonth) {
      state.calMonth = {
        y: state.selectedDate.getFullYear(),
        m: state.selectedDate.getMonth()
      };
    }
    state.calMonth.m += delta;
    if (state.calMonth.m < 0) {
      state.calMonth.m = 11;
      state.calMonth.y -= 1;
    } else if (state.calMonth.m > 11) {
      state.calMonth.m = 0;
      state.calMonth.y += 1;
    }
  }
  function monthHtml(selected) {
    const today = startOfDay(new Date());
    const all = loadAll();
    const y = state.calMonth && state.calMonth.y != null ? state.calMonth.y : selected.getFullYear();
    const m = state.calMonth && state.calMonth.m != null ? state.calMonth.m : selected.getMonth();
    const first = new Date(y, m, 1);
    const label = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const startPad = weekdayMon0(first);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    let html = '<div class="month">';
    html += '<div class="month-head">';
    html += '<button type="button" data-act="month-prev" aria-label="Previous month">‹</button>';
    html += "<span>" + esc(label) + "</span>";
    html += '<button type="button" data-act="month-next" aria-label="Next month">›</button>';
    html += "</div>";
    html += '<div class="month-dow">';
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(function (d) {
      html += "<span>" + d + "</span>";
    });
    html += "</div><div class=\"month-grid\">";
    for (let i = 0; i < startPad; i++) html += '<div class="month-empty"></div>';
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(y, m, day);
      const key = iso(d);
      const cls = [
        key === iso(selected) ? "is-on" : "",
        key === iso(today) ? "is-today" : "",
        all[key] && all[key].completed ? "is-done" : ""
      ].filter(Boolean).join(" ");
      html +=
        '<button type="button" data-act="pick-day" data-iso="' +
        key +
        '" class="' +
        cls +
        '">' +
        day +
        "</button>";
    }
    html += "</div></div>";
    return html;
  }

  function ensureAudio() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch (e) {}
  }
  function beep() {
    try {
      if (!audioCtx) ensureAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      function tone(t, freq, dur) {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = "sine";
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(t);
        o.stop(t + dur + 0.02);
      }
      tone(now, 880, 0.18);
      tone(now + 0.22, 880, 0.18);
      tone(now + 0.44, 1175, 0.28);
    } catch (e) {}
  }
  function buzz() {
    try { if (navigator.vibrate) navigator.vibrate([200, 80, 200, 80, 400]); } catch (e) {}
  }
  function alertDone() { beep(); buzz(); }

  function fmtClock(sec) {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ":" + String(s).padStart(2, "0");
  }

  function clearRest() {
    state.rest = null;
    if (restTimer) clearInterval(restTimer);
    restTimer = null;
  }
  function startRest(seconds, label, after) {
    clearRest();
    if (after === "next-set") advanceCurrentSet();
    render();
  }
  function tickRest() {
    clearRest();
  }
  function skipRest() {
    clearRest();
    renderOverlay();
    render();
  }

  function startHold(seconds) {
    state.hold = { ends: Date.now() + seconds * 1000, total: seconds };
    if (holdTimer) clearInterval(holdTimer);
    holdTimer = setInterval(function () {
      if (!state.hold) return;
      if (Date.now() >= state.hold.ends) {
        clearInterval(holdTimer);
        holdTimer = null;
        state.hold = null;
        alertDone();
        render();
        return;
      }
      render();
    }, 250);
    render();
  }
  function stopHold() {
    if (holdTimer) clearInterval(holdTimer);
    holdTimer = null;
    state.hold = null;
    render();
  }

  function mapFeel(feel) {
    const raw = String(feel || "").toLowerCase();
    if (raw === "easy") return "Easy";
    if (raw === "hard" || raw === "too_hard") return "Hard";
    return "Right";
  }
  function writeLastSession(date, status, reason) {
    if (!isAuthed()) return;
    const log = dayLog(date);
    const meta = dayMeta(date);
    const byName = {};
    const order = [];
    const exs = log.exercises || {};
    Object.keys(exs).forEach(function (id) {
      const baseId = id.split("::")[0];
      const ex = D.exercises[baseId];
      if (!ex) return;
      const sets = [];
      (exs[id] || []).forEach(function (s) {
        if (!s) return;
        if (!isLoggedSet(s) && !setHasValue(s) && s.done !== true) return;
        sets.push({
          weight: s.weight == null ? "" : s.weight,
          reps: s.reps == null ? "" : s.reps
        });
      });
      if (!sets.length) return;
      if (!byName[ex.name]) {
        byName[ex.name] = [];
        order.push(ex.name);
      }
      byName[ex.name] = byName[ex.name].concat(sets);
    });
    const ended = status === "incomplete" || status === "skipped";
    const rec = {
      date: iso(date),
      dayId: meta.id,
      status: status === "done" ? "done" : (ended ? status : (status === "in_progress" ? "in_progress" : status)),
      reason: reason || log.reason || null,
      feel: ended ? (log.feel ? mapFeel(log.feel) : null) : mapFeel(log.feel || "right"),
      rpe: log.rpe == null || log.rpe === "" ? null : Number(log.rpe),
      lifts: order.map(function (name) { return { name: name, sets: byName[name] }; })
    };
    if (log.smoked) rec.smoked = log.smoked;
    try { localStorage.setItem(LAST, JSON.stringify(rec)); } catch (e) {}
  }
  function dayClosed(log) {
    return !!(log && (log.completed || log.status === "incomplete" || log.status === "skipped"));
  }
  function dayPhase(date) {
    const log = dayLog(date);
    if (dayClosed(log)) return "done";
    if (log.started) return "resume";
    const exs = log.exercises || {};
    const ids = Object.keys(exs);
    for (let i = 0; i < ids.length; i++) {
      const sets = exs[ids[i]] || [];
      for (let s = 0; s < sets.length; s++) {
        if (isLoggedSet(sets[s]) || (sets[s] && sets[s].done === true)) return "resume";
      }
    }
    return "not_started";
  }
  function sessionInProgress(date) {
    const log = dayLog(date);
    if (dayClosed(log)) return false;
    if (log.started) return true;
    return dayPhase(date) === "resume";
  }
  function snapshotLeave() {
    return {
      view: state.view,
      exIndex: state.exIndex,
      currentSet: state.currentSet,
      round: state.round,
      satChoice: state.satChoice,
      interval: state.interval,
      rideStep: state.rideStep
    };
  }
  function restoreLeave(ret) {
    if (!ret) return;
    state.view = ret.view || "home";
    state.exIndex = ret.exIndex || 0;
    state.currentSet = ret.currentSet || 0;
    state.round = ret.round || 0;
    state.satChoice = ret.satChoice;
    state.interval = ret.interval || null;
    state.rideStep = ret.rideStep || 0;
  }
  function goHomeQuiet() {
    state.view = "home";
    state.leaveKind = null;
    state.leaveReturn = null;
    render();
  }
  function requestLeave() {
    const sessionViews = {
      warmup: true,
      exercise: true,
      ride: true,
      intervals: true,
      mobility: true,
      off: true
    };
    if (!sessionViews[state.view] || !sessionInProgress(state.selectedDate)) {
      goHomeQuiet();
      return;
    }
    state.leaveReturn = snapshotLeave();
    state.view = "save";
    render();
  }
  function discardDay(date) {
    if (!isAuthed()) return;
    const all = loadAll();
    all[iso(date)] = emptyDay();
    saveAll(all);
    state.satChoice = null;
    state.interval = null;
    scheduleSync(date);
  }
  function saveAndEnd() {
    if (!isAuthed()) return;
    patchDay(state.selectedDate, function (log) {
      log.started = true;
      log.completed = false;
      log.status = "incomplete";
      log.reason = null;
    });
    scheduleSync(state.selectedDate);
    state.leaveKind = "incomplete";
    state.view = "why";
    render();
  }
  function openWhySkipped() {
    if (!isAuthed()) return;
    state.leaveKind = "skipped";
    state.view = "why";
    render();
  }
  function chooseWhy(reason) {
    if (!isAuthed()) return;
    const status = state.leaveKind === "skipped" ? "skipped" : "incomplete";
    patchDay(state.selectedDate, function (log) {
      log.status = status;
      log.reason = reason;
      log.completed = false;
      if (status === "incomplete") log.started = true;
    });
    writeLastSession(state.selectedDate, status, reason);
    if (status === "incomplete" && reason === "too_hard") {
      writeTooHardProposal(state.selectedDate);
    }
    scheduleSync(state.selectedDate);
    state.leaveKind = null;
    state.leaveReturn = null;
    state.view = "home";
    render();
  }
  function checkRowHtml(it, on) {
    return (
      '<div class="check' + (on ? " is-on" : "") + '">' +
      '<button type="button" class="box" data-act="toggle-wu" data-id="' +
      esc(it.id) +
      '" aria-pressed="' + (on ? "true" : "false") +
      '" aria-label="' + esc(it.title) + '">' +
      (on ? "✓" : "") +
      "</button><div><b>" + esc(it.title) + "</b><p>" + esc(it.detail) + "</p></div></div>"
    );
  }
  function liftHasLog(log, exId) {
    const sets = (log.exercises && log.exercises[exId]) || [];
    for (let i = 0; i < sets.length; i++) {
      if (isLoggedSet(sets[i]) || (sets[i] && sets[i].done === true)) return true;
    }
    return false;
  }
  function firstOpenSet(log, exId, nSets) {
    const sets = (log.exercises && log.exercises[exId]) || [];
    for (let i = 0; i < nSets; i++) {
      const s = sets[i];
      if (!(isLoggedSet(s) || (s && s.done === true))) return i;
    }
    return -1;
  }
  function findResumePoint(date) {
    const meta = dayMeta(date);
    const log = dayLog(date);
    const week = weekNumber(date);
    if (meta.type === "ride") return { view: "ride", exIndex: 0, currentSet: 0, round: 0 };
    if (meta.type === "off") return { view: "mobility", exIndex: 0, currentSet: 0, round: 0 };
    if (meta.type === "sat") {
      const choice = log.satChoice || state.satChoice;
      if (choice === "ride") return { view: "ride", exIndex: 0, currentSet: 0, round: 0 };
      if (choice === "intervals") return { view: "intervals", exIndex: 0, currentSet: 0, round: 0 };
      const list = meta.circuit || [];
      const rounds = circuitRounds(week, log.highStress);
      let any = false;
      let resume = null;
      for (let r = 0; r < rounds; r++) {
        for (let i = 0; i < list.length; i++) {
          const key = list[i] + "::r" + r;
          if (liftHasLog(log, key)) any = true;
          else if (!resume) resume = { view: "exercise", exIndex: i, currentSet: 0, round: r };
        }
      }
      if (!any) return { view: "exercise", exIndex: 0, currentSet: 0, round: 0 };
      if (!resume) return { view: "done", allDone: true, exIndex: 0, currentSet: 0, round: 0 };
      return resume;
    }
    const list = meta.exercises || [];
    let any = false;
    let lastLogged = -1;
    for (let i = 0; i < list.length; i++) {
      if (liftHasLog(log, list[i])) {
        any = true;
        lastLogged = i;
      }
    }
    if (!any) return { view: "warmup", exIndex: 0, currentSet: 0, round: 0 };
    for (let i = lastLogged; i < list.length; i++) {
      const ex = D.exercises[list[i]];
      const nSets = setsFor(ex, week, log.highStress, date);
      const open = firstOpenSet(log, list[i], nSets);
      if (open >= 0) {
        if (ex && ex.optional && !liftHasLog(log, list[i]) && i > lastLogged) continue;
        return { view: "exercise", exIndex: i, currentSet: open, round: 0 };
      }
    }
    return { view: "done", allDone: true, exIndex: 0, currentSet: 0, round: 0 };
  }
  function upsertAthlete(user) {
    if (!user || !user.id) return Promise.resolve();
    return sbFetch("POST", "/athletes?on_conflict=id", {
      id: user.id,
      name: "Jon Mcgee"
    }, { Prefer: "resolution=merge-duplicates,return=minimal" });
  }
  function afterAuth(data) {
    if (!stashAuth(data)) return false;
    authErr = "";
    state.view = "home";
    upsertAthlete(data.user);
    flushQueue();
    render();
    return true;
  }
  function readAuthForm() {
    const emailEl = document.getElementById("auth-email");
    const passEl = document.getElementById("auth-pass");
    return {
      email: loginEmail(emailEl ? emailEl.value : ""),
      password: passEl ? String(passEl.value || "") : ""
    };
  }
  function authRequest(path, body, extraHeaders) {
    const c = sbCfg();
    if (!c || !c.supabaseUrl || !c.supabaseKey) {
      return Promise.resolve({ ok: false, json: { msg: "Missing config" } });
    }
    const headers = {
      apikey: c.supabaseKey,
      "Content-Type": "application/json"
    };
    if (extraHeaders) {
      Object.keys(extraHeaders).forEach(function (k) { headers[k] = extraHeaders[k]; });
    }
    return fetch(authBase() + "/auth/v1" + path, {
      method: "POST",
      headers: headers,
      body: body ? JSON.stringify(body) : undefined
    }).then(function (res) {
      return res.text().then(function (text) {
        let json = null;
        if (text) {
          try { json = JSON.parse(text); } catch (e) { json = null; }
        }
        return { ok: res.ok, json: json || {} };
      });
    }).catch(function () {
      return { ok: false, json: {} };
    });
  }
  function authFailMessage(data, fallback) {
    const d = data || {};
    const msg = d.msg || d.error_description || d.error || "";
    const code = d.error_code || "";
    if (msg && code && String(msg).indexOf(code) === -1) return msg + " (" + code + ")";
    if (msg) return msg;
    if (code) return code;
    return fallback;
  }
  function doSignIn() {
    const form = readAuthForm();
    if (!emailAllowed(form.email)) {
      authErr = "This login is for Jon only.";
      renderLogin();
      return;
    }
    if (!form.password) {
      authErr = "Enter a password.";
      renderLogin();
      return;
    }
    authRequest("/token?grant_type=password", { email: form.email, password: form.password }).then(function (res) {
      const data = res.json || {};
      if (data.access_token && data.user && data.user.id) {
        if (!sessionEmailOk(data.user.email)) {
          authErr = "This login is for Jon only.";
          clearAuth();
          renderLogin();
          return;
        }
        afterAuth(data);
        return;
      }
      authErr = authFailMessage(data, "Could not sign in.");
      renderLogin();
    });
  }
  function doSignUp() {
    const form = readAuthForm();
    if (!emailAllowed(form.email)) {
      authErr = "This login is for Jon only.";
      renderLogin();
      return;
    }
    if (!form.password) {
      authErr = "Enter a password.";
      renderLogin();
      return;
    }
    authRequest("/signup", { email: form.email, password: form.password }).then(function (res) {
      const data = res.json || {};
      if (data.access_token && data.user && data.user.id) {
        if (!sessionEmailOk(data.user.email)) {
          authErr = "This login is for Jon only.";
          clearAuth();
          renderLogin();
          return;
        }
        afterAuth(data);
        return;
      }
      if (res.ok) {
        return authRequest("/token?grant_type=password", { email: form.email, password: form.password }).then(function (tokenRes) {
          const tokenData = tokenRes.json || {};
          if (tokenData.access_token && tokenData.user && tokenData.user.id) {
            if (!sessionEmailOk(tokenData.user.email)) {
              authErr = "This login is for Jon only.";
              clearAuth();
              renderLogin();
              return;
            }
            afterAuth(tokenData);
            return;
          }
          authErr = authFailMessage(tokenData, "Could not sign in.");
          renderLogin();
        });
      }
      authErr = authFailMessage(data, "Could not create account.");
      renderLogin();
    });
  }
  function doSignOut() {
    const a = loadAuth();
    const headers = {};
    if (a && a.access_token) headers.Authorization = "Bearer " + a.access_token;
    authRequest("/logout", {}, headers).catch(function () {});
    clearAuth();
    authErr = "";
    state.view = "home";
    render();
  }
  function renderLogin() {
    setDock(false);
    const form = {
      email: loginEmail((document.getElementById("auth-email") || {}).value || ""),
      password: (document.getElementById("auth-pass") || {}).value || ""
    };
    let html = '<div class="login">';
    html += '<div class="brand"><img src="icon-192.png" alt="" onerror="this.onerror=null;this.src=\'icon.svg\'">BotFit</div>';
    html += '<p class="hero-kicker">Jon\'s gym</p>';
    html += "<h1>Sign in</h1>";
    html += '<p class="lede">Email and password. Then Home — no settings maze.</p>';
    if (authErr) html += '<p class="auth-err">' + esc(authErr) + "</p>";
    html += '<label class="field"><span>Email</span><input type="email" id="auth-email" autocomplete="username" placeholder="jon@pushdmg.com" value="' + esc(form.email) + '"></label>';
    html += '<label class="field"><span>Password</span><input type="password" id="auth-pass" autocomplete="current-password" value="' + esc(form.password) + '"></label>';
    html += '<div class="actions">';
    html += '<button type="button" class="btn btn-primary" data-act="signin">Sign in</button>';
    html += '<button type="button" class="btn btn-ghost" data-act="signup">Create account</button>';
    html += "</div></div>";
    $app.innerHTML = html;
  }
  function toggleWarmup(id) {
    if (!id || !isAuthed()) return;
    const now = Date.now();
    if (now - wuTapAt < 350) return;
    wuTapAt = now;
    patchDay(state.selectedDate, function (log) { log.warmup[id] = !log.warmup[id]; });
    render();
  }

  function topbar(week, home) {
    return (
      '<div class="topbar">' +
      '<div class="brand"><img src="icon-192.png" alt="" onerror="this.onerror=null;this.src=\'icon.svg\'">BotFit</div>' +
      '<div class="topbar-end">' +
      '<div class="week-pill">Week ' + week + (week === 8 ? " · deload" : week === 1 ? " · learn the room" : "") + "</div>" +
      (home ? '<button type="button" class="signout" data-act="signout">Out</button>' : "") +
      "</div></div>"
    );
  }

  function pickerHtml(selected) {
    const start = weekStartFor(selected);
    const today = startOfDay(new Date());
    const all = loadAll();
    let html = '<div class="picker">';
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i);
      const meta = D.days[d.getDay()];
      const cls = [
        iso(d) === iso(selected) ? "is-on" : "",
        iso(d) === iso(today) ? "is-today" : "",
        all[iso(d)] && all[iso(d)].completed ? "is-done" : ""
      ].filter(Boolean).join(" ");
      html +=
        '<button type="button" data-act="pick-day" data-iso="' +
        iso(d) +
        '" class="' +
        cls +
        '">' +
        meta.short +
        "</button>";
    }
    return html + "</div>";
  }

  function stepperHtml(exId, setIdx, field, value, step, placeholder) {
    return (
      '<div class="stepper">' +
      '<button type="button" data-act="step" data-ex="' + exId + '" data-set="' + setIdx +
      '" data-field="' + field + '" data-delta="-' + step + '" aria-label="decrease">−</button>' +
      '<input inputmode="decimal" size="4" data-act="log" data-ex="' + exId + '" data-set="' + setIdx +
      '" data-field="' + field + '" value="' + esc(value) + '" placeholder="' + esc(placeholder || "") + '">' +
      '<button type="button" data-act="step" data-ex="' + exId + '" data-set="' + setIdx +
      '" data-field="' + field + '" data-delta="' + step + '" aria-label="increase">+</button>' +
      "</div>"
    );
  }

  function renderHome() {
    const date = state.selectedDate;
    const week = weekNumber(date);
    const meta = dayMeta(date);
    const log = dayLog(date);
    const today = startOfDay(new Date());
    const isToday = iso(date) === iso(today);
    const intensity = D.intensity[week];
    const nSets = setsFor(null, week, log.highStress, date);
    const phase = dayPhase(date);

    let html = '<div class="ex-main">';
    html += topbar(week, true);
    html += '<p class="date-line">' + esc(prettyDate(date)) + (isToday ? " · today" : "") + "</p>";
    if (date < WEEK1) {
      html += '<p class="hero-kicker">Week 1 starts Mon Aug 17</p>';
    } else if (afterPlan(date)) {
      html += '<p class="hero-kicker">Plan complete — week 8 volumes still on</p>';
    } else {
      html += '<p class="hero-kicker">' + (isToday ? "Today" : "Selected") + "</p>";
    }
    html += "<h1>" + esc(meta.title) + "</h1>";
    html += '<p class="lede">' + esc(meta.blurb) + "</p>";
    html += pickerHtml(date);
    html +=
      '<button type="button" class="cal-toggle" data-act="toggle-cal">' +
      (state.showCal ? "Hide calendar" : "Show calendar") +
      "</button>";
    if (state.showCal) html += monthHtml(date);
    const adj = getAdjust(iso(date));
    if (meta.type === "lift") {
      html += '<div class="note"><strong>This week.</strong> ' + nSets + " sets per exercise. " + esc(intensity);
      if (adj && adj.reason) html += " " + esc(adj.reason);
      html += "</div>";
    }

    if (meta.type === "lift" && week !== 1) {
      html +=
        '<button type="button" class="toggle' +
        (log.highStress ? " is-on" : "") +
        '" data-act="toggle-stress"><span class="box">' +
        (log.highStress ? "✓" : "") +
        "</span><span>Rough day (2 sets)<br><span class=\"hint\">Bad sleep or a brutal workday. Keep the session, cut the volume.</span></span></button>";
    }

    if (meta.type === "lift") {
      const n = meta.exercises.length;
      const firstByDay = {
        mon: "Hammer Strength chest press",
        tue: "assisted pull-up",
        thu: "goblet",
        fri: "lat pulldown"
      };
      const firstLift = firstByDay[meta.id] ||
        (D.exercises[meta.exercises[0]] && D.exercises[meta.exercises[0]].name) ||
        "the first lift";
      const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][jsDay(date)];
      html +=
        '<div class="card"><b>' +
        n +
        " exercises · " + nSets + " sets</b><p>Warm-up first, then one lift per screen. " +
        esc(firstLift) + " is first on " + weekday + ". Log weight and reps as you go.</p></div>";
    }

    if (log.completed) {
      html += '<p class="hint">Logged for ' + esc(iso(date)) + ". Green dot on the day picker.</p>";
    } else if (log.status === "incomplete") {
      html += '<p class="hint">Done · incomplete</p>';
    } else if (log.status === "skipped") {
      html += '<p class="hint">Done · skipped</p>';
    }
    html += '<p class="install">Add to Home Screen from the share menu.</p>';
    html += "</div>";

    const proposal = loadProposal();
    html += '<div class="pin-log">';
    if (proposal) {
      const copy = proposalCopy(proposal);
      html += '<div class="note"><strong>Week change.</strong> ' + esc(String(copy.note).replace(/^Week change\.\s*/i, "")) + "</div>";
      html += '<p class="hint">' + esc(copy.dock) + "</p>";
      html += '<div class="actions">';
      html += '<button type="button" class="btn btn-primary" data-act="accept-week">Accept changes</button>';
      html += '<button type="button" class="btn btn-ghost" data-act="keep-week">Keep schedule</button>';
      html += "</div>";
    }
    if (meta.type === "sat" && phase === "not_started") {
      html += '<p class="hint">Pick one.</p>';
      html +=
        '<button type="button" class="choice" data-act="start-sat" data-choice="ride"><b>Easy outdoor ride</b><span>' +
        esc(rideDur("sat", week)) +
        " · talk pace. Or stay on a spin bike if weather sucks.</span></button>";
      html +=
        '<button type="button" class="choice" data-act="start-sat" data-choice="circuit"><b>Full-body circuit</b><span>' +
        circuitRounds(week, log.highStress) +
        " rounds: KB deadlift, DB press, cable row, goblet, farmer carry.</span></button>";
      if (week >= 5 && week <= 7) {
        html +=
          '<button type="button" class="choice" data-act="start-sat" data-choice="intervals"><b>Short intervals</b><span>24 min on a spin bike: 6 easy, 8 × 30s hard / 90s easy, 2 cooldown. Only if Thursday legs recovered.</span></button>';
      }
    } else {
      let label = "Start session";
      if (phase === "done") label = "View recap";
      else if (phase === "resume") label = "Resume session";
      else if (meta.type === "off") label = "Start recovery";
      html += '<div class="actions"><button type="button" class="btn btn-primary" data-act="start">' + label + "</button></div>";
    }
    if (phase !== "done") {
      html += '<div class="actions"><button type="button" class="btn btn-danger" data-act="skip-day">Skip</button></div>';
    }
    html += "</div>";
    $app.innerHTML = html;
  }

  function renderWarmup() {
    const date = state.selectedDate;
    const week = weekNumber(date);
    const log = dayLog(date);
    const items = D.warmup;
    let done = 0;
    items.forEach(function (it) { if (log.warmup[it.id]) done++; });
    let html = '<div class="ex-main">';
    html += topbar(week);
    html +=
      '<div class="navrow"><button type="button" class="back" data-act="leave">← Home</button><div class="progress">WARM-UP · ' +
      done + "/" + items.length + "</div></div>";
    html += "<h2>Warm-up</h2><p class=\"lede\">Check them off as you go. You can hit Next without finishing every box.</p>";
    items.forEach(function (it) {
      const on = !!log.warmup[it.id];
      html += checkRowHtml(it, on);
      if (it.id === "spin") {
        if (state.hold) {
          const left = Math.max(0, (state.hold.ends - Date.now()) / 1000);
          html += '<div class="timer-face"><div class="clock">' + fmtClock(left) + '</div><div class="sub">Easy spin</div></div>';
          html += '<div class="actions"><button type="button" class="btn btn-ghost" data-act="stop-hold">Stop</button></div>';
        } else {
          html += '<div class="actions"><button type="button" class="btn btn-ghost" data-act="start-hold" data-sec="300">Start 5:00 spin</button></div>';
        }
      }
    });
    html += "</div>";
    html +=
      '<div class="pin-log"><div class="actions"><button type="button" class="btn btn-primary" data-act="wu-continue">Next — start lifts</button>' +
      '<button type="button" class="btn btn-danger" data-act="wu-continue">Skip remaining</button></div></div>';
    $app.innerHTML = html;
  }

  function currentExerciseList() {
    const meta = dayMeta(state.selectedDate);
    if (meta.type === "sat" && state.satChoice === "circuit") return meta.circuit;
    return meta.exercises || [];
  }


  function renderExercise() {
    const date = state.selectedDate;
    const week = weekNumber(date);
    const log = dayLog(date);
    const list = currentExerciseList();
    const isCircuit = dayMeta(date).type === "sat" && state.satChoice === "circuit";
    if (state.exIndex >= list.length) {
      if (isCircuit) {
        const rounds = circuitRounds(week, log.highStress);
        if (state.round + 1 < rounds) {
          state.round += 1;
          state.exIndex = 0;
          state.currentSet = 0;
        } else {
          finishSession();
          return;
        }
      } else {
        finishSession();
        return;
      }
    }
    const exId = list[state.exIndex];
    const ex = D.exercises[exId];
    const nSets = isCircuit ? 1 : setsFor(ex, week, log.highStress, date);
    const sets = ensureSets(date, circuitKey(exId), nSets);
    if (state.currentSet >= nSets) state.currentSet = nSets - 1;
    const key = circuitKey(exId);

    let html = '<div class="ex-main">';
    html += topbar(week);
    const stepLabel = isCircuit
      ? "R" + (state.round + 1) + " · " + (state.exIndex + 1) + "/" + list.length
      : (state.exIndex + 1) + " of " + list.length;
    const canBack = state.exIndex > 0 || (isCircuit && state.round > 0) || dayMeta(date).type === "lift";
    const canNext = state.exIndex < list.length - 1 || (isCircuit && state.round + 1 < circuitRounds(week, log.highStress));
    html +=
      '<div class="navrow"><button type="button" class="back" data-act="leave">← Home</button><div class="nav-lifts">' +
      '<button type="button" class="back" data-act="ex-back"' + (canBack ? "" : " disabled") + ">← Back</button>" +
      '<button type="button" class="back" data-act="ex-next"' + (canNext ? "" : " disabled") + ">Next</button>" +
      '</div><div class="progress">' +
      stepLabel + "</div></div>";

    if (isCircuit) {
      const rounds = circuitRounds(week, log.highStress);
      html += '<div class="round-bar">';
      for (let r = 0; r < rounds; r++) {
        html += '<div class="round-dot' + (r < state.round ? " is-done" : r === state.round ? " is-on" : "") + '"></div>';
      }
      html += "</div>";
      html += '<p class="hero-kicker">Circuit · round ' + (state.round + 1) + " of " + rounds + "</p>";
    }

    html += "<h2>" + esc(ex.name) + "</h2>";
    var started = isLiftStarted(log, key);
    var cueList = (ex.teachCues && ex.teachCues.length) ? ex.teachCues : (ex.cues || []).slice(0, 3);
    if (!started) {
      html += '<div class="where"><span class="pin">USE</span><div>' + esc(ex.where) + "</div></div>";
      html += "<h3>Setup</h3><div class=\"card step-copy\"><p>" + esc(ex.setup) + "</p></div>";
      html += "<h3>Form cues</h3><ul class=\"cues\">";
      cueList.forEach(function (c) { html += "<li>" + esc(c) + "</li>"; });
      html += "</ul>";
      if (ex.watchUrl) {
        html += '<button type="button" class="btn btn-ghost watch-lift" data-act="watch-lift">Watch</button>';
      }
      html += "</div>";
      html +=
        '<div class="pin-log"><div class="actions"><button type="button" class="btn btn-primary" data-act="start-lift">Start</button></div></div>';
      $app.innerHTML = html;
      return;
    }

    let compact = "";
    for (let i = 0; i < nSets; i++) {
      if (i === state.currentSet) continue;
      const hist = sets[i] || {};
      if (!isLoggedSet(hist, key)) continue;
      const bits = [];
      if (hist.weight) bits.push(hist.weight);
      if (hist.reps) bits.push(hist.reps + (ex.perSide ? "/side" : "r"));
      if (hist.time) bits.push(hist.time + "s");
      if (hist.note) bits.push(hist.note);
      compact +=
        '<div class="logged-line" data-act="focus-set" data-set="' + i + '">Set ' +
        (i + 1) + (bits.length ? " · " + esc(bits.join(" · ")) : "") + " · LOGGED</div>";
    }
    if (compact) html += '<div class="logged-hist">' + compact + "</div>";
    html += "</div>";
    html += '<ul class="cues cues-live">';
    cueList.slice(0, 3).forEach(function (c) { html += "<li>" + esc(c) + "</li>"; });
    html += "</ul>";

    const i = state.currentSet;
    sanitizeUpcomingSet(key, i);
    const s = isolateSet(((dayLog(date).exercises || {})[key] || sets)[i]);
    const shown = shownSetValues(ex, key, date, i, s);
    html += '<div class="pin-log">';
    html += '<div class="set is-current" data-act="focus-set" data-set="' + i + '">';
    html += '<div class="set-head"><span>Set ' + (i + 1) + " · now</span></div>";
    if (ex.log !== "done") {
      html += '<div class="set-grid">';
      if (ex.log === "weight-reps" || ex.log === "weight-time") {
        html += '<label class="field"><span>' + esc(ex.weightLabel || "Weight (lb)") + "</span>" +
          stepperHtml(key, i, "weight", shown.weight, 5, shown.weight || helpSeedFor(key) || "") + "</label>";
      }
      if (ex.log === "weight-reps") {
        html += '<label class="field field-reps"><span>Reps' + (ex.perSide ? " / side" : "") + "</span>" +
          stepperHtml(key, i, "reps", shown.reps, 1, shown.reps || defaultReps(ex)) + "</label>";
      }
      if (ex.log === "time" || ex.log === "weight-time") {
        html += '<label class="field"><span>Seconds</span>' +
          stepperHtml(key, i, "time", shown.time, 5, shown.time || String(ex.hold || 30)) + "</label>";
      }
      html += "</div>";
      if (ex.note) {
        html +=
          '<label class="field" style="margin-top:8px"><span>What you used</span><input type="text" data-act="log" data-ex="' +
          key + '" data-set="' + i + '" data-field="note" value="' + esc(shown.note || "") +
          '" placeholder="machine / lunges / skip"></label>';
      }
    }
    html += "</div>";
    if (state.logHint) html += '<p class="hint log-hint">' + esc(state.logHint) + "</p>";

    html += '<div class="actions">' + liftDockPrimaryHtml({
      lastSet: state.currentSet >= nSets - 1,
      currentLogged: isLoggedSet(s, key),
      nextLabel: liftDockNextLabel(isCircuit, list.length, week, log)
    }) + "</div></div>";
    $app.innerHTML = html;
  }

  function liftDockNextLabel(isCircuit, listLen, week, log) {
    if (state.exIndex !== listLen - 1) return "Next exercise";
    if (isCircuit && state.round + 1 < circuitRounds(week, log.highStress)) return "Next round";
    return "Finish workout";
  }

  function liftDockPrimaryHtml(opts) {
    if (opts.lastSet && opts.currentLogged) {
      return '<button type="button" class="btn btn-primary" data-act="next-ex">' + opts.nextLabel + "</button>";
    }
    return '<button type="button" class="btn btn-primary" data-act="log-set">Log set</button>';
  }

  function circuitKey(exId) {
    if (dayMeta(state.selectedDate).type === "sat" && state.satChoice === "circuit") {
      return exId + "::r" + state.round;
    }
    return exId;
  }

  function renderRide() {
    const date = state.selectedDate;
    const week = weekNumber(date);
    const meta = dayMeta(date);
    const kind = meta.type === "sat" ? "sat" : "wed";
    const dur = rideDur(kind, week);
    const secs = rideSecs(kind, week);
    let html = topbar(week);
    html +=
      '<div class="navrow"><button type="button" class="back" data-act="leave">← Home</button><div class="progress">RIDE</div></div>';
    html += '<p class="hero-kicker">Talk pace</p>';
    html += "<h2>" + (kind === "wed" ? "Zone 2 bike" : "Easy ride") + "</h2>";
    html += '<div class="where"><span class="pin">USE</span><div>Spin bikes — or take it outside.</div></div>';
    html += '<div class="card step-copy"><p>Ride <b>' + esc(dur) + "</b>. You should be able to speak in short sentences. That is the whole instruction.</p></div>";
    if (state.hold) {
      const left = Math.max(0, (state.hold.ends - Date.now()) / 1000);
      html += '<div class="timer-face"><div class="clock">' + fmtClock(left) + '</div><div class="sub">Ride</div></div>';
      html += '<div class="actions row"><button type="button" class="btn btn-ghost" data-act="stop-hold">Pause</button>' +
        '<button type="button" class="btn btn-ghost" data-act="add-hold" data-sec="300">+5 min</button></div>';
    } else {
      html += '<div class="actions"><button type="button" class="btn btn-primary" data-act="start-hold" data-sec="' +
        secs + '">Start ride · ' + fmtClock(secs) + "</button></div>";
    }
    html +=
      '<div class="actions"><button type="button" class="btn btn-primary" data-act="ride-done">' +
      (kind === "wed" ? "Done — mobility" : "Finish") +
      '</button><button type="button" class="btn btn-danger" data-act="ride-done">Skip timer</button></div>';
    $app.innerHTML = html;
  }

  function mobilityItems(kind) {
    if (kind === "wed") return D.mobility.filter(function (it) { return it.id !== "walk"; });
    return D.mobility;
  }

  function renderMobility() {
    const date = state.selectedDate;
    const week = weekNumber(date);
    const log = dayLog(date);
    const kind = dayMeta(date).type === "off" ? "sun" : "wed";
    const items = mobilityItems(kind);
    let html = '<div class="ex-main">';
    html += topbar(week);
    html +=
      '<div class="navrow"><button type="button" class="back" data-act="leave">← Home</button><div class="progress">MOBILITY</div></div>';
    html += "<h2>" + (kind === "sun" ? "Off — walk or mobility" : "Short mobility") + "</h2>";
    html += '<p class="lede">Optional. Check them off or skip to done.</p>';
    items.forEach(function (it) {
      const on = !!log.warmup[it.id];
      html += checkRowHtml(it, on);
      if (it.timer) {
        html += '<div class="actions"><button type="button" class="btn btn-ghost" data-act="start-hold" data-sec="' +
          it.timer + '">Start ' + it.timer + "s</button></div>";
      }
    });
    if (state.hold) {
      const left = Math.max(0, (state.hold.ends - Date.now()) / 1000);
      html += '<div class="timer-face"><div class="clock">' + fmtClock(left) + '</div><div class="sub">Hold</div></div>';
      html += '<div class="actions"><button type="button" class="btn btn-ghost" data-act="stop-hold">Stop</button></div>';
    }
    html += "</div>";
    html += '<div class="pin-log"><div class="actions"><button type="button" class="btn btn-primary" data-act="finish">Done</button></div></div>';
    $app.innerHTML = html;
  }

  function renderIntervals() {
    const date = state.selectedDate;
    const week = weekNumber(date);
    if (!state.interval) {
      state.interval = { i: 0, remaining: INTERVALS[0].sec, running: false, done: false };
    }
    const step = INTERVALS[state.interval.i];
    let html = topbar(week);
    html +=
      '<div class="navrow"><button type="button" class="back" data-act="leave">← Home</button><div class="progress">' +
      (state.interval.i + 1) + " / " + INTERVALS.length + "</div></div>";
    html += '<p class="hero-kicker">Spin bike</p>';
    html += "<h2>" + esc(step.label) + "</h2>";
    html += '<div class="where"><span class="pin">USE</span><div>Spin bikes</div></div>';
    html += '<div class="timer-face"><div class="clock' + (state.interval.done ? " zero" : "") + '">' +
      (state.interval.done && state.interval.i >= INTERVALS.length - 1 ? "DONE" : fmtClock(state.interval.remaining)) +
      '</div><div class="sub">' + (step.hard ? "Hard" : "Easy") + "</div></div>";
    html += '<div class="actions">';
    if (!state.interval.running && !state.interval.done) {
      html += '<button type="button" class="btn btn-primary" data-act="int-start">Start</button>';
    } else if (state.interval.running) {
      html += '<button type="button" class="btn btn-ghost" data-act="int-pause">Pause</button>';
    } else if (state.interval.i < INTERVALS.length - 1) {
      html += '<button type="button" class="btn btn-primary" data-act="int-next">Next</button>';
    }
    html += '<button type="button" class="btn btn-ghost" data-act="int-skip">Skip step</button>';
    html += '<button type="button" class="btn btn-primary" data-act="finish">Finish</button>';
    html += "</div>";
    $app.innerHTML = html;
  }

  function recapRows(log) {
    const rows = [];
    const exs = log.exercises || {};
    Object.keys(exs).forEach(function (id) {
      const baseId = id.split("::")[0];
      const ex = D.exercises[baseId];
      if (!ex) return;
      const bits = (exs[id] || [])
        .map(function (s, i) {
          const parts = [];
          if (s.weight) parts.push(s.weight);
          if (s.reps) parts.push(s.reps + "r");
          if (s.time) parts.push(s.time + "s");
          if (s.note) parts.push(s.note);
          if (s.done && !s.weight && !s.reps && !s.time) parts.push("done");
          return parts.length ? "S" + (i + 1) + " " + parts.join(" ") : null;
        })
        .filter(Boolean);
      if (bits.length) rows.push({ name: ex.name, detail: bits.join(" · ") });
    });
    return rows;
  }

  function renderDone() {
    const date = state.selectedDate;
    const week = weekNumber(date);
    const log = dayLog(date);
    const meta = dayMeta(date);
    const rows = recapRows(log);
    const feels = [
      ["easy", "Easy"],
      ["right", "Right"],
      ["hard", "Hard"],
      ["too_hard", "Too hard"]
    ];
    let html = topbar(week);
    html += "<h2>How did that workout feel?</h2>";
    html += '<div class="feel-grid">';
    feels.forEach(function (f) {
      html +=
        '<button type="button" class="feel-btn' +
        (log.feel === f[0] ? " is-on" : "") +
        '" data-act="feel" data-val="' +
        f[0] +
        '">' +
        f[1] +
        "</button>";
    });
    html += "</div>";
    html += '<span class="tracker-label">RPE (optional)</span><div class="seg rpe">';
    for (let i = 1; i <= 10; i++) {
      html +=
        '<button type="button" data-act="rpe" data-val="' +
        i +
        '" class="' +
        (Number(log.rpe) === i ? "is-on" : "") +
        '">' +
        i +
        "</button>";
    }
    html += "</div>";
    html +=
      '<label class="field"><span>Note (optional)</span><textarea data-act="feel-note" placeholder="Anything worth remembering">' +
      esc(log.feel_note || "") +
      "</textarea></label>";
    if (!log.feel) {
      html += '<p class="hint">Tap how it felt before you leave if you can.</p>';
    }
    html += '<div class="done-mark">✓</div>';
    html += "<h2>Session logged.</h2>";
    html += '<p class="lede">' + esc(meta.title) + " · " + esc(prettyDate(date)) + "</p>";
    html += '<div class="card">';
    if (!rows.length) {
      html += "<p>Nothing logged — still counts if you showed up and moved.</p>";
    } else {
      rows.forEach(function (r) {
        html += '<div class="recap-row"><b>' + esc(r.name) + "</b><span>" + esc(r.detail) + "</span></div>";
      });
    }
    html += "</div>";
    html += "<h3>Optional tracker</h3>";
    html += '<p class="hint">One line. Skip if you want to walk out.</p>';
    html += '<span class="tracker-label">Sleep 1–5</span><div class="seg">';
    for (let i = 1; i <= 5; i++) {
      html += '<button type="button" data-act="track" data-field="sleep" data-val="' + i + '" class="' +
        (log.sleep === i ? "is-on" : "") + '">' + i + "</button>";
    }
    html += "</div>";
    html += '<span class="tracker-label">Work-stress 1–5</span><div class="seg">';
    for (let i = 1; i <= 5; i++) {
      html += '<button type="button" data-act="track" data-field="stress" data-val="' + i + '" class="' +
        (log.stress === i ? "is-on" : "") + '">' + i + "</button>";
    }
    html += "</div>";
    html += '<span class="tracker-label">Smoked for work?</span><div class="seg two">';
    html += '<button type="button" data-act="track" data-field="smoked" data-val="Y" class="' +
      (log.smoked === "Y" ? "is-on" : "") + '">Yes</button>';
    html += '<button type="button" data-act="track" data-field="smoked" data-val="N" class="' +
      (log.smoked === "N" ? "is-on" : "") + '">No</button>';
    html += "</div>";
    html += '<div class="actions"><button type="button" class="btn btn-primary" data-act="back-home">Back home</button></div>';
    $app.innerHTML = html;
  }

  function renderSave() {
    const week = weekNumber(state.selectedDate);
    let html = '<div class="ex-main">';
    html += topbar(week);
    html += '<p class="hero-kicker">Leaving</p>';
    html += "<h1>Save?</h1>";
    html += '<p class="lede">This session is in progress.</p>';
    html += "</div>";
    html += '<div class="pin-log"><div class="actions">';
    html += '<button type="button" class="btn btn-danger" data-act="save-no">No</button>';
    html += '<button type="button" class="btn btn-primary" data-act="save-end">Save and end</button>';
    html += '<button type="button" class="btn btn-ghost" data-act="save-stay">Save and stay</button>';
    html += "</div></div>";
    $app.innerHTML = html;
  }

  function renderWhy() {
    const week = weekNumber(state.selectedDate);
    let html = '<div class="ex-main">';
    html += topbar(week);
    html += '<p class="hero-kicker">One question</p>';
    html += "<h1>Why?</h1>";
    html += '<p class="lede">What stopped the session.</p>';
    html += "</div>";
    html += '<div class="pin-log"><div class="actions">';
    html += '<button type="button" class="btn btn-primary" data-act="why-reason" data-reason="too_hard">Too hard</button>';
    html += '<button type="button" class="btn btn-ghost" data-act="why-reason" data-reason="time">Ran out of time</button>';
    html += '<button type="button" class="btn btn-ghost" data-act="why-reason" data-reason="sick">Sick</button>';
    html += "</div></div>";
    $app.innerHTML = html;
  }

  function finishSession() {
    if (!isAuthed()) return;
    const now = new Date().toISOString();
    patchDay(state.selectedDate, function (log) {
      log.completed = true;
      log.started = true;
      if (!log.started_at) log.started_at = now;
      log.completed_at = now;
      if (state.satChoice) log.satChoice = state.satChoice;
      if (!log.feel) log.feel = "right";
    });
    writeLastSession(state.selectedDate, "done");
    state.view = "done";
    persistUI();
    syncSession(state.selectedDate);
    if (dayLog(state.selectedDate).feel) applyFeelAdjustments(state.selectedDate);
    render();
  }

  function youtubeId(url) {
    if (!url) return "";
    const s = String(url);
    let m = s.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    m = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    m = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    m = s.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    return "";
  }
  function openWatch(url) {
    state.watchUrl = url;
    render();
  }
  function closeWatch() {
    state.watchUrl = null;
  }
  function goLift(delta) {
    closeWatch();
    const date = state.selectedDate;
    const list = currentExerciseList();
    const isCircuit = dayMeta(date).type === "sat" && state.satChoice === "circuit";
    const n = list.length;
    const idx = state.exIndex + delta;
    if (isCircuit && n) {
      if (idx < 0) {
        if (state.round > 0) {
          state.round -= 1;
          state.exIndex = n - 1;
          state.currentSet = 0;
        }
      } else if (idx >= n) {
        const rounds = circuitRounds(weekNumber(date), dayLog(date).highStress);
        if (state.round + 1 < rounds) {
          state.round += 1;
          state.exIndex = 0;
          state.currentSet = 0;
        }
      } else {
        state.exIndex = idx;
        state.currentSet = 0;
      }
    } else if (idx < 0) {
      if (dayMeta(date).type === "lift") {
        state.view = "warmup";
        state.currentSet = 0;
      }
    } else if (idx < n) {
      state.exIndex = idx;
      state.currentSet = 0;
    }
    render();
  }

  function renderOverlay() {
    if (state.watchUrl) {
      const id = youtubeId(state.watchUrl);
      $overlay.hidden = false;
      $overlay.innerHTML =
        '<div class="sheet watch-sheet"><button type="button" class="btn btn-ghost watch-close" data-act="close-watch">Close</button>' +
        (id
          ? '<div class="watch-frame"><iframe src="https://www.youtube-nocookie.com/embed/' +
            esc(id) +
            '?playsinline=1&rel=0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>'
          : "") +
        "</div>";
      return;
    }
    clearRest();
    $overlay.hidden = true;
    $overlay.innerHTML = "";
  }

  function persistUI() {
    try {
      localStorage.setItem(UI, JSON.stringify({
        view: state.view,
        date: iso(state.selectedDate),
        satChoice: state.satChoice,
        rideStep: state.rideStep,
        exIndex: state.exIndex,
        round: state.round,
        currentSet: state.currentSet,
        interval: state.interval,
        leaveKind: state.leaveKind,
        leaveReturn: state.leaveReturn
      }));
    } catch (e) {}
  }
  function restoreUI() {
    if (!isAuthed()) return;
    try {
      const u = JSON.parse(localStorage.getItem(UI) || "null");
      if (!u || !u.date) return;
      const saved = parseISO(u.date);
      const today = startOfDay(new Date());
      const keepLeave = u.view === "save" || u.view === "why";
      if (keepLeave || (iso(saved) === iso(today) && u.view && u.view !== "home" && u.view !== "done")) {
        state.selectedDate = saved;
        state.view = u.view;
        state.satChoice = u.satChoice;
        state.rideStep = u.rideStep || 0;
        state.exIndex = u.exIndex || 0;
        state.round = u.round || 0;
        state.currentSet = u.currentSet || 0;
        state.interval = u.interval || null;
        state.leaveKind = u.leaveKind || null;
        state.leaveReturn = u.leaveReturn || null;
      } else if (u.date) {
        /* keep computed today; do not trap on a stale mid-workout from another day */
      }
    } catch (e) {}
  }

  function setDock(on) {
    if ($app) $app.classList.toggle("has-dock", !!on);
    document.body.classList.toggle("has-dock", !!on);
    document.documentElement.classList.toggle("has-dock", !!on);
  }

  let lastScreenKey = null;
  let renderGen = 0;
  let scrollRaf = 0;

  function screenKey() {
    if (state.view === "exercise") return "exercise:" + state.exIndex + ":" + state.round;
    return state.view;
  }

  function captureScroll() {
    const main = document.querySelector(".ex-main");
    const pin = document.querySelector(".pin-log");
    return {
      y: window.scrollY || 0,
      main: main ? main.scrollTop : 0,
      pin: pin ? pin.scrollTop : 0
    };
  }

  function applyScroll(pos, reset) {
    if (scrollRaf) {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = 0;
    }
    const gen = renderGen;
    function put() {
      if (gen !== renderGen) return;
      const y = reset ? 0 : (pos && pos.y) || 0;
      const mainY = reset ? 0 : (pos && pos.main) || 0;
      const pinY = reset ? 0 : (pos && pos.pin) || 0;
      window.scrollTo(0, y);
      const main = document.querySelector(".ex-main");
      const pin = document.querySelector(".pin-log");
      if (main) main.scrollTop = mainY;
      if (pin) pin.scrollTop = pinY;
    }
    put();
    scrollRaf = requestAnimationFrame(function () {
      scrollRaf = 0;
      put();
    });
  }

  function render() {
    const gen = ++renderGen;
    persistUI();
    const pos = captureScroll();
    const prevKey = lastScreenKey;
    if (!isAuthed()) {
      setDock(false);
      renderLogin();
      if (gen !== renderGen) return;
      lastScreenKey = "login";
      renderOverlay();
      applyScroll(pos, true);
      return;
    }
    const dock = state.view === "home" || state.view === "warmup" || state.view === "exercise" || state.view === "mobility" || state.view === "off" || state.view === "save" || state.view === "why";
    setDock(dock);
    if (state.view === "home") renderHome();
    else if (state.view === "warmup") renderWarmup();
    else if (state.view === "exercise") renderExercise();
    else if (state.view === "ride") renderRide();
    else if (state.view === "mobility") renderMobility();
    else if (state.view === "intervals") renderIntervals();
    else if (state.view === "off") renderMobility();
    else if (state.view === "done") renderDone();
    else if (state.view === "save") renderSave();
    else if (state.view === "why") renderWhy();
    else renderHome();
    if (gen !== renderGen) return;
    const key = screenKey();
    lastScreenKey = key;
    renderOverlay();
    applyScroll(pos, prevKey !== key);
  }

  function startSession() {
    if (!isAuthed()) return;
    ensureAudio();
    const meta = dayMeta(state.selectedDate);
    patchDay(state.selectedDate, function (log) {
      log.started = true;
      log.completed = false;
      if (!log.started_at) log.started_at = new Date().toISOString();
    });
    scheduleSync(state.selectedDate);
    state.exIndex = 0;
    state.currentSet = 0;
    state.round = 0;
    state.rideStep = 0;
    state.interval = null;
    if (meta.type === "lift") state.view = "warmup";
    else if (meta.type === "ride") state.view = "ride";
    else if (meta.type === "off") state.view = "mobility";
    else state.view = "home";
    render();
  }

  function resumeSession() {
    if (!isAuthed()) return;
    ensureAudio();
    const log = dayLog(state.selectedDate);
    if (log.satChoice) state.satChoice = log.satChoice;
    const point = findResumePoint(state.selectedDate);
    if (point.view === "done" || point.allDone) {
      if (!log.completed) {
        finishSession();
        return;
      }
      state.view = "done";
      render();
      return;
    }
    if (point.view === "intervals") {
      const u = (function () {
        try { return JSON.parse(localStorage.getItem(UI) || "null"); } catch (e) { return null; }
      })();
      if (u && u.date === iso(state.selectedDate) && u.interval) state.interval = u.interval;
    }
    state.exIndex = point.exIndex || 0;
    state.currentSet = point.currentSet || 0;
    state.round = point.round || 0;
    state.view = point.view;
    render();
  }

  function markSetDone() {
    const list = currentExerciseList();
    if (!list[state.exIndex]) return;
    const exId = circuitKey(list[state.exIndex]);
    const loggedIdx = state.currentSet;
    writeSet(state.selectedDate, exId, loggedIdx, "done", true);
  }

  function logSetAndRest() {
    const list = currentExerciseList();
    if (!list[state.exIndex]) return;
    const ex = D.exercises[list[state.exIndex]];
    const key = circuitKey(list[state.exIndex]);
    const isCircuit = dayMeta(state.selectedDate).type === "sat" && state.satChoice === "circuit";
    const nSets = isCircuit ? 1 : setsFor(ex, weekNumber(state.selectedDate), dayLog(state.selectedDate).highStress, state.selectedDate);
    const loggedIdx = state.currentSet;
    const ok = commitScreenSet(state.selectedDate, key, loggedIdx, ex);
    if (!ok) {
      state.logHint = "Nothing to save.";
      render();
      return;
    }
    state.logHint = "";
    const last = loggedIdx >= nSets - 1;
    if (!last) {
      advanceCurrentSet();
      prefillSetFrom(state.selectedDate, key, loggedIdx, state.currentSet);
    }
    render();
  }

  function armIntervalTick() {
    if (intervalTimer) return;
    intervalTimer = setInterval(function () {
      if (!state.interval || !state.interval.running) return;
      state.interval.remaining -= 1;
      if (state.interval.remaining <= 0) {
        state.interval.remaining = 0;
        state.interval.running = false;
        state.interval.done = true;
        alertDone();
        if (state.interval.i < INTERVALS.length - 1) {
          state.interval.i += 1;
          state.interval.remaining = INTERVALS[state.interval.i].sec;
          state.interval.running = true;
          state.interval.done = false;
        }
      }
      persistUI();
      if (state.view === "intervals") render();
    }, 1000);
  }

  $app.addEventListener("pointerdown", function (e) {
    const t = e.target.closest("[data-act='toggle-wu']");
    if (!t) return;
    toggleWarmup(t.getAttribute("data-id"));
  });

  $app.addEventListener("click", function (e) {
    const t = e.target.closest("[data-act]");
    if (!t) return;
    const act = t.getAttribute("data-act");
    if (act === "pick-day") {
      if (!t.closest(".picker, .month-grid")) return;
      const nextIso = t.getAttribute("data-iso");
      if (!nextIso) return;
      clearProposal();
      state.selectedDate = parseISO(nextIso);
      state.calMonth = {
        y: state.selectedDate.getFullYear(),
        m: state.selectedDate.getMonth()
      };
      state.view = "home";
      state.satChoice = null;
      render();
    } else if (act === "toggle-cal") {
      state.showCal = !state.showCal;
      if (state.showCal && !state.calMonth) {
        state.calMonth = {
          y: state.selectedDate.getFullYear(),
          m: state.selectedDate.getMonth()
        };
      }
      render();
    } else if (act === "toggle-stress") {
      if (!isAuthed()) return;
      patchDay(state.selectedDate, function (log) { log.highStress = !log.highStress; });
      scheduleSync(state.selectedDate);
      render();
    } else if (act === "start") {
      if (!isAuthed()) return;
      clearProposal();
      const phase = dayPhase(state.selectedDate);
      if (phase === "done") { state.view = "done"; render(); return; }
      if (phase === "resume") { resumeSession(); return; }
      startSession();
    } else if (act === "restart") {
      if (!isAuthed()) return;
      clearProposal();
      startSession();
    } else if (act === "start-sat") {
      if (!isAuthed()) return;
      clearProposal();
      ensureAudio();
      state.satChoice = t.getAttribute("data-choice");
      patchDay(state.selectedDate, function (log) {
        log.started = true;
        log.completed = false;
        log.satChoice = state.satChoice;
        if (!log.started_at) log.started_at = new Date().toISOString();
      });
      scheduleSync(state.selectedDate);
      state.exIndex = 0;
      state.currentSet = 0;
      state.round = 0;
      state.rideStep = 0;
      state.interval = null;
      if (state.satChoice === "ride") state.view = "ride";
      else if (state.satChoice === "intervals") { state.view = "intervals"; state.interval = { i: 0, remaining: INTERVALS[0].sec, running: false, done: false }; }
      else state.view = "exercise";
      render();
    } else if (act === "home" || act === "back-home") {
      goHomeQuiet();
    } else if (act === "leave") {
      requestLeave();
    } else if (act === "save-no") {
      discardDay(state.selectedDate);
      goHomeQuiet();
    } else if (act === "save-end") {
      saveAndEnd();
    } else if (act === "save-stay") {
      const ret = state.leaveReturn;
      state.leaveReturn = null;
      if (ret) restoreLeave(ret);
      else state.view = "exercise";
      render();
    } else if (act === "why-reason") {
      chooseWhy(t.getAttribute("data-reason"));
    } else if (act === "skip-day") {
      if (!isAuthed()) return;
      if (dayPhase(state.selectedDate) === "done") return;
      clearProposal();
      openWhySkipped();
    } else if (act === "accept-week") {
      acceptProposal();
      render();
    } else if (act === "keep-week") {
      clearProposal();
      render();
    } else if (act === "toggle-wu") {
      toggleWarmup(t.getAttribute("data-id"));
    } else if (act === "signin") {
      doSignIn();
    } else if (act === "signup") {
      doSignUp();
    } else if (act === "signout") {
      clearProposal();
      doSignOut();
    } else if (act === "wu-continue") {
      state.exIndex = 0;
      state.currentSet = 0;
      state.view = "exercise";
      render();
    } else if (act === "start-lift") {
      closeWatch();
      state.logHint = "";
      markLiftStarted(circuitKey(currentExerciseList()[state.exIndex]));
      render();
    } else if (act === "watch-lift") {
      const ex = D.exercises[currentExerciseList()[state.exIndex]];
      if (ex && ex.watchUrl) openWatch(ex.watchUrl);
    } else if (act === "ex-back") {
      goLift(-1);
    } else if (act === "ex-next") {
      goLift(1);
    } else if (act === "focus-set") {
      state.currentSet = Number(t.getAttribute("data-set"));
      render();
    } else if (act === "mark-done") {
      writeSet(state.selectedDate, circuitKey(currentExerciseList()[state.exIndex]), Number(t.getAttribute("data-set")), "done", true);
      render();
    } else if (act === "log-set") {
      logSetAndRest();
    } else if (act === "next-ex" || act === "skip-ex") {
      state.logHint = "";
      state.exIndex += 1;
      state.currentSet = 0;
      render();
    } else if (act === "start-hold") {
      ensureAudio();
      startHold(Number(t.getAttribute("data-sec")));
    } else if (act === "stop-hold") {
      stopHold();
    } else if (act === "add-hold") {
      if (state.hold) state.hold.ends += Number(t.getAttribute("data-sec")) * 1000;
      else startHold(Number(t.getAttribute("data-sec")));
      render();
    } else if (act === "ride-done") {
      if (holdTimer) { clearInterval(holdTimer); holdTimer = null; }
      state.hold = null;
      if (dayMeta(state.selectedDate).type === "ride") state.view = "mobility";
      else finishSession();
      render();
    } else if (act === "finish") {
      finishSession();
    } else if (act === "step") {
      const field = t.getAttribute("data-field");
      const idx = Number(t.getAttribute("data-set"));
      const exId = t.getAttribute("data-ex");
      const delta = Number(t.getAttribute("data-delta"));
      const log = dayLog(state.selectedDate);
      let cur = ((log.exercises[exId] || [])[idx] || {})[field];
      if (!String(cur || "").trim()) {
        const box = t.closest(".stepper");
        const input = box && box.querySelector("input");
        if (input && String(input.value).trim()) cur = input.value;
      }
      const n = (parseFloat(cur) || 0) + delta;
      const next = field === "reps" ? Math.max(0, Math.round(n)) : Math.max(0, Math.round(n * 2) / 2);
      writeSet(state.selectedDate, exId, idx, field, String(next));
      state.currentSet = idx;
      render();
    } else if (act === "track") {
      const field = t.getAttribute("data-field");
      let val = t.getAttribute("data-val");
      if (field !== "smoked") val = Number(val);
      patchDay(state.selectedDate, function (log) { log[field] = val; });
      scheduleSync(state.selectedDate);
      render();
    } else if (act === "feel") {
      patchDay(state.selectedDate, function (log) { log.feel = t.getAttribute("data-val"); });
      applyFeelAdjustments(state.selectedDate);
      syncSession(state.selectedDate);
      render();
    } else if (act === "rpe") {
      patchDay(state.selectedDate, function (log) { log.rpe = Number(t.getAttribute("data-val")); });
      applyFeelAdjustments(state.selectedDate);
      syncSession(state.selectedDate);
      render();
    } else if (act === "month-prev") {
      shiftCalMonth(-1);
      render();
    } else if (act === "month-next") {
      shiftCalMonth(1);
      render();
    } else if (act === "int-start") {
      ensureAudio();
      if (!state.interval) state.interval = { i: 0, remaining: INTERVALS[0].sec, running: true, done: false };
      else state.interval.running = true;
      armIntervalTick();
      render();
    } else if (act === "int-pause") {
      if (state.interval) state.interval.running = false;
      render();
    } else if (act === "int-next" || act === "int-skip") {
      if (!state.interval) return;
      if (state.interval.i >= INTERVALS.length - 1) { finishSession(); return; }
      state.interval.i += 1;
      state.interval.remaining = INTERVALS[state.interval.i].sec;
      state.interval.running = act === "int-next";
      state.interval.done = false;
      if (state.interval.running) armIntervalTick();
      render();
    }
  });

  $app.addEventListener("input", function (e) {
    const note = e.target.closest("[data-act='feel-note']");
    if (note) {
      patchDay(state.selectedDate, function (log) { log.feel_note = note.value; });
      scheduleSync(state.selectedDate);
      return;
    }
    const t = e.target.closest("[data-act='log']");
    if (!t) return;
    writeSet(state.selectedDate, t.getAttribute("data-ex"), Number(t.getAttribute("data-set")), t.getAttribute("data-field"), t.value);
  });

  $overlay.addEventListener("click", function (e) {
    const t = e.target.closest("[data-act]");
    if ((t && t.getAttribute("data-act") === "close-watch") || (state.watchUrl && e.target === $overlay)) {
      closeWatch();
      render();
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      if (isAuthed()) render();
    }
  });

  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  try {
    restoreUI();
    flushQueue();
    fetchExternalAndAdjust();
    render();
  } catch (err) {
    var msg = (err && err.message) ? err.message : String(err);
    if ($app) {
      $app.innerHTML = '<div class="lede" style="padding:8px 0"><b>BotFit hit an error.</b><p>' +
        String(msg).replace(/&/g,'&amp;').replace(/</g,'&lt;') +
        '</p><p>Hard-refresh, or tell Devster.</p></div>';
    }
    throw err;
  }
})();
