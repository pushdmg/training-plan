/* BotFit walkthrough — vanilla, localStorage, no build */
(function () {
  "use strict";

  const D = window.BOTFIT;
  const STORE = "botfit-logs-v1";
  const UI = "botfit-ui-v1";
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
    mobIndex: 0
  };

  let restTimer = null;
  let holdTimer = null;
  let intervalTimer = null;
  let audioCtx = null;

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
  function setsFor(ex, week, highStress) {
    if (!ex) return highStress || week === 1 || week === 8 ? 2 : 3;
    if (ex.optional) return 1;
    if (ex.log === "done") return 2;
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

  function loadAll() {
    try {
      return JSON.parse(localStorage.getItem(STORE) || "{}");
    } catch (e) {
      return {};
    }
  }
  function saveAll(all) {
    try { localStorage.setItem(STORE, JSON.stringify(all)); } catch (e) {}
  }
  function dayLog(date) {
    const all = loadAll();
    const key = iso(date);
    if (!all[key]) {
      all[key] = { warmup: {}, exercises: {}, completed: false, satChoice: null, highStress: false };
      saveAll(all);
    }
    return all[key];
  }
  function patchDay(date, fn) {
    const all = loadAll();
    const key = iso(date);
    if (!all[key]) all[key] = { warmup: {}, exercises: {}, completed: false, satChoice: null, highStress: false };
    fn(all[key]);
    saveAll(all);
  }
  function lastWeight(exId) {
    const all = loadAll();
    const keys = Object.keys(all).sort().reverse();
    for (let i = 0; i < keys.length; i++) {
      const sets = all[keys[i]].exercises && all[keys[i]].exercises[exId];
      if (!sets) continue;
      for (let s = sets.length - 1; s >= 0; s--) {
        if (sets[s] && sets[s].weight) return sets[s].weight;
      }
    }
    return "";
  }
  function ensureSets(date, exId, n) {
    let out = [];
    patchDay(date, function (log) {
      if (!log.exercises[exId]) log.exercises[exId] = [];
      while (log.exercises[exId].length < n) {
        log.exercises[exId].push({ weight: "", reps: "", time: "", note: "", done: false });
      }
      out = log.exercises[exId];
    });
    return out;
  }
  function writeSet(date, exId, idx, field, value) {
    patchDay(date, function (log) {
      if (!log.exercises[exId]) log.exercises[exId] = [];
      while (log.exercises[exId].length <= idx) {
        log.exercises[exId].push({ weight: "", reps: "", time: "", note: "", done: false });
      }
      log.exercises[exId][idx][field] = value;
    });
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

  function startRest(seconds, label, after) {
    if (!seconds) {
      if (after === "next-set") state.currentSet += 1;
      render();
      return;
    }
    state.rest = { ends: Date.now() + seconds * 1000, total: seconds, label: label || "Rest", after: after || null };
    tickRest();
    if (restTimer) clearInterval(restTimer);
    restTimer = setInterval(tickRest, 250);
    renderOverlay();
  }
  function tickRest() {
    if (!state.rest) return;
    const left = (state.rest.ends - Date.now()) / 1000;
    if (left <= 0) {
      const after = state.rest.after;
      clearInterval(restTimer);
      restTimer = null;
      state.rest = null;
      if (after === "next-set") state.currentSet += 1;
      alertDone();
      renderOverlay();
      render();
      return;
    }
    renderOverlay();
  }
  function skipRest() {
    const after = state.rest && state.rest.after;
    if (restTimer) clearInterval(restTimer);
    restTimer = null;
    state.rest = null;
    if (after === "next-set") state.currentSet += 1;
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

  function topbar(week) {
    return (
      '<div class="topbar">' +
      '<div class="brand"><img src="icon-192.png" alt="">BotFit</div>' +
      '<div class="week-pill">Week ' + week + (week === 8 ? " · deload" : week === 1 ? " · learn the room" : "") + "</div>" +
      "</div>"
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
      '<input inputmode="decimal" data-act="log" data-ex="' + exId + '" data-set="' + setIdx +
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
    const nSets = setsFor(null, week, log.highStress);

    let body = topbar(week);
    body += '<p class="date-line">' + esc(prettyDate(date)) + (isToday ? " · today" : "") + "</p>";
    if (date < WEEK1) {
      body += '<p class="hero-kicker">Week 1 starts Mon Aug 17</p>';
    } else if (afterPlan(date)) {
      body += '<p class="hero-kicker">Plan complete — week 8 volumes still on</p>';
    } else {
      body += '<p class="hero-kicker">' + (isToday ? "Today" : "Selected") + "</p>";
    }
    body += "<h1>" + esc(meta.title) + "</h1>";
    body += '<p class="lede">' + esc(meta.blurb) + "</p>";
    body += pickerHtml(date);
    if (meta.type === "lift") {
      body += '<div class="note"><strong>This week.</strong> ' + nSets + " sets per exercise. " + esc(intensity) + "</div>";
    } else {
      body += '<div class="note"><strong>This week.</strong> ' + esc(intensity) + "</div>";
    }

    if (meta.type === "lift") {
      body +=
        '<button type="button" class="toggle' +
        (log.highStress ? " is-on" : "") +
        '" data-act="toggle-stress"><span class="box">' +
        (log.highStress ? "✓" : "") +
        "</span><span>Rough day (2 sets)<br><span class=\"hint\">Bad sleep or a brutal workday. Keep the session, cut the volume.</span></span></button>";
    }

    if (meta.type === "sat") {
      body += '<p class="hint">Pick one.</p>';
      body +=
        '<button type="button" class="choice" data-act="start-sat" data-choice="ride"><b>Easy outdoor ride</b><span>' +
        esc(rideDur("sat", week)) +
        " · talk pace. Or stay on a spin bike if weather sucks.</span></button>";
      body +=
        '<button type="button" class="choice" data-act="start-sat" data-choice="circuit"><b>Full-body circuit</b><span>' +
        circuitRounds(week, log.highStress) +
        " rounds: KB deadlift, DB press, cable row, goblet, farmer carry.</span></button>";
      if (week >= 5 && week <= 7) {
        body +=
          '<button type="button" class="choice" data-act="start-sat" data-choice="intervals"><b>Short intervals</b><span>24 min on a spin bike: 6 easy, 8 × 30s hard / 90s easy, 2 cooldown. Only if Thursday legs recovered.</span></button>';
      }
    } else if (meta.type === "ride") {
      const label = log.completed ? "View recap" : log.started ? "Resume session" : "Start session";
      body += '<div class="actions"><button type="button" class="btn btn-primary" data-act="start">' + label + "</button></div>";
    } else if (meta.type === "off") {
      const label = log.completed ? "View recap" : "Start recovery";
      body += '<div class="actions"><button type="button" class="btn btn-primary" data-act="start">' + label + "</button></div>";
    } else {
      const n = meta.exercises.length;
      const label = log.completed ? "View recap" : log.started && !log.completed ? "Resume session" : "Start session";
      body +=
        '<div class="card"><b>' +
        n +
        " exercises · " + nSets + " sets</b><p>Warm-up first, then one lift per screen. Hammer Strength chest press is first on Monday. Log weight and reps as you go.</p></div>";
      body += '<div class="actions"><button type="button" class="btn btn-primary" data-act="start">' + label + "</button>";
      if (log.completed) {
        body += '<button type="button" class="btn btn-ghost" data-act="restart">Start over</button>';
      } else if (log.started) {
        body += '<button type="button" class="btn btn-ghost" data-act="restart">Start over</button>';
      }
      body += "</div>";
    }

    if (log.completed) {
      body += '<p class="hint">Logged for ' + esc(iso(date)) + ". Green dot on the day picker.</p>";
    }
    body += '<p class="install">Add to Home Screen from the browser share menu. Works offline after the first open on a local server (not file://).</p>';
    $app.innerHTML = body;
  }

  function renderWarmup() {
    const date = state.selectedDate;
    const week = weekNumber(date);
    const log = dayLog(date);
    const items = D.warmup;
    let done = 0;
    items.forEach(function (it) { if (log.warmup[it.id]) done++; });
    let html = topbar(week);
    html +=
      '<div class="navrow"><button type="button" class="back" data-act="home">← Home</button><div class="progress">WARM-UP · ' +
      done + "/" + items.length + "</div></div>";
    html += "<h2>Warm-up</h2><p class=\"lede\">Check them off as you go. You can hit Next without finishing every box.</p>";
    items.forEach(function (it) {
      const on = !!log.warmup[it.id];
      html +=
        '<button type="button" class="check' +
        (on ? " is-on" : "") +
        '" data-act="toggle-wu" data-id="' + it.id +
        '"><span class="box">' + (on ? "✓" : "") +
        "</span><div><b>" + esc(it.title) + "</b><p>" + esc(it.detail) + "</p></div></button>";
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
    html +=
      '<div class="actions"><button type="button" class="btn btn-primary" data-act="wu-continue">Next — start lifts</button>' +
      '<button type="button" class="btn btn-danger" data-act="wu-continue">Skip remaining</button></div>';
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
    const nSets = isCircuit ? 1 : setsFor(ex, week, log.highStress);
    const sets = ensureSets(date, circuitKey(exId), nSets);
    if (state.currentSet >= nSets) state.currentSet = nSets - 1;
    const last = lastWeight(isCircuit ? circuitKey(exId) : exId);
    const key = circuitKey(exId);

    let html = topbar(week);
    const stepLabel = isCircuit
      ? "R" + (state.round + 1) + " · " + (state.exIndex + 1) + "/" + list.length
      : (state.exIndex + 1) + " of " + list.length;
    html +=
      '<div class="navrow"><button type="button" class="back" data-act="ex-back">← Back</button><div class="progress">' +
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
    html += '<div class="where"><span class="pin">USE</span><div>' + esc(ex.where) + "</div></div>";
    html += "<h3>Setup</h3><div class=\"card step-copy\"><p>" + esc(ex.setup) + "</p></div>";
    html += "<h3>Form cues</h3><ul class=\"cues\">";
    ex.cues.forEach(function (c) { html += "<li>" + esc(c) + "</li>"; });
    html += "</ul>";
    if (ex.safety) html += '<div class="note">' + esc(ex.safety) + "</div>";
    if (week <= 4 && !ex.optional && ex.log !== "done") {
      html += '<div class="note">Leave 2–3 reps in the tank. No failure weeks 1–4.</div>';
    }
    html += '<div class="scheme">';
    html += '<span class="chip chip-on">' + (isCircuit ? esc(ex.reps) : nSets + " × " + esc(ex.reps)) + "</span>";
    if (ex.rest) html += '<span class="chip">' + ex.rest + "s rest</span>";
    if (ex.perSide) html += '<span class="chip">Per side</span>';
    if (ex.optional) html += '<span class="chip">Skip-able</span>';
    html += "</div>";
    if (last) html += '<p class="hint">Last logged weight: ' + esc(last) + "</p>";

    for (let i = 0; i < nSets; i++) {
      const s = sets[i] || {};
      const cur = i === state.currentSet;
      html += '<div class="set' + (cur ? " is-current" : "") + '" data-act="focus-set" data-set="' + i + '">';
      html += '<div class="set-head"><span>Set ' + (i + 1) + (cur ? " · now" : "") + "</span>";
      if (s.done) html += "<span>logged</span>";
      html += "</div>";
      if (ex.log === "done") {
        html +=
          '<button type="button" class="btn btn-ghost" data-act="mark-done" data-set="' + i + '">' +
          (s.done ? "Round done ✓" : "Mark this round done") + "</button>";
      } else {
        html += '<div class="set-grid">';
        if (ex.log === "weight-reps" || ex.log === "weight-time") {
          html += '<label class="field"><span>' + esc(ex.weightLabel || "Weight (lb)") + "</span>" +
            stepperHtml(key, i, "weight", s.weight, 5, last || "0") + "</label>";
        }
        if (ex.log === "weight-reps") {
          html += '<label class="field"><span>Reps' + (ex.perSide ? " / side" : "") + "</span>" +
            stepperHtml(key, i, "reps", s.reps, 1, String(ex.reps).split(/[^\d]/)[0] || "8") + "</label>";
        }
        if (ex.log === "time" || ex.log === "weight-time") {
          html += '<label class="field"><span>Seconds</span>' +
            stepperHtml(key, i, "time", s.time, 5, String(ex.hold || 30)) + "</label>";
        }
        html += "</div>";
        if (ex.note) {
          html +=
            '<label class="field" style="margin-top:8px"><span>What you used</span><input type="text" data-act="log" data-ex="' +
            key + '" data-set="' + i + '" data-field="note" value="' + esc(s.note || "") +
            '" placeholder="machine / lunges / skip"></label>';
        }
      }
      html += "</div>";
    }

    if (ex.hold && (ex.log === "time" || ex.log === "weight-time")) {
      if (state.hold) {
        const left = Math.max(0, (state.hold.ends - Date.now()) / 1000);
        html += '<div class="timer-face"><div class="clock">' + fmtClock(left) + '</div><div class="sub">Hold</div></div>';
        html += '<div class="actions"><button type="button" class="btn btn-ghost" data-act="stop-hold">Stop</button></div>';
      } else {
        html +=
          '<div class="actions"><button type="button" class="btn btn-ghost" data-act="start-hold" data-sec="' +
          ex.hold + '">Start ' + (ex.hold >= 60 ? fmtClock(ex.hold) : ex.hold + "s") + " timer</button></div>";
      }
    }

    const lastSet = state.currentSet >= nSets - 1;
    html += '<div class="actions">';
    html += '<button type="button" class="btn btn-primary" data-act="log-set">Log set' +
      (ex.rest ? " · start " + ex.rest + "s rest" : "") + "</button>";
    if (ex.rest) {
      html += '<button type="button" class="btn btn-ghost" data-act="start-rest" data-sec="' + ex.rest + '">Start rest</button>';
    }
    if (!lastSet && !isCircuit) {
      html += '<button type="button" class="btn btn-ghost" data-act="next-set">Next set</button>';
    }
    html +=
      '<button type="button" class="btn btn-ghost" data-act="next-ex">' +
      (isCircuit && state.exIndex === list.length - 1
        ? (state.round + 1 >= circuitRounds(week, log.highStress) ? "Finish circuit" : "Next round")
        : state.exIndex === list.length - 1 ? "Finish workout" : "Next exercise") +
      "</button>";
    html += '<button type="button" class="btn btn-danger" data-act="skip-ex">' + (ex.optional ? "Skip" : "Skip exercise") + "</button>";
    html += "</div>";
    $app.innerHTML = html;
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
      '<div class="navrow"><button type="button" class="back" data-act="home">← Home</button><div class="progress">RIDE</div></div>';
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
    let html = topbar(week);
    html +=
      '<div class="navrow"><button type="button" class="back" data-act="home">← Home</button><div class="progress">MOBILITY</div></div>';
    html += "<h2>" + (kind === "sun" ? "Off — walk or mobility" : "Short mobility") + "</h2>";
    html += '<p class="lede">Optional. Check them off or skip to done.</p>';
    items.forEach(function (it) {
      const on = !!log.warmup[it.id];
      html +=
        '<button type="button" class="check' + (on ? " is-on" : "") +
        '" data-act="toggle-wu" data-id="' + it.id +
        '"><span class="box">' + (on ? "✓" : "") +
        "</span><div><b>" + esc(it.title) + "</b><p>" + esc(it.detail) + "</p></div></button>";
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
    html += '<div class="actions"><button type="button" class="btn btn-primary" data-act="finish">Done</button></div>';
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
      '<div class="navrow"><button type="button" class="back" data-act="home">← Home</button><div class="progress">' +
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
    let html = topbar(week);
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
    html += '<div class="actions"><button type="button" class="btn btn-primary" data-act="home">Back home</button></div>';
    $app.innerHTML = html;
  }

  function finishSession() {
    patchDay(state.selectedDate, function (log) {
      log.completed = true;
      log.started = true;
      if (state.satChoice) log.satChoice = state.satChoice;
    });
    state.view = "done";
    persistUI();
    render();
  }

  function renderOverlay() {
    if (!state.rest) {
      $overlay.hidden = true;
      $overlay.innerHTML = "";
      return;
    }
    const left = Math.max(0, (state.rest.ends - Date.now()) / 1000);
    const go = left <= 0;
    $overlay.hidden = false;
    $overlay.innerHTML =
      '<div class="sheet"><div class="clock">' + (go ? "GO" : fmtClock(left)) + "</div><h2>" +
      esc(state.rest.label) + '</h2><p class="sub">' +
      (go ? "Next set." : "Stay on this screen. It will buzz and beep if the browser allows.") +
      '</p><div class="actions"><button type="button" class="btn btn-primary" data-act="skip-rest">' +
      (go ? "Continue" : "Skip rest") + "</button></div></div>";
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
        interval: state.interval
      }));
    } catch (e) {}
  }
  function restoreUI() {
    try {
      const u = JSON.parse(localStorage.getItem(UI) || "null");
      if (!u || !u.date) return;
      const saved = parseISO(u.date);
      const today = startOfDay(new Date());
      if (iso(saved) === iso(today) && u.view && u.view !== "home" && u.view !== "done") {
        state.selectedDate = saved;
        state.view = u.view;
        state.satChoice = u.satChoice;
        state.rideStep = u.rideStep || 0;
        state.exIndex = u.exIndex || 0;
        state.round = u.round || 0;
        state.currentSet = u.currentSet || 0;
        state.interval = u.interval || null;
      } else if (u.date) {
        /* keep computed today; do not trap on a stale mid-workout from another day */
      }
    } catch (e) {}
  }

  function render() {
    persistUI();
    if (state.view === "home") renderHome();
    else if (state.view === "warmup") renderWarmup();
    else if (state.view === "exercise") renderExercise();
    else if (state.view === "ride") renderRide();
    else if (state.view === "mobility") renderMobility();
    else if (state.view === "intervals") renderIntervals();
    else if (state.view === "off") renderMobility();
    else if (state.view === "done") renderDone();
    else renderHome();
    renderOverlay();
    window.scrollTo(0, 0);
  }

  function startSession() {
    ensureAudio();
    const meta = dayMeta(state.selectedDate);
    patchDay(state.selectedDate, function (log) { log.started = true; log.completed = false; });
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
    ensureAudio();
    const u = (function () {
      try { return JSON.parse(localStorage.getItem(UI) || "null"); } catch (e) { return null; }
    })();
    if (u && u.date === iso(state.selectedDate) && u.view && u.view !== "home" && u.view !== "done") {
      state.view = u.view;
      state.satChoice = u.satChoice;
      state.exIndex = u.exIndex || 0;
      state.round = u.round || 0;
      state.currentSet = u.currentSet || 0;
      state.interval = u.interval || null;
      render();
      return;
    }
    startSession();
  }

  function markSetDone() {
    const list = currentExerciseList();
    if (!list[state.exIndex]) return;
    const exId = circuitKey(list[state.exIndex]);
    writeSet(state.selectedDate, exId, state.currentSet, "done", true);
  }

  function logSetAndRest() {
    const list = currentExerciseList();
    const ex = D.exercises[list[state.exIndex]];
    const isCircuit = dayMeta(state.selectedDate).type === "sat" && state.satChoice === "circuit";
    const nSets = isCircuit ? 1 : setsFor(ex, weekNumber(state.selectedDate), dayLog(state.selectedDate).highStress);
    markSetDone();
    const last = state.currentSet >= nSets - 1;
    if (isCircuit) {
      if (ex.rest) startRest(ex.rest, "Rest", null);
      return;
    }
    if (last) {
      if (ex.rest) startRest(ex.rest, "Rest · then next exercise", null);
      else render();
      return;
    }
    startRest(ex.rest || 90, "Rest · set " + (state.currentSet + 2), "next-set");
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
      if (state.view === "intervals") renderIntervals();
    }, 1000);
  }

  $app.addEventListener("click", function (e) {
    const t = e.target.closest("[data-act]");
    if (!t) return;
    const act = t.getAttribute("data-act");
    if (act === "pick-day") {
      state.selectedDate = parseISO(t.getAttribute("data-iso"));
      state.view = "home";
      state.satChoice = null;
      render();
    } else if (act === "toggle-stress") {
      patchDay(state.selectedDate, function (log) { log.highStress = !log.highStress; });
      render();
    } else if (act === "start") {
      const log = dayLog(state.selectedDate);
      if (log.completed && state.view === "home") { state.view = "done"; render(); return; }
      if (log.started && !log.completed) { resumeSession(); return; }
      startSession();
    } else if (act === "restart") {
      startSession();
    } else if (act === "start-sat") {
      ensureAudio();
      state.satChoice = t.getAttribute("data-choice");
      patchDay(state.selectedDate, function (log) {
        log.started = true;
        log.completed = false;
        log.satChoice = state.satChoice;
      });
      state.exIndex = 0;
      state.currentSet = 0;
      state.round = 0;
      state.rideStep = 0;
      state.interval = null;
      if (state.satChoice === "ride") state.view = "ride";
      else if (state.satChoice === "intervals") { state.view = "intervals"; state.interval = { i: 0, remaining: INTERVALS[0].sec, running: false, done: false }; }
      else state.view = "exercise";
      render();
    } else if (act === "home") {
      state.view = "home";
      render();
    } else if (act === "toggle-wu") {
      const id = t.getAttribute("data-id");
      patchDay(state.selectedDate, function (log) { log.warmup[id] = !log.warmup[id]; });
      render();
    } else if (act === "wu-continue") {
      state.exIndex = 0;
      state.currentSet = 0;
      state.view = "exercise";
      render();
    } else if (act === "ex-back") {
      if (state.exIndex > 0) { state.exIndex -= 1; state.currentSet = 0; }
      else if (state.round > 0) { state.round -= 1; state.exIndex = currentExerciseList().length - 1; state.currentSet = 0; }
      else {
        const meta = dayMeta(state.selectedDate);
        state.view = meta.type === "lift" ? "warmup" : "home";
      }
      render();
    } else if (act === "focus-set") {
      state.currentSet = Number(t.getAttribute("data-set"));
      render();
    } else if (act === "mark-done") {
      writeSet(state.selectedDate, circuitKey(currentExerciseList()[state.exIndex]), Number(t.getAttribute("data-set")), "done", true);
      render();
    } else if (act === "log-set") {
      logSetAndRest();
    } else if (act === "start-rest") {
      markSetDone();
      const list = currentExerciseList();
      const ex = D.exercises[list[state.exIndex]];
      const nSets = setsFor(ex, weekNumber(state.selectedDate), dayLog(state.selectedDate).highStress);
      const last = state.currentSet >= nSets - 1;
      startRest(Number(t.getAttribute("data-sec")), "Rest", last ? null : "next-set");
    } else if (act === "next-set") {
      markSetDone();
      const list = currentExerciseList();
      const ex = D.exercises[list[state.exIndex]];
      startRest(ex.rest, "Rest · then set " + (state.currentSet + 2), "next-set");
    } else if (act === "next-ex" || act === "skip-ex") {
      if (act === "next-ex") markSetDone();
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
    } else if (act === "skip-rest") {
      skipRest();
    } else if (act === "step") {
      const field = t.getAttribute("data-field");
      const idx = Number(t.getAttribute("data-set"));
      const exId = t.getAttribute("data-ex");
      const delta = Number(t.getAttribute("data-delta"));
      const log = dayLog(state.selectedDate);
      const cur = ((log.exercises[exId] || [])[idx] || {})[field];
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
    const t = e.target.closest("[data-act='log']");
    if (!t) return;
    writeSet(state.selectedDate, t.getAttribute("data-ex"), Number(t.getAttribute("data-set")), t.getAttribute("data-field"), t.value);
  });

  $overlay.addEventListener("click", function (e) {
    const t = e.target.closest("[data-act]");
    if (!t) return;
    if (t.getAttribute("data-act") === "skip-rest") skipRest();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      if (state.rest) tickRest();
      render();
    }
  });

  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  try {
    restoreUI();
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
