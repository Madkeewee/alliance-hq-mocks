/* d7 Armory Grid: Black Gold Battlefield planner. Loadout slots per objective, swap on tap, map pins, roster. */
(function () {
  "use strict";
  const { esc, $, pict, store, say } = D7;
  const SLOTS = 20;

  let A = D7.A;
  let S = null;           // { team, players:[{name,cpText,A,B}], swaps:{A:[],B:[]} }
  let lastPlan = { A: null, B: null };
  let stale = false;
  let picked = null;      // slot key awaiting a swap partner
  let selObj = null;      // selected objective id (map <-> plate)
  const key = () => `d7-bgb-${A.tag}`;

  function fresh() {
    return { team: "A", swaps: { A: [], B: [] }, players: HQ.roster(A.tag).map((p) => ({ name: p.name, cpText: p.cpText, A: p.starter, B: p.starter })) };
  }
  function load() {
    const saved = store.get(key(), null);
    S = saved && Array.isArray(saved.players) ? Object.assign(fresh(), saved) : fresh();
    if (!S.swaps) S.swaps = { A: [], B: [] };
  }
  const save = () => { if (!store.set(key(), S)) say("Could not save the roster in this browser."); };

  /* ---------- validation + plan ---------- */
  function starters() { return S.players.map((p, i) => ({ ...p, i })).filter((p) => p[S.team]); }
  function validate() {
    const st = starters();
    const names = new Set(); let err = null; let badIndex = -1;
    st.forEach((p, n) => {
      if (err) return;
      const name = p.name.trim(); const cp = HQ.readPower(p.cpText);
      if (!name || names.has(name.toLowerCase()) || !cp) { err = `Starter ${n + 1} needs a unique name and positive CP. Example: 350M.`; badIndex = p.i; }
      names.add(name.toLowerCase());
    });
    if (!err && st.length !== SLOTS) err = `Select exactly ${SLOTS} starters for Team ${S.team}. You selected ${st.length}.`;
    return { st, err, badIndex };
  }
  function applySwaps(plan) {
    const pos = () => { const list = []; plan.floaters.forEach((p, i) => list.push({ arr: plan.floaters, i, p })); plan.pairs.forEach((pr) => pr.members.forEach((p, i) => list.push({ arr: pr.members, i, p }))); return list; };
    const swapped = new Set();
    S.swaps[S.team].forEach(([a, b]) => {
      const l = pos(); const x = l.find((e) => e.p.name === a), y = l.find((e) => e.p.name === b);
      if (!x || !y) return;
      const t = x.arr[x.i]; x.arr[x.i] = y.arr[y.i]; y.arr[y.i] = t;
      swapped.add(a); swapped.add(b);
    });
    plan.floaters = plan.floaters.map((p, i) => ({ ...p, duty: HQ.duties[i] }));
    plan.swapped = swapped;
    return plan;
  }
  function compute() {
    const v = validate();
    if (!v.err) {
      const base = HQ.assign(v.st.map((p) => ({ name: p.name.trim(), cp: HQ.readPower(p.cpText) })));
      lastPlan[S.team] = applySwaps(base); stale = false;
    } else if (lastPlan[S.team]) { lastPlan[S.team] = applySwaps(lastPlan[S.team]); stale = true; }
    return v;
  }
  const plan = () => lastPlan[S.team];
  const planText = () => plan() ? HQ.planText(A.tag, S.team, plan()) : "";

  /* ---------- render ---------- */
  function renderHead(v) {
    $("teamCount").textContent = `Team ${S.team} · ${v.st.length} / ${SLOTS} starters`;
    document.querySelectorAll("[data-team]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.team === S.team)));
    const bar = $("stateBar");
    if (v.err) { bar.className = `state-bar ${plan() ? "stale" : "bad"}`; bar.innerHTML = `<b>${plan() ? "Stale plan" : "No plan"}</b><span>${esc(v.err)}${plan() ? " The plan below is from the last valid roster." : ""}</span>`; }
    else { bar.className = "state-bar"; bar.innerHTML = `<b>Ready</b><span>Assigned all ${SLOTS} Team ${S.team} starters. Strongest four float; the rest pair strongest with weakest across the objectives.</span>`; }
  }
  const cpc = HQ.compactCp;
  function slot(p, k, extra = "") {
    const sw = plan().swapped.has(p.name);
    return `<button type="button" class="slot${picked === k ? " picked" : ""}${sw ? " swapped" : ""}" data-slot="${k}" data-name="${esc(p.name)}" aria-pressed="${picked === k}" aria-label="${esc(p.name)}, ${cpc(p.cp)} CP${sw ? ", swapped" : ""}${picked === k ? ", selected for swap" : ""}">
      <span class="in"><span class="nm"><bdi>${esc(p.name)}</bdi></span><span class="cp">${cpc(p.cp)}</span>${sw ? `<span class="tagx">swapped</span>` : ""}${extra}</span></button>`;
  }
  function renderPlan() {
    const P = plan();
    if (!P) { $("objs").innerHTML = `<p class="hint">Select exactly ${SLOTS} valid starters to see the plan.</p>`; $("chatText").value = ""; return; }
    const F = HQ.floaterPin;
    $("objs").innerHTML = `
      <div class="obj f${selObj === "F" ? " sel" : ""}" data-obj="F" style="--den:${F.color}"><div class="in">
        <div class="obj-head"><button type="button" class="obj-id" data-pick="F" aria-label="Select Floaters on the map">F</button><div class="obj-name">${esc(F.name)}<small>${esc(F.timing)}</small></div><div class="obj-cp">${cpc(P.floaters.reduce((s, p) => s + p.cp, 0))}<small>combined CP</small></div></div>
        <div class="slots">${P.floaters.map((p, i) => slot(p, `F${i}`, `<span class="duty">${esc(p.duty)}</span>`)).join("")}</div>
      </div></div>
      ${P.pairs.map((pr, i) => `<div class="obj${selObj === pr.objective.id ? " sel" : ""}" data-obj="${pr.objective.id}" style="--den:${pr.objective.color}"><div class="in">
        <div class="obj-head"><button type="button" class="obj-id" data-pick="${pr.objective.id}" aria-label="Select ${esc(pr.objective.name)} on the map">${pr.objective.id}</button><div class="obj-name">${esc(pr.objective.name)}<small>${esc(pr.objective.timing)}</small></div><div class="obj-cp">${cpc(pr.cp)}<small>pair CP</small></div></div>
        <div class="slots">${pr.members.map((p, j) => slot(p, `P${i}-${j}`)).join("")}</div>
      </div></div>`).join("")}`;
    $("undo").disabled = !S.swaps[S.team].length;
    $("swapHint").textContent = picked ? "Now tap the player to swap with." : (S.swaps[S.team].length ? `${S.swaps[S.team].length} manual swap${S.swaps[S.team].length > 1 ? "s" : ""} applied.` : "Tap a player, then another, to swap them.");
    $("chatText").value = planText();
  }
  function renderMap() {
    const pins = [...HQ.objectives, HQ.floaterPin];
    $("map").innerHTML = `<svg viewBox="0 0 560 535" role="img" aria-label="Black Gold Battlefield map with objective pins">
      <image href="${A.art.map}" width="560" height="535" preserveAspectRatio="xMidYMid slice"/>
      ${HQ.mapLabels.map((l) => `<text class="maplabel" x="${l.x}" y="${l.y}">${esc(l.text.replace("{TAG}", A.tag))}</text>`).join("")}
      ${pins.map((p) => `<g class="pin${selObj === p.id ? " sel" : ""}" data-pin="${p.id}" role="button" tabindex="0" aria-label="${esc(p.name)}" aria-pressed="${selObj === p.id}"><circle cx="${p.x}" cy="${p.y}" r="19" fill="${p.color}"/><text x="${p.x}" y="${p.y}">${p.id}</text></g>`).join("")}
    </svg>`;
  }
  function renderRoster(v) {
    $("roster").innerHTML = S.players.map((p, i) => `
      <div class="ro${v.badIndex === i ? " bad" : ""}" data-row="${i}">
        <span class="n">${i + 1}</span>
        <label class="well"><span class="vh">Player ${i + 1} name</span><input class="txt" data-f="name" data-i="${i}" type="text" value="${esc(p.name)}" placeholder="In-game name" maxlength="60" autocomplete="off"></label>
        <label class="well"><span class="vh">Player ${i + 1} CP</span><input data-f="cpText" data-i="${i}" type="text" inputmode="decimal" value="${esc(p.cpText)}" placeholder="350M" autocomplete="off"></label>
        <button type="button" class="starter" data-starter="${i}" aria-pressed="${!!p[S.team]}" aria-label="${p[S.team] ? "Starter" : "Bench"} for Team ${S.team}: ${esc(p.name || "player " + (i + 1))}"></button>
        <button type="button" class="x" data-x="${i}" aria-label="Remove ${esc(p.name || "player " + (i + 1))}">×</button>
        ${v.badIndex === i ? `<p class="ro-err">${esc(v.err)}</p>` : ""}
      </div>`).join("");
  }
  function renderAll() {
    const v = compute();
    renderHead(v); renderPlan(); renderMap(); renderRoster(v);
    document.title = `BGB planner. ${A.brand} (d7 Armory Grid)`;
    $("foot").innerHTML = D7.footer(`<p class="footnote">Roster and starters are saved in this browser only. Sample roster values from the mockup data.</p>`);
  }
  function refresh() { const v = compute(); renderHead(v); renderPlan(); renderMap(); const bad = document.querySelector(".ro.bad"); const nowBad = v.badIndex; document.querySelectorAll(".ro").forEach((r) => { const i = Number(r.dataset.row); r.classList.toggle("bad", i === nowBad); const e = r.querySelector(".ro-err"); if (i === nowBad && !e) r.insertAdjacentHTML("beforeend", `<p class="ro-err">${esc(v.err)}</p>`); if (i !== nowBad && e) e.remove(); }); save(); }

  /* ---------- events ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target;
    const team = t.closest("[data-team]"); if (team) { S.team = team.dataset.team; picked = null; renderAll(); save(); return; }
    const view = t.closest("[data-view]"); if (view) { document.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b === view))); document.querySelectorAll(".pv").forEach((s) => s.classList.toggle("on", s.dataset.pv === view.dataset.view)); return; }
    const sl = t.closest("[data-slot]");
    if (sl) {
      const k = sl.dataset.slot;
      if (!picked) { picked = k; }
      else if (picked === k) { picked = null; }
      else { const a = document.querySelector(`[data-slot="${picked}"]`).dataset.name, b = sl.dataset.name; S.swaps[S.team].push([a, b]); picked = null; say(`Swapped ${a} and ${b}`); }
      refresh(); return;
    }
    const pk = t.closest("[data-pick]"); if (pk) { selObj = selObj === pk.dataset.pick ? null : pk.dataset.pick; renderPlan(); renderMap(); return; }
    const pin = t.closest("[data-pin]"); if (pin) { selectPin(pin.dataset.pin); return; }
    if (t.closest("#undo")) { S.swaps[S.team].pop(); picked = null; refresh(); say("Swap undone"); return; }
    if (t.closest("#copy")) { copyPlan(); return; }
    const st = t.closest("[data-starter]"); if (st) { const i = Number(st.dataset.starter); S.players[i][S.team] = !S.players[i][S.team]; st.setAttribute("aria-pressed", String(S.players[i][S.team])); refresh(); return; }
    const x = t.closest("[data-x]");
    if (x) {
      const i = Number(x.dataset.x);
      if (S.players[i].name.trim() && !x.classList.contains("arm")) { x.classList.add("arm"); x.setAttribute("aria-label", `Tap again to remove ${S.players[i].name}`); setTimeout(() => x.classList.remove("arm"), 3000); return; }
      S.players.splice(i, 1); picked = null; renderAll(); save(); return;
    }
    if (t.closest("#addPlayer")) { S.players.push({ name: "", cpText: "", A: false, B: false }); renderAll(); save(); document.querySelector(`[data-i="${S.players.length - 1}"][data-f="name"]`)?.focus(); return; }
    if (t.closest("#clearStarters")) { S.players.forEach((p) => { p[S.team] = false; }); renderAll(); save(); return; }
  });
  document.addEventListener("keydown", (e) => { const pin = e.target.closest?.("[data-pin]"); if (pin && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); selectPin(pin.dataset.pin); } });
  document.addEventListener("input", (e) => {
    const t = e.target; if (!t.dataset.f) return;
    S.players[Number(t.dataset.i)][t.dataset.f] = t.value;
    refresh();
  });
  function selectPin(id) {
    selObj = selObj === id ? null : id; renderPlan(); renderMap();
    const plate = document.querySelector(`[data-obj="${id}"]`);
    if (plate && selObj && matchMedia("(min-width: 901px)").matches) plate.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  async function copyPlan() {
    const text = planText(); if (!text) { say("No plan to copy yet."); return; }
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch { /* fall back below */ }
    if (!ok) { const ta = $("chatText"); ta.focus(); ta.select(); try { ok = document.execCommand("copy"); } catch { ok = false; } }
    say(ok ? "Copied. Paste the plan into alliance chat." : "Copy failed. Select the message and copy it by hand.", 4000);
  }

  document.addEventListener("d7:alliance", (e) => { A = e.detail; picked = null; selObj = null; lastPlan = { A: null, B: null }; load(); renderAll(); });
})();
