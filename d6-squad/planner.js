/* d6 Squad Select — Black Gold Battlefield planner. Logic from HQ.assign / HQ.planText; squad slots here. */
(function () {
  "use strict";
  const { esc, cellHTML, lockedCell, portraitFor } = D6;
  const $ = id => document.getElementById(id);
  let tag = "DGF", A = HQ.alliances.DGF, S = null, stale = false, pick = null, hot = null;
  const KEY = () => `d6-bgb-${tag}`;

  /* ---------- state ---------- */
  function sample() {
    return { team: "A", players: HQ.roster(tag).map(p => ({ name: p.name, cpText: p.cpText, starter: { A: p.starter, B: false } })), swaps: { A: [], B: [] }, lastPlan: { A: null, B: null } };
  }
  function load() {
    S = null;
    try { const raw = localStorage.getItem(KEY()); if (raw) S = JSON.parse(raw); } catch (e) { S = null; }
    if (!S || !Array.isArray(S.players)) S = sample();
    S.swaps = S.swaps || { A: [], B: [] }; S.lastPlan = S.lastPlan || { A: null, B: null }; S.team = S.team === "B" ? "B" : "A";
  }
  const save = () => { try { localStorage.setItem(KEY(), JSON.stringify(S)); } catch (e) { /* keep working without storage */ } };
  const starters = () => S.players.filter(p => p.starter[S.team]);

  function validate() {
    const st = starters();
    const seen = new Map();
    S.players.forEach(p => { const k = p.name.trim().toLowerCase(); if (k) seen.set(k, (seen.get(k) || 0) + 1); });
    const errors = new Map();
    st.forEach((p, i) => {
      const k = p.name.trim().toLowerCase();
      const cp = HQ.readPower(p.cpText);
      if (!k || seen.get(k) > 1 || !(cp > 0)) errors.set(p, `Starter ${i + 1} needs a unique name and positive CP. Example: 350M.`);
    });
    return { st, errors, ok: st.length === 20 && errors.size === 0 };
  }

  /* positions in a plan: F0..F3, P<pair>.<member> */
  function slotsOf(plan) {
    const list = [];
    plan.floaters.forEach((m, i) => list.push({ key: `F${i}`, m }));
    plan.pairs.forEach((pr, j) => pr.members.forEach((m, k) => list.push({ key: `P${j}.${k}`, m })));
    return list;
  }
  function put(plan, key, m) {
    if (key[0] === "F") { plan.floaters[Number(key.slice(1))] = { name: m.name, cp: m.cp, duty: HQ.duties[Number(key.slice(1))] }; return; }
    const [j, k] = key.slice(1).split(".").map(Number);
    const pr = plan.pairs[j];
    pr.members[k] = { name: m.name, cp: m.cp };
    pr.cp = pr.members.reduce((s, p) => s + p.cp, 0);
  }
  function swapIn(plan, a, b) {
    const s = slotsOf(plan), x = s.find(o => o.m.name === a), y = s.find(o => o.m.name === b);
    if (!x || !y) return false;
    const mx = { ...x.m }, my = { ...y.m };
    put(plan, x.key, my); put(plan, y.key, mx);
    return true;
  }
  function compute() {
    const v = validate();
    if (v.ok) {
      let plan = HQ.assign(v.st.map(p => ({ name: p.name.trim(), cp: HQ.readPower(p.cpText) })));
      S.swaps[S.team] = S.swaps[S.team].filter(([a, b]) => swapIn(plan, a, b));
      S.lastPlan[S.team] = plan;
      stale = false;
    } else stale = true;
    save();
    render(v);
  }

  /* ---------- render ---------- */
  function render(v = validate()) {
    const plan = S.lastPlan[S.team];
    const st = v.st;
    $("count").textContent = `Team ${S.team} · ${st.length} / 20 starters`;
    document.querySelectorAll(".team-tab").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.team === S.team)));
    $("plan").classList.toggle("stale", stale && !!plan);
    $("staleTab").hidden = !(stale && plan);
    $("planState").textContent = !stale ? ""
      : plan ? (v.errors.size ? "Stale. Fix the roster below to refresh this plan." : `Stale. Team ${S.team} has ${st.length} of 20 starters; the plan below is the last one built.`)
        : (v.errors.size ? "Fix the roster below to build the plan." : `Team ${S.team} has ${st.length} of 20 starters. Tick 20 in the roster to build the plan.`);
    renderBoard(plan);
    renderRoster(v);
    renderMap();
    $("planText").value = plan ? HQ.planText(tag, S.team, plan) : "";
    $("copyBtn").disabled = !plan;
    $("undoBtn").hidden = !S.swaps[S.team].length;
    $("swapHint").textContent = pick ? `Now tap the player to swap with ${pick}.` : plan ? "Tap one player, then another, to swap them." : "";
  }

  function slotHTML(m, key, duty) {
    if (!m) return `<div class="pslot empty">${lockedCell}<span class="pname">Open slot</span>${duty ? `<span class="duty">${esc(duty)}</span>` : ""}</div>`;
    const swapped = S.swaps[S.team].some(([a, b]) => a === m.name || b === m.name);
    return `<button type="button" class="pslot" data-key="${key}" data-name="${esc(m.name)}" aria-pressed="${pick === m.name}" aria-label="${esc(m.name)}, ${HQ.compactCp(m.cp)} CP${swapped ? ", swapped" : ""}">
      ${cellHTML(portraitFor(tag, m.name), m.name)}
      <span class="pname"><bdi>${esc(m.name)}</bdi></span>
      <span class="pcp">${HQ.compactCp(m.cp)}</span>
      ${duty ? `<span class="duty">${esc(duty)}</span>` : ""}
      ${swapped ? `<span class="swapped">swapped</span>` : ""}
    </button>`;
  }
  function renderBoard(plan) {
    const F = HQ.floaterPin;
    $("floaters").innerHTML = `<div class="col ${hot === "F" ? "hot" : ""}" data-obj="F" style="grid-column: 1 / -1; grid-template-columns: repeat(4, 1fr);">
      <button type="button" class="obj-head" data-focus="F" style="grid-column: 1 / -1"><span class="obj-id" style="--oc:${F.color}">${F.id}</span><span class="obj-name">${esc(F.name)}</span><span class="obj-timing">${esc(F.timing)}</span></button>
      ${HQ.duties.map((d, i) => slotHTML(plan ? plan.floaters[i] : null, `F${i}`, d)).join("")}
    </div>`;
    $("board").innerHTML = HQ.objectives.map((o, j) => {
      const pr = plan ? plan.pairs[j] : null;
      return `<div class="col ${hot === o.id ? "hot" : ""}" data-obj="${o.id}">
        <button type="button" class="obj-head" data-focus="${o.id}">
          <span class="obj-id" style="--oc:${o.color}">${o.id}</span>
          <span class="obj-name">${esc(o.name)}</span>
          <span class="obj-timing">${esc(o.timing)}</span>
          <span class="obj-cp">${pr ? `Pair ${HQ.compactCp(pr.cp)}` : "Pair"}</span>
        </button>
        ${[0, 1].map(k => slotHTML(pr ? pr.members[k] : null, `P${j}.${k}`)).join("")}
      </div>`;
    }).join("");
  }

  function renderRoster(v) {
    const startIndex = new Map(v.st.map((p, i) => [p, i]));
    $("rows").innerHTML = S.players.map((p, i) => {
      const err = v.errors.get(p) || "";
      const on = !!p.starter[S.team];
      return `<li class="rrow" data-i="${i}">
        <span class="n" aria-hidden="true">${startIndex.has(p) ? startIndex.get(p) + 1 : ""}</span>
        <button type="button" class="tick" data-tick="${i}" aria-pressed="${on}" aria-label="Starter, Team ${S.team}: ${esc(p.name || "unnamed")}">${on ? "In" : "Out"}</button>
        <label class="field"><span class="sr">Player name</span><input class="text" data-field="name" data-i="${i}" value="${esc(p.name)}" maxlength="60" ${err && !p.name.trim() ? 'aria-invalid="true"' : ""}></label>
        <label class="field"><span class="sr">CP</span><input data-field="cpText" data-i="${i}" value="${esc(p.cpText)}" inputmode="text" ${err && !(HQ.readPower(p.cpText) > 0) ? 'aria-invalid="true"' : ""}></label>
        <button type="button" class="remove" data-remove="${i}" aria-label="Remove ${esc(p.name || "player")}">×</button>
        <p class="err" id="err-${i}">${err}</p>
      </li>`;
    }).join("");
  }

  let mapFor = null;
  function renderMap() {
    if (mapFor !== tag) {
      mapFor = tag;
      const pins = [...HQ.objectives, HQ.floaterPin];
      $("mapWrap").innerHTML = `<svg viewBox="0 0 560 535" role="img" aria-label="Battlefield map with objective pins">
        <image href="${A.art.map}" width="560" height="535" preserveAspectRatio="xMidYMid slice"/>
        ${HQ.mapLabels.map(l => `<text class="lbl" x="${l.x}" y="${l.y}">${esc(l.text.replace("{TAG}", tag))}</text>`).join("")}
        ${pins.map(p => `<g class="pin" data-pin="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)}"><circle cx="${p.x}" cy="${p.y}" r="18" fill="${p.color}"/><text x="${p.x}" y="${p.y}">${p.id}</text></g>`).join("")}
      </svg>`;
    }
    document.querySelectorAll(".pin").forEach(g => g.classList.toggle("hot", g.dataset.pin === hot));
    const o = hot ? [...HQ.objectives, HQ.floaterPin].find(x => x.id === hot) : null;
    $("mapNote").textContent = o ? `${o.name}. ${o.timing}` : "Tap a pin to find its pair.";
  }

  /* ---------- actions ---------- */
  function focusObj(id) {
    hot = hot === id ? null : id;
    document.querySelectorAll(".col").forEach(c => c.classList.toggle("hot", c.dataset.obj === hot));
    renderMap();
    if (hot) { const col = document.querySelector(`.col[data-obj="${hot}"]`); if (col && window.innerWidth <= 1100) col.scrollIntoView({ block: "center" }); }
  }
  function doSwap(a, b) {
    const plan = S.lastPlan[S.team];
    if (!plan || a === b) return;
    S.swaps[S.team].push([a, b]);
    if (stale) { swapIn(plan, a, b); save(); render(); } else compute();
  }
  function undo() {
    const last = S.swaps[S.team].pop();
    if (!last) return;
    if (stale) { swapIn(S.lastPlan[S.team], last[0], last[1]); save(); render(); } else compute();
  }
  async function copyPlan() {
    const text = $("planText").value;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = false; }
    if (!ok) {
      const ta = $("planText"); ta.closest("details").open = true; ta.focus(); ta.select();
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    }
    $("copyMsg").textContent = ok ? "Copied. Paste the plan into alliance chat." : "Copy failed. The plan text is selected below; copy it by hand.";
  }

  document.addEventListener("click", e => {
    const t = e.target;
    const team = t.closest(".team-tab"); if (team) { S.team = team.dataset.team; pick = null; compute(); return; }
    const slot = t.closest(".pslot[data-name]");
    if (slot) {
      const name = slot.dataset.name;
      if (!pick) { pick = name; render(); }
      else if (pick === name) { pick = null; render(); }
      else { const a = pick; pick = null; doSwap(a, name); }
      return;
    }
    const head = t.closest("[data-focus]"); if (head) { focusObj(head.dataset.focus); return; }
    const pin = t.closest(".pin"); if (pin) { focusObj(pin.dataset.pin); return; }
    const tick = t.closest("[data-tick]"); if (tick) { const p = S.players[Number(tick.dataset.tick)]; p.starter[S.team] = !p.starter[S.team]; compute(); return; }
    const rm = t.closest("[data-remove]"); if (rm) { S.players.splice(Number(rm.dataset.remove), 1); compute(); return; }
    if (t.closest("#copyBtn")) { copyPlan(); return; }
    if (t.closest("#undoBtn")) { undo(); return; }
    if (t.closest("#addBtn")) { S.players.push({ name: "", cpText: "", starter: { A: false, B: false } }); compute(); const last = $("rows").querySelector(".rrow:last-child input"); if (last) last.focus(); return; }
    if (t.closest("#clearBtn")) { S.players.forEach(p => { p.starter[S.team] = false; }); S.swaps[S.team] = []; compute(); return; }
    if (t.closest("#sampleBtn")) { S = sample(); pick = null; compute(); return; }
  });
  document.addEventListener("keydown", e => {
    if (e.target.classList && e.target.classList.contains("pin") && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); focusObj(e.target.dataset.pin); }
  });
  $("rows").addEventListener("input", e => {
    const inp = e.target.closest("[data-field]"); if (!inp) return;
    const p = S.players[Number(inp.dataset.i)];
    p[inp.dataset.field] = inp.value;
    save();
    // Re-render everything except the row being typed in, so focus stays put.
    const v = validate();
    const keep = inp;
    const row = inp.closest(".rrow");
    if (v.ok) compute(); else { stale = true; save(); render(v); }
    const again = document.querySelector(`[data-field="${keep.dataset.field}"][data-i="${keep.dataset.i}"]`);
    if (again && again !== keep) { again.focus(); try { again.setSelectionRange(keep.selectionStart, keep.selectionEnd); } catch (err) { /* number-ish inputs */ } }
    void row;
  });

  /* ---------- boot ---------- */
  D6.buildLang();
  document.addEventListener("hq:alliance", () => {
    ({ tag, A } = D6.applyAlliance());
    document.title = `Black Gold Battlefield planner, ${A.brand}`;
    mapFor = null; pick = null; hot = null;
    load();
    compute();
  });
  HQ.init();
})();
