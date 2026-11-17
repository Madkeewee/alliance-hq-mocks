/* d6 Squad Select — home. Renders from window.HQ via D6; never edits hq.js. */
(function () {
  "use strict";
  const { esc, chevrons, padlock, council, numberWords } = D6;
  const $ = id => document.getElementById(id);
  const loadedAt = Date.now();
  let tag = "DGF", A = HQ.alliances.DGF, selected = 0, tickTimer = null;

  const napSeal = n => `<svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true"><path d="M28 2 51 15v26L28 54 5 41V15z" fill="#3b4552" stroke="#55617080"/><path d="M28 8 46 18.5v19L28 48 10 37.5v-19z" fill="none" stroke="#efe7d4" stroke-opacity=".35"/><text x="28" y="37" text-anchor="middle" font-family="Big Shoulders Display, Arial Narrow, sans-serif" font-weight="800" font-size="26" fill="#efe7d4">${n}</text></svg>`;

  function render() {
    ({ tag, A } = D6.applyAlliance());
    document.title = `${A.name} ${tag} HQ`;
    renderMotto(localStorage.getItem("hq-mock-lang") || "en");
    renderSeason();
    renderEvents();
    renderStrip();
    select(0);
    renderTiles();
    renderPacts();
  }

  function renderMotto(code) {
    $("motto").textContent = A.motto ? (code === "en" ? A.motto : (HQ.motto[code] || A.motto)) : "";
  }

  function renderSeason() {
    const s = HQ.season, w = s.sample.week, n = s.sample.weeks, left = n - w;
    $("seasonName").textContent = s.short;
    $("weekLine").innerHTML = `<span class="week-num">Week ${w}</span><span class="week-of">of ${n}</span>`;
    $("weekNext").textContent = `${numberWords[left][0].toUpperCase()}${numberWords[left].slice(1)} weeks until Mining Site and Pass ownership locks and the fight for the Ark Core.`;
    $("brief").textContent = "Pre-release briefing from ATLANTISHUB's v474 client research, 13 November 2026. Confirm dates, rules and payouts in game.";
  }

  const routeFor = kind => kind === "bgb" ? ["planner.html", "Open the planner"] : kind === "settlement" ? ["calc.html#crystals", "Estimate crystals"] : null;
  function renderEvents() {
    const evs = [...HQ.season.sample.events].sort((a, b) => a.inMinutes - b.inMinutes);
    $("events").innerHTML = evs.map((e, i) => {
      const route = i === 0 ? routeFor(e.kind) : null;
      return `<li class="${i === 0 ? "first" : ""}">
        <div class="ev-name">${esc(e.name)}</div>
        <div class="ev-row"><span class="ev-time" data-due="${loadedAt + e.inMinutes * 60000}"></span><span class="ev-when">${esc(e.when)}</span></div>
        <div class="ev-note">${esc(e.note)}</div>
        ${route ? `<a class="btn" href="${route[0]}">${route[1]}</a>` : ""}
      </li>`;
    }).join("");
    tick();
    clearInterval(tickTimer);
    tickTimer = setInterval(tick, 1000);
  }
  function tick() {
    const now = Date.now();
    document.querySelectorAll(".ev-time").forEach(el => {
      let s = Math.max(0, Math.round((Number(el.dataset.due) - now) / 1000));
      const d = Math.floor(s / 86400); s -= d * 86400;
      const h = Math.floor(s / 3600); s -= h * 3600;
      const m = Math.floor(s / 60); s -= m * 60;
      const p = v => String(v).padStart(2, "0");
      el.innerHTML = `${d ? `<small>${d}d</small>` : ""}${p(h)}:${p(m)}:${p(s)}`;
    });
  }

  function renderStrip() {
    const list = council(tag);
    $("councilTab").textContent = `Council ${list.length}`;
    $("strip").innerHTML = list.map((p, i) => `
      <button type="button" class="slot" style="--i:${i}" data-i="${i}" aria-pressed="false" aria-label="${esc(p.name)}, R${p.rank}">
        <span class="cell">${p.style ? `<span class="portrait" style="${p.style}"></span>` : D6.silhouette}</span>
        <span class="slot-name" aria-hidden="true"><bdi>${esc(p.name)}</bdi></span>
      </button>`).join("");
  }
  function select(i) {
    const list = council(tag);
    const p = list[i] || list[0];
    selected = list.indexOf(p);
    document.querySelectorAll(".slot").forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.i) === selected)));
    $("bigPortrait").style.cssText = p.style;
    $("rank").innerHTML = `${chevrons(p.rank)}<span>R${p.rank}</span>`;
    const longest = Math.max(...p.name.split(/\s+/).map(w => w.length));
    $("personName").className = `person-name ${longest > 13 ? "longer" : longest > 10 ? "long" : ""}`;
    $("personName").innerHTML = `<bdi>${esc(p.name)}</bdi>`;
    $("personRole").textContent = p.rank === 5 ? `Leads ${A.name}` : `${A.name} council`;
  }

  function renderTiles() {
    const tiles = [
      { name: "Calculators", note: "Speedups, research, crystals, capture", href: "calc.html", art: A.art.calculators },
      { name: "Planner", note: "Black Gold Battlefield roster and map", href: "planner.html", art: A.art.planner },
      { name: "Season", note: "Coming in the full build", href: "#", art: A.art.season, locked: "season" },
      { name: "Tips", note: "Coming in the full build", href: "#", art: A.art.tips, locked: "tips" }
    ];
    $("tiles").innerHTML = tiles.map(t => `
      <li><a class="tile ${t.locked ? "locked" : ""}" href="${t.href}" ${t.locked ? `data-locked="${t.locked}" id="tile-${t.locked}"` : ""}>
        <span class="tile-art" style="--art:url(${t.art})"></span>
        ${t.locked ? `<span class="lock">${padlock}</span>` : ""}
        <span class="tile-body"><span class="tile-name">${t.name}</span><span class="tile-note">${t.note}</span></span>
      </a></li>`).join("");
  }

  function renderPacts() {
    const allies = A.allies.map(a => `<span class="pact-tag"><bdi>${esc(a)}</bdi></span>`).join("");
    const inter = A.interStateNap.length ? `
      <div class="pact-row"><span class="pact-label">Inter-state NAP</span>
        <ul class="inter">${A.interStateNap.map(x => `<li><span class="state">${esc(x.state)}</span><bdi>${esc(x.alliance)}</bdi></li>`).join("")}</ul></div>` : "";
    $("pacts").innerHTML = `
      <div class="nap">${napSeal(A.nap.number)}<div><div class="nap-title">NAP ${A.nap.number}</div><div class="nap-note">${esc(A.nap.note)}</div></div></div>
      <div class="pact-row"><span class="pact-label">Allies</span><div class="pact-tags">${allies}</div></div>
      ${inter}`;
  }

  document.addEventListener("hq:lang", e => renderMotto(e.detail.code));
  document.addEventListener("hq:alliance", render);

  document.addEventListener("click", e => {
    const slot = e.target.closest(".slot");
    if (slot) { select(Number(slot.dataset.i)); return; }
    const locked = e.target.closest("[data-locked]");
    if (locked) {
      e.preventDefault();
      const which = locked.dataset.locked === "season" ? "Season" : "Tips";
      $("lockedMsg").textContent = `${which} is coming in the full build.`;
      const tile = $(`tile-${locked.dataset.locked}`);
      if (tile && !locked.classList.contains("tile")) tile.scrollIntoView({ block: "center" });
    }
  });
  document.addEventListener("keydown", e => {
    if (!e.target.classList.contains("slot") || !["ArrowRight", "ArrowLeft"].includes(e.key)) return;
    const rtl = document.documentElement.dir === "rtl";
    const dir = (e.key === "ArrowRight") !== rtl ? 1 : -1;
    const next = document.querySelector(`.slot[data-i="${selected + dir}"]`);
    if (next) { e.preventDefault(); next.focus(); select(selected + dir); }
  });

  D6.buildLang();
  HQ.init();
  $("stage").classList.add("deal");
  setTimeout(() => $("stage").classList.remove("deal"), 1600);
})();
