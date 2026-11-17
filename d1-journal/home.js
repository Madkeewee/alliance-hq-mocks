/* d1-journal home: the caption, the event strips, the tools, diplomacy and council. */
(function () {
  "use strict";
  const { $, esc, tearAll, pad } = window.Journal;

  /* ---------- events as paper strips with ticking countdowns ---------- */
  const start = Date.now();
  const events = [...HQ.season.sample.events].sort((a, b) => a.inMinutes - b.inMinutes);
  const tilts = [-1.1, .9, -.5, 1.3], shifts = [0, 26, 8, 34];
  function drawStrips() {
    $("#strips").innerHTML = events.map((ev, i) => `
      <li class="strip torn ${i === 0 ? "is-next" : ""}" data-seed="${201 + i * 7}" style="--tilt:${tilts[i]}deg;--shift:${shifts[i]}px">
        ${i === 0 ? '<svg class="pin" aria-hidden="true"><use href="#pin"/></svg>' : '<span class="tape" aria-hidden="true"></span>'}
        <svg class="stamp" aria-hidden="true"><use href="#st-${ev.kind}"/></svg>
        <span class="strip-name">${esc(ev.name)}</span>
        <span class="strip-when">${esc(ev.when)}</span>
        <span class="strip-note">${esc(ev.note)}</span>
        <span class="strip-time" data-min="${ev.inMinutes}"><span class="t"></span><small>${i === 0 ? "until it starts" : ""}</small></span>
      </li>`).join("");
    tearAll($("#strips"));
    tick();
  }
  function tick() {
    const now = Date.now();
    document.querySelectorAll(".strip-time").forEach(el => {
      let s = Math.max(0, Math.round((start + el.dataset.min * 60000 - now) / 1000));
      const d = Math.floor(s / 86400); s %= 86400;
      el.querySelector(".t").textContent = (d ? d + "d " : "") + `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`;
    });
  }
  setInterval(tick, 1000);

  /* ---------- week tally under the caption ---------- */
  function drawTally() {
    const { week, weeks } = HQ.season.sample;
    let out = "";
    for (let i = 0; i < weeks; i++) {
      const x = 8 + i * 20 + (i >= 5 ? 14 : 0), done = i < week;
      out += `<path d="M${x} 5 l${(i % 3) - 1} 26" stroke="${done ? "#ece4d2" : "#7f9e9d"}" stroke-width="${done ? 4 : 2}" stroke-linecap="round" opacity="${done ? 1 : .8}" />`;
    }
    $("#tallyMarks").innerHTML = out;
  }

  /* ---------- portraits ---------- */
  function portrait(a, who) {
    const art = a.art;
    if (a.tag === "GIR") {
      const src = who === "r5" ? art.r5Portrait : art.portraits[who];
      return `class="portrait" style="background-image:url('${src || ""}')"`;
    }
    if (who === "r5") return `class="portrait sprite" style="background-image:url('${art.sprite}');background-position:0% 0%"`;
    const i = a.r4.indexOf(who);
    if (i >= 10) return `class="portrait" style="background-image:url('${art.ninna}')"`;
    const cell = i + 1, col = cell % 4, row = Math.floor(cell / 4);
    return `class="portrait sprite" style="background-image:url('${art.sprite}');background-position:${(col * 100 / 3).toFixed(2)}% ${row * 50}%"`;
  }

  /* ---------- alliance skin ---------- */
  function drawAlliance(a) {
    $("#heroArt").src = a.art.hero;
    $("#calcArt").src = a.art.calculators;
    $("#planArt").src = a.art.planner;
    $("#napNum").textContent = `NAP ${a.nap.number}`;
    $("#napNote").textContent = a.nap.note;
    $("#allies").innerHTML = a.allies.map(t => `<li><bdi>${esc(t)}</bdi></li>`).join("");
    $("#interBlock").hidden = !a.interStateNap.length;
    $("#inter").innerHTML = a.interStateNap.map(n => `<li><b>${esc(n.state)}</b><bdi>${esc(n.alliance)}</bdi></li>`).join("");
    $("#r5Name").textContent = a.r5;
    $("#r5Portrait").outerHTML = `<span id="r5Portrait" ${portrait(a, "r5")}></span>`;
    $("#r4").innerHTML = a.r4.map(n =>
      `<li><figure class="print"><span ${portrait(a, n)}></span><figcaption><bdi>${esc(n)}</bdi></figcaption></figure></li>`).join("");
  }
  document.addEventListener("hq:alliance", e => drawAlliance(e.detail));

  const notice = HQ.season.notice.replace(/^Pre-release briefing\s*[—-]\s*/, "");
  $("#noticeText").textContent = notice.charAt(0).toUpperCase() + notice.slice(1);
  drawTally();
  drawStrips();
  HQ.init();
  tearAll();
})();
