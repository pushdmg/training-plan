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
