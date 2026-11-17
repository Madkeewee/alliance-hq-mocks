/* d8-timetable planner: roster on paper, the plan as a board of objective rows, the map beside it. Logic from HQ. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = Shell.esc;
  const name = s => `<bdi>${esc(s)}</bdi>`;
  let tag = "DGF", state = null, plan = null, swaps = [], selected = null, hot = null, lastPlanText = "";

  const KEY = () => `d8-roster-${tag}`;
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY())); if (s && Array.isArray(s.players)) return s; } catch { /* fall through */ }
    return { team: "A", players: HQ.roster(tag).map(p => ({ name: p.name, cpText: p.cpText, A: p.starter, B: p.starter })) };
  }
  function save() { try { localStorage.setItem(KEY(), JSON.stringify(state)); } catch { $("roster-status").textContent = "This browser would not save the roster. Changes stay until you leave the page."; } }

  /* ---- roster ---- */
  function rosterRows() {
    $("roster-rows").innerHTML = state.players.map((p, i) => `
      <li class="rrow" data-i="${i}">
        <span class="num">${i + 1}</span>
        <input class="in in--text" data-f="name" value="${esc(p.name)}" maxlength="60" aria-label="Player ${i + 1} name" placeholder="In-game name">
        <input class="in in--text cp" data-f="cpText" value="${esc(p.cpText)}" inputmode="decimal" aria-label="Player ${i + 1} CP" placeholder="e.g. 350M">
        <label class="st"><input type="checkbox" data-f="starter" ${p[state.team] ? "checked" : ""} aria-label="Player ${i + 1} starter"><span>Starter</span></label>
      </li>`).join("");
  }
  function starters() { return state.players.filter(p => p[state.team]); }
  function validate() {
    const list = starters();
    const seen = new Set();
    for (let i = 0; i < list.length; i++) {
      const p = list[i], n = p.name.trim(), cp = HQ.readPower(p.cpText);
      if (!n || seen.has(n) || !cp) return { ok: false, msg: `Starter ${i + 1} needs a unique name and positive CP. Example: 350M.`, bad: p, field: !n || seen.has(n) ? "name" : "cpText" };
      seen.add(n);
    }
    if (list.length !== 20) return { ok: false, msg: `Select exactly 20 starters for Team ${state.team}. You selected ${list.length}.` };
    return { ok: true, list: list.map(p => ({ name: p.name.trim(), cp: HQ.readPower(p.cpText) })) };
  }

  /* ---- plan ---- */
  function slots(pl) { // every assignable position: {get, set}
    const out = [];
    pl.floaters.forEach((_, i) => out.push({ get: () => pl.floaters[i], set: v => { pl.floaters[i] = v; } }));
    pl.pairs.forEach(pair => pair.members.forEach((_, j) => out.push({ get: () => pair.members[j], set: v => { pair.members[j] = v; } })));
    return out;
  }
  function applySwap(pl, a, b) {
    const s = slots(pl), sa = s.find(x => x.get().name === a), sb = s.find(x => x.get().name === b);
    if (!sa || !sb) return false;
    const pa = sa.get(), pb = sb.get();
    sa.set(pb); sb.set(pa);
    pl.pairs.forEach(pair => { pair.cp = pair.members.reduce((t, p) => t + p.cp, 0); });
    pl.floaters = pl.floaters.map((p, i) => ({ ...p, duty: HQ.duties[i] }));
    return true;
  }
  function rebuild() {
    const v = validate();
    document.querySelectorAll(".rrow .in").forEach(el => el.removeAttribute("aria-invalid"));
    if (v.ok) {
      plan = HQ.assign(v.list);
      swaps = swaps.filter(([a, b]) => applySwap(plan, a, b));
      $("roster-status").textContent = "";
      $("roster-status").className = "status";
      $("stale").textContent = "";
      $("plan").classList.remove("plan--stale");
    } else {
      $("roster-status").textContent = v.msg;
      $("roster-status").className = "status status--err";
      if (v.bad) {
        const i = state.players.indexOf(v.bad);
        const el = document.querySelector(`.rrow[data-i="${i}"] [data-f="${v.field}"]`);
        if (el) { el.setAttribute("aria-invalid", "true"); if (document.activeElement?.closest(".rrow") == null) el.focus(); }
      }
      $("stale").textContent = plan ? `Plan is stale. ${v.msg}` : v.msg;
      $("plan").classList.add("plan--stale");
    }
    $("count").textContent = `Team ${state.team} · ${starters().length} / 20 starters`;
    renderPlan();
  }
  const cpLabel = p => HQ.compactCp(p.cp);
  const plBtn = p => `<button type="button" class="pl ${swaps.flat().includes(p.name) ? "swapped" : ""}" data-name="${esc(p.name)}" aria-pressed="${selected === p.name}">${name(p.name)}<small>${cpLabel(p)}</small></button>`;
  function renderPlan() {
    if (!plan) { $("plan-rows").innerHTML = ""; $("floater-rows").innerHTML = ""; $("plan-text").value = ""; return; }
    $("plan-rows").innerHTML = plan.pairs.map(({ objective: o, members, cp }) => `
      <li class="prow ${hot === o.id ? "is-hot" : ""}" data-obj="${o.id}" style="--c:${o.color}">
        <span class="code">${o.id}</span>
        <div class="what"><h3 class="ev-name">${esc(o.name)}</h3><p class="ev-note">${esc(o.timing)}</p></div>
        <div class="names">${members.map(plBtn).join("")}</div>
        <p class="edge">${HQ.compactCp(cp)}<small>pair CP</small></p>
      </li>`).join("");
    const f = HQ.floaterPin;
    $("floater-rows").innerHTML = plan.floaters.map((p, i) => `
      <li class="prow ${hot === "F" ? "is-hot" : ""}" data-obj="F" style="--c:${f.color}">
        <span class="code">F${i + 1}</span>
        <div class="what"><h3 class="ev-name">${esc(p.duty)}</h3><p class="ev-note">${esc(f.timing)}</p></div>
        <div class="names">${plBtn(p)}</div>
        <p class="edge">${cpLabel(p)}<small>CP</small></p>
      </li>`).join("");
    lastPlanText = HQ.planText(tag, state.team, plan);
    $("plan-text").value = lastPlanText;
    $("undo").hidden = swaps.length === 0;
    paintPins();
  }

  /* ---- map ---- */
  const a = () => HQ.alliances[tag];
  function drawMap() {
    const pins = [...HQ.objectives, HQ.floaterPin];
    $("map-svg").innerHTML = `
      <title id="map-title">Battlefield map with objective pins</title>
      <image href="${a().art.map}" width="560" height="535" preserveAspectRatio="xMidYMid slice"/>
      ${HQ.mapLabels.map(l => `<text class="map-label" x="${l.x}" y="${l.y}">${esc(l.text.replace("{TAG}", tag))}</text>`).join("")}
      ${pins.map(p => `<g class="pin" data-obj="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)}"><circle cx="${p.x}" cy="${p.y}" r="19" fill="${p.color}"/><text x="${p.x}" y="${p.y + 1}">${p.id}</text></g>`).join("")}`;
    paintPins();
  }
  function paintPins() { document.querySelectorAll(".pin").forEach(g => g.classList.toggle("is-hot", g.dataset.obj === hot)); }
  function setHot(id, scrollRow) {
    hot = hot === id ? null : id;
    document.querySelectorAll(".prow").forEach(r => r.classList.toggle("is-hot", r.dataset.obj === hot));
    paintPins();
    if (hot && scrollRow) document.querySelector(`.prow[data-obj="${hot}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  /* ---- events ---- */
  $("roster-rows").addEventListener("input", e => {
    const row = e.target.closest(".rrow"); if (!row) return;
    const p = state.players[row.dataset.i], f = e.target.dataset.f;
    if (f === "starter") p[state.team] = e.target.checked; else p[f] = e.target.value;
    save(); rebuild();
  });
  $("add-player").addEventListener("click", () => {
    state.players.push({ name: "", cpText: "", A: false, B: false });
    save(); rosterRows(); rebuild();
    document.querySelector(".rrow:last-child [data-f='name']").focus();
  });
  document.querySelectorAll(".team-btn").forEach(b => b.addEventListener("click", () => {
    state.team = b.dataset.team;
    document.querySelectorAll(".team-btn").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    swaps = []; selected = null;
    save(); rosterRows(); rebuild();
  }));
  $("plan").addEventListener("click", e => {
    const pl = e.target.closest(".pl");
    if (pl) {
      const n = pl.dataset.name;
      if (!selected) { selected = n; }
      else if (selected === n) { selected = null; }
      else { if (applySwap(plan, selected, n)) swaps.push([selected, n]); selected = null; }
      renderPlan();
      return;
    }
    const row = e.target.closest(".prow");
    if (row) setHot(row.dataset.obj, false);
  });
  $("undo").addEventListener("click", () => {
    const last = swaps.pop();
    if (last) applySwap(plan, last[1], last[0]);
    selected = null; renderPlan();
  });
  $("map-svg").addEventListener("click", e => { const g = e.target.closest(".pin"); if (g) setHot(g.dataset.obj, true); });
  $("map-svg").addEventListener("keydown", e => { const g = e.target.closest(".pin"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setHot(g.dataset.obj, true); } });
  $("copy").addEventListener("click", async () => {
    if (!plan) { $("copy-status").textContent = "Fix the roster first, then copy."; return; }
    const text = HQ.planText(tag, state.team, plan);
    try { await navigator.clipboard.writeText(text); }
    catch { const t = $("plan-text"); t.focus(); t.select(); try { document.execCommand("copy"); } catch { /* selection is left for a manual copy */ } }
    $("copy-status").textContent = "Copied. Paste the plan into alliance chat.";
  });

  function render(al) {
    tag = al.tag; swaps = []; selected = null; hot = null; plan = null;
    state = load();
    document.querySelectorAll(".team-btn").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.team === state.team)));
    rosterRows(); drawMap(); rebuild();
    $("copy-status").textContent = "";
  }
  Shell.mount({ page: "planner", title: "Black Gold Battlefield planner", render });
})();
