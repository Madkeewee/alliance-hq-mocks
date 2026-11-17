/* d3-poster · home page. */
(function () {
  "use strict";
  const { esc, pad, portraitHTML } = Poster;
  const $ = id => document.getElementById(id);

  // Event sentences (hq.js stores dotted meta strings; written out as sentences here) and the one action each kind leads to.
  const kinds = {
    bgb: { when: "Saturday 20:00 server time. Team A, 20 starters.", go: "Open the BGB plan", href: "planner.html" },
    battle: { when: "Thursday 12:00 server time. One hour, weekly from Week 3.", go: "Read the season guide", href: "#season" },
    invasion: { when: "Sunday, server time. Enemy-camp targets open.", go: "Read the tips", href: "#tips" },
    settlement: { when: "Monday 00:00 server time. Aberrant Crystals pay out.", go: "Estimate crystals", href: "calc.html#crystals" }
  };

  /* ---------- countdown ---------- */
  const loadedAt = Date.now();
  const events = HQ.season.sample.events.map(e => ({ ...e, at: loadedAt + e.inMinutes * 60000 })).sort((a, b) => a.at - b.at);
  const next = events[0], rest = events.slice(1);

  function bigFormat(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return d ? `<span class="days">${d}d</span> ${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(h)}:${pad(m)}:${pad(sec)}`;
  }
  function shortFormat(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    if (d) return `${d}d ${pad(h)}h`;
    if (h) return `${h}h ${pad(m)}m`;
    return `${m}m ${pad(s % 60)}s`;
  }

  $("nextName").textContent = next.name;
  $("nextWhen").textContent = kinds[next.kind].when;
  $("nextGo").textContent = kinds[next.kind].go;
  $("nextGo").href = kinds[next.kind].href;
  $("nextTime").dateTime = new Date(next.at).toISOString();
  $("others").innerHTML = rest.map(e => `<li><span class="num" data-at="${e.at}"></span><span class="nm">${esc(e.name)}</span><span class="wh">${esc(kinds[e.kind].when)}</span></li>`).join("");
  const nums = [...document.querySelectorAll("#others .num")];
  function tick() {
    const now = Date.now();
    $("nextTime").innerHTML = bigFormat(next.at - now);
    nums.forEach(n => { n.textContent = shortFormat(Number(n.dataset.at) - now); });
  }
  tick();
  setInterval(tick, 1000);

  $("note").textContent = "Event times on this page are sample data for the mockup. " + HQ.season.notice.replace(" — ", ": ");

  /* ---------- alliance ---------- */
  function renderMotto(code) {
    const a = Poster.currentAlliance();
    $("motto").textContent = a.motto ? (HQ.motto[code] || HQ.motto.en) : "";
  }

  Poster.onAlliance(a => {
    const [first, ...others] = a.name.split(" ");
    $("name1").textContent = first;
    $("name2").textContent = others.join(" ");
    renderMotto(document.documentElement.lang);

    $("heroArt").src = a.art.hero;
    $("calcArt").src = a.art.calculators;
    $("planArt").src = a.art.bgb;
    $("seasonArt").src = a.art.season;
    $("tipsArt").src = a.art.tips;

    $("napNum").textContent = `NAP ${a.nap.number}`;
    $("napNote").textContent = a.nap.note;
    $("allies").innerHTML = a.allies.map(t => `<bdi>${esc(t)}</bdi>`).join("");
    const inter = $("inter");
    inter.hidden = !a.interStateNap.length;
    $("interList").innerHTML = a.interStateNap.map(n => `<li><span class="st">${esc(n.state)}</span><bdi>${esc(n.alliance)}</bdi></li>`).join("");

    $("r5Portrait").innerHTML = portraitHTML(a, a.r5, -1);
    $("r5Name").innerHTML = `<bdi>${esc(a.r5)}</bdi>`;
    $("council").innerHTML = a.r4.map((n, i) => `<li><span class="portrait">${portraitHTML(a, n, i)}</span><bdi>${esc(n)}</bdi></li>`).join("");
  });
  Poster.onLang(code => renderMotto(code));
})();
