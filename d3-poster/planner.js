/* d3-poster · Black Gold Battlefield planner. Assignment logic and plan text come from hq.js; this file keeps the roster, swaps and rendering. */
(function () {
  "use strict";
  const { esc } = Poster;
  const $ = id => document.getElementById(id);
  const KEY = tag => `d3-bgb-${tag}`;
  const errorFor = n => `Starter ${n} needs a unique name and positive CP. Example: 350M.`;

  let a = null, state = null, plan = null, stale = false, staleMsg = "", errors = new Map(), pick = null, selObj = null;

  /* ---------- state ---------- */
  function load(tag) {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY(tag)) || "null"); } catch (e) { s = null; }
    if (!s || !Array.isArray(s.players)) {
      s = { team: "A", players: HQ.roster(tag).map(p => ({ name: p.name, cpText: p.cpText, A: p.starter, B: p.starter })), swaps: { A: [], B: [] }, lastPlan: { A: null, B: null } };
    }
    s.swaps = s.swaps || { A: [], B: [] }; s.lastPlan = s.lastPlan || { A: null, B: null };
    state = s;
  }
  const save = () => { try { localStorage.setItem(KEY(a.tag), JSON.stringify(state)); } catch (e) { /* storage unavailable */ } };
  const team = () => state.team;
  const starters = () => state.players.map((p, i) => ({ ...p, i })).filter(p => p[team()]);

  function slot(pl, id) {
    const m = /^p(\d+)m(\d+)$/.exec(id);
    return m ? pl.pairs[+m[1]].members[+m[2]] : pl.floaters[+id.slice(1)];
  }
  function applySwaps(pl, swaps) {
    swaps.forEach(([x, y]) => {
      const sx = slot(pl, x), sy = slot(pl, y);
      [sx.name, sy.name] = [sy.name, sx.name];
      [sx.cp, sy.cp] = [sy.cp, sx.cp];
    });
    pl.pairs.forEach(p => { p.cp = p.members.reduce((s, m) => s + m.cp, 0); });
    return pl;
  }

  function compute() {
    const list = starters();
    errors = new Map();
    const seen = new Map();
    list.forEach((p, k) => {
      const name = p.name.trim(), cp = HQ.readPower(p.cpText);
      const dup = seen.has(name); seen.set(name, true);
      if (!name || dup || !cp) errors.set(p.i, errorFor(k + 1));
    });
    if (!errors.size && list.length === 20) {
      const base = HQ.assign(list.map(p => ({ name: p.name.trim(), cp: HQ.readPower(p.cpText) })));
      plan = applySwaps(base, state.swaps[team()]);
      state.lastPlan[team()] = plan;
      stale = false; staleMsg = "";
    } else {
      plan = state.lastPlan[team()];
      stale = true;
      staleMsg = errors.size ? "Fix the roster below, then the lineup updates." : `Select exactly 20 starters for Team ${team()}. You selected ${list.length}.`;
    }
    save();
  }

  /* ---------- render: fight card ---------- */
  const cpText = cp => HQ.compactCp(cp);
  function who(id, m, extra = "") {
    const swapped = state.swaps[team()].some(s => s.includes(id));
    return `<button type="button" class="who${swapped ? " swapped" : ""}${pick === id ? " pick" : ""}" data-slot="${id}" aria-pressed="${pick === id}"><bdi>${esc(m.name)}</bdi><span class="cp">${cpText(m.cp)}</span>${extra}</button>`;
  }
  function renderCard() {
    const card = $("card");
    if (!plan) { card.innerHTML = `<li class="row"><p>No lineup yet. Pick 20 valid starters in the roster.</p></li>`; return; }
    card.innerHTML = plan.pairs.map((p, i) => `<li class="row${selObj === p.objective.id ? " sel" : ""}" data-obj="${p.objective.id}" style="--c:${p.objective.color}">
        <button type="button" class="code" data-obj="${p.objective.id}" aria-pressed="${selObj === p.objective.id}" aria-label="${esc(p.objective.name)}, show on map">${p.objective.id}</button>
        <div class="obj"><span class="oname">${esc(p.objective.name)}</span><span class="timing">${esc(p.objective.timing)}</span></div>
        <div class="names">${p.members.map((m, j) => who(`p${i}m${j}`, m)).join("")}</div>
        <span class="pair">${cpText(p.cp)}<small>pair CP</small></span>
      </li>`).join("") +
      `<li class="row floaters${selObj === "F" ? " sel" : ""}" data-obj="F" style="--c:${HQ.floaterPin.color}">
        <button type="button" class="code" data-obj="F" aria-pressed="${selObj === "F"}" aria-label="Floaters, show on map">F</button>
        <div class="obj"><span class="oname">Floaters</span><span class="timing">${esc(HQ.floaterPin.timing)}</span></div>
        <div class="names">${plan.floaters.map((m, k) => who(`f${k}`, m, `<span class="duty">${esc(m.duty)}</span>`)).join("")}</div>
      </li>`;
    card.querySelectorAll(".who").forEach(b => b.addEventListener("click", () => onPick(b.dataset.slot)));
    card.querySelectorAll(".code").forEach(b => b.addEventListener("click", () => selectObj(b.dataset.obj)));
  }
  function renderState() {
    $("planState").innerHTML = stale ? `<span class="alert">Stale</span><span>${esc(staleMsg)}</span>` : (state.swaps[team()].length ? `Live from the roster, with ${state.swaps[team()].length} manual swap${state.swaps[team()].length > 1 ? "s" : ""}.` : "Live from the roster.");
    $("undo").hidden = !state.swaps[team()].length;
    $("count").textContent = `Team ${team()} · ${starters().length} / 20 starters`;
    document.querySelectorAll(".team").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.team === team())));
    $("planText").value = plan ? HQ.planText(a.tag, team(), plan) : "";
  }

  function onPick(id) {
    if (pick === null) pick = id;
    else if (pick === id) pick = null;
    else { state.swaps[team()].push([pick, id]); pick = null; compute(); }
    renderCard(); renderState();
  }
  $("undo").addEventListener("click", () => { state.swaps[team()].pop(); pick = null; compute(); renderCard(); renderState(); });

  /* ---------- map ---------- */
  function renderMap() {
    $("mapArt").setAttribute("href", a.art.map);
    $("mapLabels").innerHTML = HQ.mapLabels.map(l => `<text x="${l.x}" y="${l.y}">${esc(l.text.replace("{TAG}", a.tag))}</text>`).join("");
    const pins = [...HQ.objectives, HQ.floaterPin];
    $("mapPins").innerHTML = pins.map(o => `<g class="pin${selObj === o.id ? " sel" : ""}" data-obj="${o.id}" tabindex="0" role="button" aria-pressed="${selObj === o.id}" aria-label="${esc(o.name)}"><circle cx="${o.x}" cy="${o.y}" r="20" fill="${o.color}"></circle><text x="${o.x}" y="${o.y + 1}">${o.id}</text></g>`).join("");
    $("mapPins").querySelectorAll(".pin").forEach(g => {
      g.addEventListener("click", () => selectObj(g.dataset.obj));
      g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectObj(g.dataset.obj); } });
    });
  }
  function selectObj(id) {
    selObj = selObj === id ? null : id;
    document.querySelectorAll(".row").forEach(r => r.classList.toggle("sel", r.dataset.obj === selObj));
    document.querySelectorAll(".code").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.obj === selObj)));
    document.querySelectorAll(".pin").forEach(g => { g.classList.toggle("sel", g.dataset.obj === selObj); g.setAttribute("aria-pressed", String(g.dataset.obj === selObj)); });
    if (selObj && window.matchMedia("(max-width: 900px)").matches) {
      const row = document.querySelector(`.row[data-obj="${selObj}"]`);
      if (row) row.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  /* ---------- roster ---------- */
  function renderRows() {
    $("rows").innerHTML = state.players.map((p, i) => `<li class="prow${errors.has(i) ? " bad" : ""}" data-i="${i}">
        <span class="idx">${i + 1}</span>
        <label class="in"><span>Name</span><input class="pname" value="${esc(p.name)}" maxlength="60" autocomplete="off"></label>
        <label class="in"><span>CP</span><input class="pcp" value="${esc(p.cpText)}" inputmode="text" placeholder="350M" autocomplete="off"></label>
        <button type="button" class="starter" aria-pressed="${p[team()]}">Starter</button>
        <p class="err" role="alert">${esc(errors.get(i) || "")}</p>
      </li>`).join("");
    $("rows").querySelectorAll(".prow").forEach(li => {
      const i = +li.dataset.i;
      li.querySelector(".pname").addEventListener("input", e => { state.players[i].name = e.target.value; afterEdit(); });
      li.querySelector(".pcp").addEventListener("input", e => { state.players[i].cpText = e.target.value; afterEdit(); });
      li.querySelector(".starter").addEventListener("click", () => { state.players[i][team()] = !state.players[i][team()]; compute(); renderRows(); renderCard(); renderState(); });
    });
  }
  function afterEdit() {
    compute();
    document.querySelectorAll(".prow").forEach(li => { const i = +li.dataset.i; li.classList.toggle("bad", errors.has(i)); li.querySelector(".err").textContent = errors.get(i) || ""; });
    renderCard(); renderState();
  }
  $("add").addEventListener("click", () => { state.players.push({ name: "", cpText: "", A: false, B: false }); save(); renderRows(); $("rows").lastElementChild.querySelector(".pname").focus(); });
  document.querySelectorAll(".team").forEach(b => b.addEventListener("click", () => { state.team = b.dataset.team; pick = null; compute(); renderRows(); renderCard(); renderState(); }));

  /* ---------- copy ---------- */
  $("copy").addEventListener("click", async () => {
    const text = $("planText").value;
    if (!text) { Poster.say("Nothing to copy yet: pick 20 valid starters first."); return; }
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = false; }
    if (!ok) {
      const ta = $("planText"); ta.closest("details").open = true; ta.focus(); ta.select();
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    }
    Poster.say(ok ? "Copied. Paste the plan into alliance chat." : "Copy failed. Select the text in Alliance chat message and copy it.");
  });

  /* ---------- alliance ---------- */
  Poster.onAlliance(al => {
    a = al; pick = null; selObj = null;
    load(a.tag); compute(); renderRows(); renderCard(); renderMap(); renderState();
    Poster.say("");
  });
})();
