/* d4-tech-tree planner: Floaters to objective pairs as a tree beside the map; HQ.assign is the brain, swaps sit on top. */
(function () {
  "use strict";
  const { $, $$, esc, plate, ico, drawWires, store, phone, toast } = D4;
  const OBJ = HQ.objectives, FP = HQ.floaterPin, cp = HQ.compactCp;
  const HEX = (x, y, r) => [0, 1, 2, 3, 4, 5].map(i => { const a = Math.PI / 3 * i - Math.PI / 2; return `${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`; }).join(" ");

  let tag, a, st, plan = null, stale = false, picked = null;
  const key = () => `d4-roster-${tag}`;
  function seed() {
    const r = HQ.roster(tag);
    return { team: "A", players: r.map((p, i) => ({ name: p.name, cpText: p.cpText, A: p.starter, B: i >= r.length - 20 })), swaps: { A: [], B: [] } };
  }
  const save = () => store.set(key(), st);
  const starters = () => st.players.filter(p => p[st.team]);

  /* validation, with the sites' own messages */
  function validate() {
    const list = starters(), seen = new Set();
    $$(".row input").forEach(i => i.removeAttribute("aria-invalid"));
    $$(".row-err").forEach(e => e.remove());
    for (let i = 0; i < list.length; i++) {
      const p = list[i], name = p.name.trim(), power = HQ.readPower(p.cpText);
      const bad = !name || !power || seen.has(name);
      seen.add(name);
      if (bad) {
        const msg = `Starter ${i + 1} needs a unique name and positive CP. Example: 350M.`;
        const row = $(`.row[data-i="${st.players.indexOf(p)}"]`);
        if (row) {
          row.querySelector(!power ? ".cp" : ".nm").setAttribute("aria-invalid", "true");
          row.insertAdjacentHTML("beforeend", `<p class="row-err">${esc(msg)}</p>`);
        }
        return { ok: false, msg };
      }
    }
    if (list.length !== 20) return { ok: false, msg: `Select exactly 20 starters for Team ${st.team}. You selected ${list.length}.` };
    return { ok: true, list: list.map(p => ({ name: p.name.trim(), cp: HQ.readPower(p.cpText) })) };
  }

  /* plan = HQ.assign plus the team's swaps */
  function slots(pl) {
    const out = [];
    pl.floaters.forEach((m, i) => out.push({ get: () => pl.floaters[i], set: v => { pl.floaters[i] = { ...v, duty: HQ.duties[i] }; } }));
    pl.pairs.forEach((pr, i) => pr.members.forEach((m, j) => out.push({ get: () => pl.pairs[i].members[j], set: v => { const { duty, ...rest } = v; pl.pairs[i].members[j] = rest; pl.pairs[i].cp = pl.pairs[i].members.reduce((s, p) => s + p.cp, 0); } })));
    return out;
  }
  function applySwap(pl, [n1, n2]) {
    const s = slots(pl), i = s.findIndex(x => x.get().name === n1), j = s.findIndex(x => x.get().name === n2);
    if (i < 0 || j < 0) return false;
    const a1 = s[i].get(), a2 = s[j].get();
    s[i].set(a2); s[j].set(a1);
    return true;
  }
  function compute() {
    const v = validate();
    const state = $("#planState");
    if (v.ok) {
      plan = HQ.assign(v.list);
      st.swaps[st.team] = st.swaps[st.team].filter(sw => applySwap(plan, sw));
      stale = false;
      state.className = "plan-state";
      state.textContent = `Assigned all 20 Team ${st.team} starters.${st.swaps[st.team].length ? ` ${st.swaps[st.team].length} manual swap${st.swaps[st.team].length > 1 ? "s" : ""} applied.` : ""}`;
    } else {
      stale = true;
      state.className = "plan-state err";
      state.textContent = plan ? `Plan is stale. ${v.msg}` : v.msg;
    }
    const list = starters();
    const count = $("#count");
    count.textContent = `Team ${st.team} · ${list.length} / 20 starters`;
    count.classList.toggle("short", list.length !== 20);
    renderPlan();
  }

  /* plan tree */
  const planEl = $("#plan");
  const swappedNames = () => new Set(st.swaps[st.team].flat());
  const mem = (m, color) => `<button type="button" class="mem${picked === m.name ? " picked" : ""}${swappedNames().has(m.name) ? " swapped" : ""}" data-name="${esc(m.name)}" style="--c:${color}" aria-pressed="${picked === m.name}"><b><bdi>${esc(m.name)}</bdi></b><span>${cp(m.cp)}</span></button>`;
  function renderPlan() {
    planEl.classList.toggle("stale", stale);
    if (!plan) { planEl.innerHTML = `<p class="plan-state err">Select 20 valid starters to build the plan.</p>`; return; }
    planEl.innerHTML = `<svg class="wires" aria-hidden="true"></svg>
      <div class="froot" style="--fc:${FP.color}">${plate(null, null, `<b style="font:700 26px/1 var(--display)">${FP.id}</b>`)}<h3>${esc(FP.name)}</h3><span class="timing">${esc(FP.timing)}</span>
        <div class="fl">${plan.floaters.map((m, i) => `<div>${mem(m, FP.color)}<small>${esc(m.duty)}</small></div>`).join("")}</div></div>
      <div class="pairs">${plan.pairs.map(({ objective: o, members, cp: total }) => `
        <div class="pair" data-id="${o.id}" style="--c:${o.color}">
          <button type="button" class="phead" data-focus="${o.id}">${plate(null, null, `<b>${o.id}</b>`)}<h3>${esc(o.name)}</h3><span class="timing">${esc(o.timing)}</span></button>
          <div class="mems">${members.map(m => mem(m, o.color)).join("")}</div>
          <span class="pcp">${cp(total)} CP together</span>
        </div>`).join("")}</div>`;
    $("#planText").value = HQ.planText(tag, st.team, plan);
    $("#undo").disabled = !st.swaps[st.team].length;
    requestAnimationFrame(drawPlanWires);
  }
  function drawPlanWires() {
    if (!plan) return;
    if (phone.matches) { drawWires(planEl, [], () => ""); return; }
    const root = $(".froot .plate", planEl);
    drawWires(planEl, $$(".pair .plate", planEl).map(p => [root, p, "p"]), () => "w-brass");
  }
  planEl.addEventListener("click", e => {
    const m = e.target.closest(".mem");
    if (m) {
      const name = m.dataset.name;
      if (!picked) { picked = name; $("#swapHint").textContent = `${name} picked. Tap another player to swap.`; renderPlan(); return; }
      if (picked === name) { picked = null; $("#swapHint").textContent = "Tap one player, then another, to swap them."; renderPlan(); return; }
      st.swaps[st.team].push([picked, name]);
      picked = null;
      $("#swapHint").textContent = "Swapped. Tap two players to swap again.";
      save(); compute();
      return;
    }
    const f = e.target.closest("[data-focus]");
    if (f) focusObjective(f.dataset.focus, true);
  });
  $("#undo").addEventListener("click", () => { st.swaps[st.team].pop(); picked = null; $("#swapHint").textContent = "Swap undone."; save(); compute(); });

  /* map */
  const mapSvg = $("#map svg");
  function renderMap() {
    mapSvg.innerHTML = `<title id="mapTitle">Battlefield map with objective pins</title>
      <image href="${a.art.map}" width="560" height="535" preserveAspectRatio="xMidYMid slice"/>
      ${HQ.mapLabels.map(l => `<text class="label" x="${l.x}" y="${l.y}">${esc(l.text.replace("{TAG}", tag))}</text>`).join("")}
      ${[...OBJ, FP].map(o => `<g class="pin" data-id="${o.id}" tabindex="0" role="button" aria-label="${esc(o.name)}"><polygon points="${HEX(o.x, o.y, 19)}" fill="${o.color}"/><text x="${o.x}" y="${o.y + 1}">${o.id}</text></g>`).join("")}`;
  }
  mapSvg.addEventListener("click", e => { const p = e.target.closest(".pin"); if (p) focusObjective(p.dataset.id, false); });
  mapSvg.addEventListener("keydown", e => { const p = e.target.closest(".pin"); if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); focusObjective(p.dataset.id, false); } });
  function focusObjective(id, fromPlan) {
    $$(".pin", mapSvg).forEach(p => p.classList.toggle("is-focus", p.dataset.id === id));
    $$(".pair", planEl).forEach(p => p.classList.toggle("is-focus", p.dataset.id === id));
    const target = fromPlan ? $(`.pin[data-id="${id}"]`, mapSvg) : ($(`.pair[data-id="${id}"]`, planEl) || $(".froot", planEl));
    if (target && phone.matches) target.scrollIntoView({ block: "center", behavior: D4.reduced ? "auto" : "smooth" });
  }

  /* roster */
  const rows = $("#rows");
  function renderRows() {
    rows.innerHTML = st.players.map((p, i) => `<li class="row${p[st.team] ? " is-starter" : ""}" data-i="${i}">
      <span class="idx">${i + 1}</span>
      <label class="st"><input type="checkbox" data-st="${i}"${p[st.team] ? " checked" : ""}><span class="hexbox"></span><span class="sr">Starter</span></label>
      <input type="text" class="nm" data-nm="${i}" value="${esc(p.name)}" maxlength="60" placeholder="In-game name" aria-label="Player ${i + 1} name" autocomplete="off">
      <input type="text" class="cp" data-cp="${i}" value="${esc(p.cpText)}" placeholder="e.g. 350M" aria-label="Player ${i + 1} CP" autocomplete="off" inputmode="text">
      <button type="button" class="rm" data-rm="${i}" aria-label="Remove ${esc(p.name || "player " + (i + 1))}">×</button>
    </li>`).join("");
  }
  rows.addEventListener("input", e => {
    const i = e.target;
    if (i.dataset.nm != null) st.players[+i.dataset.nm].name = i.value;
    else if (i.dataset.cp != null) st.players[+i.dataset.cp].cpText = i.value;
    else return;
    save(); compute();
  });
  rows.addEventListener("change", e => {
    const i = e.target; if (i.dataset.st == null) return;
    st.players[+i.dataset.st][st.team] = i.checked;
    i.closest(".row").classList.toggle("is-starter", i.checked);
    save(); compute();
  });
  rows.addEventListener("click", e => {
    const b = e.target.closest("[data-rm]"); if (!b) return;
    const i = +b.dataset.rm, p = st.players[i];
    if (p.name.trim() && !confirm(`Remove ${p.name} from the roster?`)) return;
    st.players.splice(i, 1); save(); renderRows(); compute();
  });
  $("#addPlayer").addEventListener("click", () => { st.players.push({ name: "", cpText: "", A: false, B: false }); save(); renderRows(); compute(); $(`.row[data-i="${st.players.length - 1}"] .nm`).focus(); });
  $("#clearStarters").addEventListener("click", () => { st.players.forEach(p => { p[st.team] = false; }); save(); renderRows(); compute(); });
  $$(".team").forEach(b => b.addEventListener("click", () => {
    st.team = b.dataset.team; picked = null;
    $$(".team").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    save(); renderRows(); compute();
  }));

  /* copy */
  $("#copy").addEventListener("click", async () => {
    const ta = $("#planText"), msg = $("#copyMsg");
    let ok = false;
    try { await navigator.clipboard.writeText(ta.value); ok = true; } catch { /* fall back to selection copy */ }
    if (!ok) { ta.focus(); ta.select(); try { ok = document.execCommand("copy"); } catch { ok = false; } }
    msg.textContent = ok ? "Copied. Paste the plan into alliance chat." : "Copy blocked by the browser. The text above is selected, copy it by hand.";
  });

  /* alliance */
  function load(al) {
    a = al; tag = a.tag; picked = null;
    st = store.get(key(), null) || seed();
    $$(".team").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.team === st.team)));
    renderMap(); renderRows(); compute();
  }
  D4.shell({ page: "planner", art: "planner", onAlliance: load, onLang: () => requestAnimationFrame(drawPlanWires) }).then(drawPlanWires);
  new ResizeObserver(drawPlanWires).observe(planEl);
  phone.addEventListener("change", drawPlanWires);
})();
