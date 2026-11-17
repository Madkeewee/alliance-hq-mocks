/* d5 Region Map: Black Gold Battlefield planner. Assignment logic and plan text from HQ; the battlefield with squads
   as tokens is this direction's. */
(function () {
  "use strict";
  const { $, $$, el, h, esc, phone } = D5;
  const OBJ = HQ.objectives, FP = HQ.floaterPin;
  const byId = Object.fromEntries(OBJ.map(o => [o.id, o]));

  let A = null;
  let S = null;          // { team, rows:[{name, cpText, A:bool, B:bool}], swaps:{A:[],B:[]} }
  let plan = null, stale = false, staleWhy = "", lastGood = { A: null, B: null };
  let focusObj = null, pick = null, swappedNames = new Set();

  const key = () => `d5-bgb-${A.tag}`;
  const save = () => { try { localStorage.setItem(key(), JSON.stringify(S)); } catch (e) { note("Could not save the roster in this browser."); } };
  function loadState() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(key())); } catch (e) { s = null; }
    if (!s || !Array.isArray(s.rows)) {
      s = { team: "A", rows: HQ.roster(A.tag).map(r => ({ name: r.name, cpText: r.cpText, A: !!r.starter, B: false })), swaps: { A: [], B: [] } };
    }
    s.swaps = s.swaps || { A: [], B: [] };
    S = s;
  }
  const note = msg => { const c = $("#copied"); c.textContent = msg; };

  /* ---------- validation + plan ---------- */
  function starters() { return S.rows.map((r, i) => ({ ...r, i })).filter(r => r[S.team]); }
  function validate() {
    const st = starters();
    const seen = new Set(); let firstBad = -1; const bad = new Set();
    st.forEach((r, n) => {
      const nm = r.name.trim().toLowerCase();
      const cp = HQ.readPower(r.cpText);
      const ok = nm && !seen.has(nm) && Number.isFinite(cp);
      if (nm) seen.add(nm);
      if (!ok) { bad.add(r.i); if (firstBad < 0) firstBad = n + 1; }
    });
    let message = "";
    if (firstBad > 0) message = `Starter ${firstBad} needs a unique name and positive CP. Example: 350M.`;
    else if (st.length !== 20) message = `Select exactly 20 starters for Team ${S.team}. You selected ${st.length}.`;
    return { st, bad, message };
  }
  function applySwaps(base) {
    const p = { floaters: base.floaters.map(f => ({ ...f })), pairs: base.pairs.map(pr => ({ ...pr, members: pr.members.map(m => ({ ...m })) })) };
    const slots = () => {
      const s = [];
      p.floaters.forEach((f, i) => s.push({ get: () => p.floaters[i], set: v => { p.floaters[i] = { ...v, duty: HQ.duties[i] }; } }));
      p.pairs.forEach((pr, j) => pr.members.forEach((m, k) => s.push({ get: () => p.pairs[j].members[k], set: v => { p.pairs[j].members[k] = { name: v.name, cp: v.cp, cpText: v.cpText }; } })));
      return s;
    };
    swappedNames = new Set();
    const kept = [];
    S.swaps[S.team].forEach(([a, b]) => {
      const sl = slots();
      const ia = sl.findIndex(x => x.get().name === a), ib = sl.findIndex(x => x.get().name === b);
      if (ia < 0 || ib < 0) return;
      const va = sl[ia].get(), vb = sl[ib].get();
      sl[ia].set(vb); sl[ib].set(va);
      swappedNames.add(a); swappedNames.add(b); kept.push([a, b]);
    });
    S.swaps[S.team] = kept;
    p.pairs.forEach(pr => { pr.cp = pr.members.reduce((s, m) => s + m.cp, 0); });
    return p;
  }
  function compute() {
    const v = validate();
    if (!v.message) {
      const players = v.st.map(r => ({ name: r.name.trim(), cp: HQ.readPower(r.cpText), cpText: r.cpText }));
      lastGood[S.team] = HQ.assign(players);
      plan = applySwaps(lastGood[S.team]); stale = false; staleWhy = "";
    } else if (lastGood[S.team]) {
      plan = applySwaps(lastGood[S.team]); stale = true; staleWhy = v.message;
    } else { plan = null; stale = true; staleWhy = v.message; }
    return v;
  }

  /* ---------- rendering ---------- */
  function renderAll() {
    const v = compute();
    $("#count-line").textContent = `Team ${S.team} · ${v.st.length} / 20 starters`;
    const st = $("#stale");
    st.hidden = !stale;
    st.textContent = stale ? (plan ? `Plan is out of date. ${staleWhy}` : staleWhy) : "";
    document.body.classList.toggle("is-stale", stale);
    $$(".team").forEach(b => { const on = b.dataset.team === S.team; b.classList.toggle("is-current", on); b.setAttribute("aria-pressed", String(on)); });
    renderMap(); renderPlan(); renderRoster(v.bad); renderDetail();
    $("#undo").hidden = !S.swaps[S.team].length;
    $("#plan-text").value = plan ? HQ.planText(A.tag, S.team, plan) : "";
    save();
  }

  const short = s => s.length > 13 ? s.slice(0, 12) + "…" : s;
  const TOK = () => phone() ? { w: 96, h: 22, gap: 24 } : { w: 84, h: 17, gap: 19 };
  function token(x, y, p, color, pos) {
    const { w, h: th } = TOK();
    const g = el("g", { class: "tok" + (swappedNames.has(p.name) ? " is-swapped" : "") + (pick === p.name ? " is-picked" : ""), tabindex: "0", role: "button",
      "data-name": p.name, "aria-label": `${p.name}, ${HQ.compactCp(p.cp)} CP, ${pos}` });
    g.append(el("rect", { x, y, width: w, height: th, fill: color }));
    g.append(el("text", { x: x + 4, y: y + th * 0.73 }, short(p.name)));
    if (swappedNames.has(p.name)) g.append(el("path", { class: "tick", d: `M${x + w - 8} ${y}h8v8z` }));
    g.addEventListener("click", e => { e.stopPropagation(); tap(p.name); });
    g.addEventListener("keydown", k => { if (k.key === "Enter" || k.key === " ") { k.preventDefault(); tap(p.name); } });
    return g;
  }
  // Where a squad's tokens sit relative to its pin: right of it unless that runs off the map or into a neighbour.
  function tokenOrigin(o, n) {
    const { w, gap } = TOK();
    const left = o.id === "H" || o.id === "F" || o.x + 18 + w > 560;
    const x = left ? o.x - 18 - w : o.x + 18;
    let y0 = o.y - 18;
    if (o.id === "F") y0 = o.y - 44;
    else if (o.y + 18 + n * gap > 535) y0 = o.y - 18 - (n - 1) * gap;
    return { x, y0, gap };
  }
  function renderMap() {
    $("#bgb-map").classList.toggle("is-phone", phone());
    const L = $("#bgb-labels"); L.innerHTML = "";
    HQ.mapLabels.forEach(l => {
      const t = l.text.replace("{TAG}", A.tag);
      const g = el("g", { class: "mlabel" });
      const w = t.length * 6.4 + 10;
      g.append(el("rect", { x: l.x - 4, y: l.y - 12, width: w, height: 16 }));
      g.append(el("text", { x: l.x, y: l.y }, t));
      L.append(g);
    });
    const G = $("#bgb-squads"); G.innerHTML = "";
    const pins = [...OBJ.map(o => ({ o, members: plan ? plan.pairs.find(p => p.objective.id === o.id).members : [] })), { o: FP, members: plan ? plan.floaters : [] }];
    pins.forEach(({ o, members }) => {
      const g = el("g", { class: "squad" + (focusObj === o.id ? " is-focus" : ""), "data-obj": o.id });
      const hit = el("g", { class: "pin", tabindex: "0", role: "button", "aria-label": `${o.id}, ${o.name}` });
      hit.append(el("circle", { cx: o.x, cy: o.y, r: phone() ? 19 : 15, fill: o.color }));
      hit.append(el("text", { x: o.x, y: o.y + 5.5, class: "pin-id" }, o.id));
      hit.addEventListener("click", e => { e.stopPropagation(); focusObj = focusObj === o.id ? null : o.id; renderMap(); renderPlan(); renderDetail(); });
      hit.addEventListener("keydown", k => { if (k.key === "Enter" || k.key === " ") { k.preventDefault(); focusObj = o.id; renderMap(); renderPlan(); renderDetail(); } });
      g.append(hit);
      const { x, y0, gap } = tokenOrigin(o, members.length);
      members.forEach((p, i) => g.append(token(x, y0 + i * gap, p, o.color, `${o.id} ${o.name}`)));
      G.append(g);
    });
  }
  function renderPlan() {
    const list = $("#plan-list"); list.innerHTML = "";
    if (!plan) { list.innerHTML = `<li class="plan-empty">${esc(staleWhy)}</li>`; return; }
    const row = (o, members, extra) => {
      const li = h("li", "prow" + (focusObj === o.id ? " is-focus" : "")); li.dataset.obj = o.id;
      li.style.setProperty("--oc", o.color);
      li.innerHTML = `<button type="button" class="pcode" aria-label="${esc(o.id)}, ${esc(o.name)}">${esc(o.id)}</button>
        <div class="pbody"><h3>${esc(o.name)}</h3><p class="ptiming">${esc(o.timing)}${extra || ""}</p><ul class="pmembers"></ul></div>`;
      li.querySelector(".pcode").addEventListener("click", () => { focusObj = focusObj === o.id ? null : o.id; renderMap(); renderPlan(); renderDetail(); });
      const ul = li.querySelector(".pmembers");
      members.forEach((p, i) => {
        const b = h("li");
        b.innerHTML = `<button type="button" class="pname${swappedNames.has(p.name) ? " is-swapped" : ""}${pick === p.name ? " is-picked" : ""}" data-name="${esc(p.name)}"><bdi>${esc(p.name)}</bdi><span>${esc(HQ.compactCp(p.cp))} CP</span>${p.duty ? `<small>${esc(p.duty)}</small>` : ""}</button>`;
        b.querySelector("button").addEventListener("click", () => tap(p.name));
        ul.append(b);
      });
      return li;
    };
    list.append(row(FP, plan.floaters, ""));
    plan.pairs.forEach(pr => list.append(row(pr.objective, pr.members, ` <b>${esc(HQ.compactCp(pr.cp))} CP together</b>`)));
  }
  function renderDetail() {
    const d = $("#detail");
    if (!focusObj || !plan) { d.hidden = true; return; }
    const o = focusObj === "F" ? FP : byId[focusObj];
    const members = focusObj === "F" ? plan.floaters : plan.pairs.find(p => p.objective.id === focusObj).members;
    const cp = members.reduce((s, m) => s + m.cp, 0);
    d.hidden = false; d.style.setProperty("--oc", o.color);
    d.innerHTML = `<p class="dcode">${esc(o.id)}</p><h3>${esc(o.name)}</h3><p class="when">${esc(o.timing)}${focusObj !== "F" ? ` ${esc(HQ.compactCp(cp))} CP together.` : ""}</p>
      <ul class="dmembers">${members.map(p => `<li><button type="button" class="pname${swappedNames.has(p.name) ? " is-swapped" : ""}${pick === p.name ? " is-picked" : ""}" data-name="${esc(p.name)}"><bdi>${esc(p.name)}</bdi><span>${esc(HQ.compactCp(p.cp))} CP</span>${p.duty ? `<small>${esc(p.duty)}</small>` : ""}</button></li>`).join("")}</ul>
      <p class="dhint">${pick ? `Swapping <b>${esc(pick)}</b>. Tap the player to swap with, or tap them again to cancel.` : "Tap a player, then any other player on the map or in the plan, to swap them."}</p>
      <div class="acts-inline"><button type="button" class="btn quiet" id="detail-close">Close</button>${S.swaps[S.team].length ? '<button type="button" class="btn quiet" id="detail-undo">Undo last swap</button>' : ""}</div>`;
    $$(".pname", d).forEach(b => b.addEventListener("click", () => tap(b.dataset.name)));
    $("#detail-close").addEventListener("click", () => { focusObj = null; renderMap(); renderPlan(); renderDetail(); });
    const u = $("#detail-undo"); if (u) u.addEventListener("click", undo);
  }
  function renderRoster(bad) {
    const list = $("#roster-list"); list.innerHTML = "";
    let n = 0;
    S.rows.forEach((r, i) => {
      const isStarter = !!r[S.team]; if (isStarter) n += 1;
      const li = h("li", "rrow" + (isStarter ? " is-starter" : "") + (bad.has(i) ? " is-bad" : ""));
      li.innerHTML = `<button type="button" class="slot" aria-pressed="${isStarter}" aria-label="Starter, ${esc(r.name || "player " + (i + 1))}">${isStarter ? n : ""}</button>
        <label class="rname-l"><span class="sr">Player name</span><input value="${esc(r.name)}" maxlength="60" placeholder="In-game name" data-f="name"></label>
        <label class="rcp"><span class="sr">CP</span><input value="${esc(r.cpText)}" inputmode="decimal" placeholder="e.g. 350M" data-f="cpText"></label>
        <button type="button" class="remove" aria-label="Remove ${esc(r.name || "player")}">Remove</button>
        ${bad.has(i) ? `<p class="rerr">Starter ${starters().findIndex(s => s.i === i) + 1} needs a unique name and positive CP. Example: 350M.</p>` : ""}`;
      li.querySelector(".slot").addEventListener("click", () => { r[S.team] = !r[S.team]; renderAll(); });
      $$("input", li).forEach(inp => inp.addEventListener("input", () => { r[inp.dataset.f] = inp.value; const act = document.activeElement; renderAllKeepingFocus(i, inp.dataset.f); void act; }));
      li.querySelector(".remove").addEventListener("click", () => {
        if (r.name && !confirm(`Remove ${r.name} from the roster?`)) return;
        S.rows.splice(i, 1); renderAll();
      });
      list.append(li);
    });
  }
  // Re-render everything but keep the caret in the field being typed in.
  function renderAllKeepingFocus(i, f) {
    const pos = document.activeElement && document.activeElement.selectionStart;
    renderAll();
    const inp = $$("#roster-list .rrow")[i] && $$("#roster-list .rrow")[i].querySelector(`input[data-f="${f}"]`);
    if (inp) { inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (e) { /* not all inputs support it */ } }
  }

  /* ---------- swaps ---------- */
  function tap(name) {
    if (!plan) return;
    if (!pick) pick = name;
    else if (pick === name) pick = null;
    else { S.swaps[S.team].push([pick, name]); pick = null; }
    renderAll();
  }
  function undo() { S.swaps[S.team].pop(); pick = null; renderAll(); }

  /* ---------- copy ---------- */
  async function copy() {
    const text = $("#plan-text").value;
    if (!text) { note(staleWhy || "Nothing to copy yet."); return; }
    try { await navigator.clipboard.writeText(text); note("Copied. Paste the plan into alliance chat."); }
    catch (e) {
      const ta = $("#plan-text"); ta.classList.remove("sr"); ta.focus(); ta.select();
      try { document.execCommand("copy"); note("Copied. Paste the plan into alliance chat."); }
      catch (e2) { note("Copy is blocked here. The plan text is selected: copy it by hand."); }
    }
  }

  /* ---------- views (phone) ---------- */
  function setView(v) {
    $$(".view").forEach(b => { const on = b.dataset.view === v; b.classList.toggle("is-current", on); b.setAttribute("aria-selected", String(on)); });
    document.body.dataset.view = v;
    if (phone()) window.scrollTo({ top: $(".teambar").offsetTop - 8, behavior: "smooth" });
  }

  /* ---------- boot ---------- */
  $$(".team").forEach(b => b.addEventListener("click", () => { S.team = b.dataset.team; pick = null; renderAll(); }));
  $$(".view").forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));
  $("#copy").addEventListener("click", copy);
  $("#undo").addEventListener("click", undo);
  $("#add-player").addEventListener("click", () => { S.rows.push({ name: "", cpText: "", A: false, B: false }); renderAll(); const last = $("#roster-list .rrow:last-child input"); if (last) last.focus(); });
  $("#clear-starters").addEventListener("click", () => { S.rows.forEach(r => { r[S.team] = false; }); renderAll(); });
  $("#bgb-map").addEventListener("click", () => { if (focusObj) { focusObj = null; renderMap(); renderPlan(); renderDetail(); } });
  document.body.dataset.view = "map";
  let wasPhone = phone();
  addEventListener("resize", () => { if (phone() !== wasPhone) { wasPhone = phone(); renderMap(); } });

  D5.onAlliance(a => {
    A = a; document.title = `${A.name}: Black Gold Battlefield planner`;
    $("#bgb-art").setAttribute("href", A.art.map);
    $(".band-art").src = A.art.bgb;
    loadState(); focusObj = null; pick = null; lastGood = { A: null, B: null }; renderAll();
  });
  D5.mount("planner");
})();
