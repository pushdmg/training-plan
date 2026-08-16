/* BotFit lift stills — one start-position line diagram per lift. */
(function () {
  "use strict";

  var W = "#ffffff";
  var A = "#CCFF00";

  function svg(inner, h) {
    h = h || 200;
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ' +
      h +
      '" width="360" height="' +
      h +
      '" focusable="false" aria-hidden="true">' +
      '<rect width="360" height="' +
      h +
      '" fill="#000"/>' +
      inner +
      "</svg>"
    );
  }
  function st(color, w) {
    return (
      'fill="none" stroke="' +
      color +
      '" stroke-width="' +
      (w || 3) +
      '" stroke-linecap="round" stroke-linejoin="round"'
    );
  }
  function line(x1, y1, x2, y2, color, w) {
    return (
      '<line x1="' +
      x1 +
      '" y1="' +
      y1 +
      '" x2="' +
      x2 +
      '" y2="' +
      y2 +
      '" ' +
      st(color || W, w) +
      "/>"
    );
  }
  function circ(cx, cy, r, color, w) {
    return (
      '<circle cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="' +
      r +
      '" ' +
      st(color || W, w) +
      "/>"
    );
  }
  function poly(pts, color, w) {
    return '<polyline points="' + pts + '" ' + st(color || W, w) + "/>";
  }
  function rect(x, y, rw, rh, color, w) {
    return (
      '<rect x="' +
      x +
      '" y="' +
      y +
      '" width="' +
      rw +
      '" height="' +
      rh +
      '" ' +
      st(color || W, w) +
      "/>"
    );
  }
  function head(cx, cy) {
    return circ(cx, cy, 10);
  }

  var ALIAS = {
    "db-press-circuit": "incline-db-press",
    "cable-row-circuit": "seated-row",
    "goblet-circuit": "goblet"
  };

  var STILLS = {
    "hs-chest-press": svg(
      rect(70, 70, 90, 14) +
        rect(70, 84, 16, 70) +
        line(86, 154, 130, 154) +
        line(70, 70, 70, 40) +
        line(70, 40, 200, 40) +
        line(200, 40, 200, 88) +
        head(148, 58) +
        line(148, 68, 148, 110) +
        line(148, 80, 118, 92) +
        line(148, 80, 178, 92) +
        line(148, 110, 132, 148) +
        line(148, 110, 168, 148) +
        circ(118, 92, 7, A) +
        circ(178, 92, 7, A)
    ),
    "incline-db-press": svg(
      line(80, 160, 250, 160) +
        line(100, 160, 150, 70) +
        line(150, 70, 250, 70) +
        head(188, 58) +
        line(180, 68, 150, 108) +
        line(150, 88, 128, 98) +
        line(162, 80, 186, 96) +
        line(150, 108, 138, 148) +
        line(150, 108, 172, 148) +
        circ(128, 98, 8, A) +
        circ(186, 96, 8, A)
    ),
    "sa-cable-press": svg(
      line(40, 40, 40, 170) +
        line(40, 40, 70, 40) +
        line(70, 88, 150, 88, A) +
        head(168, 52) +
        line(168, 62, 168, 118) +
        line(168, 80, 150, 88) +
        line(168, 80, 196, 104) +
        line(168, 118, 148, 168) +
        line(168, 118, 196, 148) +
        line(196, 148, 220, 168) +
        circ(150, 88, 6, A)
    ),
    "db-lateral": svg(
      head(180, 42) +
        line(180, 52, 180, 118) +
        line(180, 70, 118, 92) +
        line(180, 70, 242, 92) +
        line(180, 118, 156, 170) +
        line(180, 118, 204, 170) +
        circ(118, 92, 8, A) +
        circ(242, 92, 8, A)
    ),
    "triceps-pressdown": svg(
      line(80, 36, 200, 36) +
        line(140, 36, 140, 70, A) +
        line(118, 70, 162, 70, A) +
        head(140, 48) +
        line(140, 58, 140, 124) +
        line(140, 78, 118, 70) +
        line(140, 78, 162, 70) +
        line(118, 70, 118, 118) +
        line(162, 70, 162, 118) +
        line(140, 124, 122, 170) +
        line(140, 124, 158, 170)
    ),
    pallof: svg(
      line(40, 40, 40, 170) +
        line(40, 88, 168, 88, A) +
        head(180, 46) +
        line(180, 56, 180, 120) +
        line(180, 78, 168, 88) +
        line(168, 88, 248, 88) +
        line(180, 120, 160, 170) +
        line(180, 120, 200, 170) +
        circ(168, 88, 5, A)
    ),
    "front-plank": svg(
      head(78, 92) +
        line(88, 100, 250, 100) +
        line(88, 100, 70, 128) +
        line(70, 128, 108, 128) +
        line(250, 100, 270, 128) +
        line(108, 128, 70, 128, A, 2)
    ),
    "assisted-pullup": svg(
      line(90, 36, 270, 36) +
        line(130, 36, 130, 58, A) +
        line(230, 36, 230, 58, A) +
        head(180, 70) +
        line(180, 80, 180, 128) +
        line(180, 88, 130, 58) +
        line(180, 88, 230, 58) +
        line(180, 128, 160, 150) +
        line(180, 128, 200, 150) +
        rect(150, 150, 60, 12, A)
    ),
    "seated-row": svg(
      line(40, 40, 40, 170) +
        line(40, 118, 150, 118, A) +
        line(80, 160, 220, 160) +
        head(196, 70) +
        line(196, 80, 176, 128) +
        line(176, 100, 150, 118) +
        line(176, 128, 160, 160) +
        line(176, 128, 200, 160) +
        circ(150, 118, 6, A)
    ),
    "db-rdl": svg(
      head(168, 48) +
        line(168, 58, 150, 108) +
        line(150, 108, 176, 118) +
        line(150, 80, 138, 128) +
        line(176, 118, 168, 168) +
        line(176, 118, 200, 168) +
        circ(138, 128, 8, A) +
        circ(158, 130, 8, A)
    ),
    "sa-cable-row": svg(
      line(40, 40, 40, 170) +
        line(40, 108, 150, 124, A) +
        head(200, 46) +
        line(200, 56, 200, 118) +
        line(200, 80, 150, 124) +
        line(200, 80, 230, 100) +
        line(200, 118, 176, 170) +
        line(200, 118, 230, 160) +
        circ(150, 124, 6, A)
    ),
    "face-pull": svg(
      line(50, 40, 50, 170) +
        line(50, 70, 150, 70, A) +
        line(150, 70, 168, 58, A) +
        line(150, 70, 168, 82, A) +
        head(196, 50) +
        line(196, 60, 196, 122) +
        line(196, 72, 168, 58) +
        line(196, 78, 168, 82) +
        line(196, 122, 176, 170) +
        line(196, 122, 216, 170)
    ),
    "db-curl": svg(
      head(180, 42) +
        line(180, 52, 180, 120) +
        line(180, 78, 160, 78) +
        line(160, 78, 160, 58) +
        line(180, 78, 200, 78) +
        line(200, 78, 200, 58) +
        line(180, 120, 158, 170) +
        line(180, 120, 202, 170) +
        circ(160, 50, 8, A) +
        circ(200, 50, 8, A)
    ),
    suitcase: svg(
      head(170, 42) +
        line(170, 52, 170, 118) +
        line(170, 70, 148, 118) +
        line(170, 70, 196, 90) +
        line(170, 118, 154, 170) +
        line(170, 118, 198, 164) +
        circ(148, 128, 10, A)
    ),
    goblet: svg(
      head(180, 56) +
        line(180, 66, 180, 118) +
        line(180, 80, 164, 96) +
        line(180, 80, 196, 96) +
        line(180, 118, 150, 150) +
        line(180, 118, 210, 150) +
        line(150, 150, 150, 170) +
        line(210, 150, 210, 170) +
        circ(180, 100, 10, A)
    ),
    "split-squat": svg(
      head(168, 40) +
        line(168, 50, 168, 110) +
        line(168, 70, 150, 100) +
        line(168, 70, 186, 100) +
        line(168, 110, 130, 168) +
        line(168, 110, 200, 148) +
        line(200, 148, 210, 168) +
        circ(150, 104, 6, A) +
        circ(186, 104, 6, A)
    ),
    "step-up": svg(
      rect(200, 128, 90, 32) +
        head(168, 40) +
        line(168, 50, 168, 108) +
        line(168, 70, 150, 100) +
        line(168, 70, 186, 90) +
        line(168, 108, 150, 168) +
        line(168, 108, 220, 128) +
        circ(150, 104, 6, A) +
        circ(186, 94, 6, A)
    ),
    "leg-machine": svg(
      rect(90, 70, 80, 14) +
        rect(90, 84, 16, 70) +
        line(106, 154, 200, 154) +
        line(200, 154, 200, 120) +
        line(180, 120, 230, 120, A) +
        head(158, 58) +
        line(158, 68, 158, 110) +
        line(158, 110, 140, 154) +
        line(158, 110, 190, 120)
    ),
    woodchop: svg(
      line(50, 36, 50, 170) +
        line(50, 36, 80, 36) +
        line(80, 50, 210, 140, A) +
        head(168, 48) +
        line(168, 58, 168, 118) +
        line(168, 72, 140, 70) +
        line(140, 70, 210, 140) +
        line(168, 118, 148, 170) +
        line(168, 118, 196, 168)
    ),
    "side-plank": svg(
      head(78, 78) +
        line(88, 86, 250, 86) +
        line(88, 86, 70, 128) +
        line(70, 128, 100, 128) +
        line(250, 86, 268, 86) +
        line(250, 86, 250, 128, A, 2)
    ),
    "lat-pulldown": svg(
      line(80, 36, 280, 36) +
        line(110, 36, 110, 78, A) +
        line(250, 36, 250, 78, A) +
        line(110, 78, 250, 78, A) +
        rect(130, 118, 100, 14) +
        rect(130, 132, 16, 38) +
        head(180, 96) +
        line(180, 106, 180, 132) +
        line(180, 112, 110, 78) +
        line(180, 112, 250, 78) +
        line(180, 132, 160, 170) +
        line(180, 132, 200, 170)
    ),
    "chest-row": svg(
      line(80, 160, 260, 160) +
        line(100, 160, 160, 80) +
        line(160, 80, 260, 80) +
        head(200, 68) +
        line(188, 78, 160, 118) +
        line(168, 96, 150, 128) +
        line(176, 90, 196, 124) +
        circ(150, 132, 8, A) +
        circ(196, 128, 8, A)
    ),
    "rear-delt": svg(
      line(50, 40, 50, 170) +
        line(310, 40, 310, 170) +
        line(50, 70, 130, 100, A) +
        line(310, 70, 230, 100, A) +
        head(180, 48) +
        line(180, 58, 180, 120) +
        line(180, 78, 130, 100) +
        line(180, 78, 230, 100) +
        line(180, 120, 160, 170) +
        line(180, 120, 200, 170)
    ),
    "assisted-dip": svg(
      line(120, 40, 120, 80) +
        line(240, 40, 240, 80) +
        line(120, 80, 240, 80, A) +
        head(180, 58) +
        line(180, 68, 180, 130) +
        line(180, 80, 120, 80) +
        line(180, 80, 240, 80) +
        line(180, 130, 164, 168) +
        line(180, 130, 196, 168) +
        rect(150, 148, 60, 10)
    ),
    "hammer-curl": svg(
      head(180, 42) +
        line(180, 52, 180, 120) +
        line(180, 78, 158, 78) +
        line(158, 78, 158, 56) +
        line(180, 78, 202, 78) +
        line(202, 78, 202, 56) +
        line(180, 120, 158, 170) +
        line(180, 120, 202, 170) +
        line(154, 44, 154, 68, A) +
        line(206, 44, 206, 68, A) +
        circ(154, 40, 5, A) +
        circ(206, 40, 5, A)
    ),
    "cable-er": svg(
      line(50, 40, 50, 170) +
        line(50, 108, 150, 108, A) +
        head(180, 46) +
        line(180, 56, 180, 120) +
        line(180, 78, 150, 108) +
        line(150, 108, 210, 108) +
        line(180, 78, 210, 90) +
        line(180, 120, 160, 170) +
        line(180, 120, 200, 170) +
        circ(210, 108, 6, A)
    ),
    "db-shrug": svg(
      head(180, 36) +
        line(180, 46, 180, 118) +
        line(180, 62, 150, 62) +
        line(150, 62, 150, 118) +
        line(180, 62, 210, 62) +
        line(210, 62, 210, 118) +
        line(180, 118, 160, 170) +
        line(180, 118, 200, 170) +
        circ(150, 126, 8, A) +
        circ(210, 126, 8, A)
    ),
    "neck-iso": svg(
      head(180, 70) +
        line(180, 80, 180, 130) +
        line(180, 96, 150, 120) +
        line(180, 96, 210, 88) +
        line(210, 88, 196, 62) +
        line(180, 130, 160, 170) +
        line(180, 130, 200, 170) +
        circ(196, 56, 6, A)
    ),
    "kb-deadlift": svg(
      head(180, 44) +
        line(180, 54, 164, 108) +
        line(164, 108, 186, 118) +
        line(164, 80, 180, 150) +
        line(186, 118, 168, 168) +
        line(186, 118, 204, 168) +
        circ(180, 158, 12, A)
    ),
    "farmer-carry": svg(
      head(180, 42) +
        line(180, 52, 180, 118) +
        line(180, 70, 152, 118) +
        line(180, 70, 208, 118) +
        line(180, 118, 162, 168) +
        line(180, 118, 204, 164) +
        circ(152, 128, 9, A) +
        circ(208, 128, 9, A)
    ),
    "opt-spin": svg(
      circ(150, 140, 28) +
        circ(230, 140, 28) +
        line(150, 140, 190, 100) +
        line(230, 140, 190, 100) +
        line(190, 100, 190, 70) +
        line(190, 70, 230, 58) +
        line(190, 78, 160, 90) +
        head(238, 46) +
        line(230, 58, 210, 100) +
        line(160, 90, 150, 140, A)
    )
  };

  window.liftStill = function (exId) {
    var id = ALIAS[exId] || exId;
    return STILLS[id] || STILLS["hs-chest-press"];
  };
})();
