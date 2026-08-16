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
    leaveReturn: null
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
