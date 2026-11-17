/* d1-journal planner. Roster strips, live assignment via HQ.assign, slot swaps, the map, copy for alliance chat. */
(function () {
  "use strict";
  const { $, esc, tearAll } = window.Journal;
  const state = { tag: "DGF", team: "A", players: [], swaps: [], plan: null, stale: false, sel: null, focus: null };
  const key = () => `d1-roster-${state.tag}`;

  /* ---------- roster state ---------- */
  function loadRoster(tag) {
    state.tag = tag; state.swaps = []; state.sel = null;
    let saved = null; try { saved = JSON.parse(localStorage.getItem(key())); } catch (e) { saved = null; }
    if (saved && Array.isArray(saved.players)) { state.players = saved.players; state.team = saved.team || "A"; }
    else { state.players = HQ.roster(tag).map(p => ({ name: p.name, cpText: p.cpText, A: p.starter, B: false })); state.team = "A"; }
  }
  function save() { try { localStorage.setItem(key(), JSON.stringify({ players: state.players, team: state.team })); } catch (e) { setStatus("Could not save the roster in this browser.", "err"); } }

  /* ---------- validation + plan ---------- */
  function starters() { return state.players.filter(p => p[state.team]); }
  function compute() {
    const list = starters(), seen = new Set();
    let bad = null;
    list.forEach((p, i) => {
      const name = p.name.trim(), cp = HQ.readPower(p.cpText);
      p.cp = cp; p.bad = !name || seen.has(name.toLowerCase()) || !(cp > 0);
      if (p.bad && bad === null) bad = i + 1;
      seen.add(name.toLowerCase());
    });
    state.players.filter(p => !p[state.team]).forEach(p => { p.bad = false; p.cp = HQ.readPower(p.cpText); });
    $("#count").textContent = `Team ${state.team} · ${list.length} / 20 starters`;
    if (bad) { state.stale = !!state.plan; setStatus(`Starter ${bad} needs a unique name and positive CP. Example: 350M.`, "err"); }
    else if (list.length !== 20) { state.stale = !!state.plan; setStatus(`Select exactly 20 starters for Team ${state.team}. You selected ${list.length}.`, "err"); }
    else {
      const base = HQ.assign(list.map(p => ({ name: p.name.trim(), cp: p.cp })));
      state.swaps.forEach(([a, b]) => swapSlots(base, a, b));
      state.plan = base; state.stale = false;
      setStatus(`Assigned all 20 Team ${state.team} starters.`, "ok");
    }
    renderPlan(); renderChat();
  }
  // slots: F0..F3, then <objective id>0 / <objective id>1
  function slotRef(plan, id) {
    if (id[0] === "F" && id.length === 2) return { arr: plan.floaters, i: Number(id[1]) };
    const pair = plan.pairs.find(p => p.objective.id === id.slice(0, -1));
    return { arr: pair.members, i: Number(id.slice(-1)), pair };
  }
  function swapSlots(plan, a, b) {
    const A = slotRef(plan, a), B = slotRef(plan, b);
    const t = A.arr[A.i]; A.arr[A.i] = B.arr[B.i]; B.arr[B.i] = t;
    plan.floaters.forEach((p, i) => { p.duty = HQ.duties[i]; });
    plan.pairs.forEach(p => { p.cp = p.members.reduce((s, m) => s + m.cp, 0); });
  }
  const swappedNames = () => { const s = new Set(); if (!state.plan) return s; state.swaps.forEach(([a, b]) => { s.add(slotRef(state.plan, a).arr[slotRef(state.plan, a).i].name); s.add(slotRef(state.plan, b).arr[slotRef(state.plan, b).i].name); }); return s; };

  function setStatus(text, kind) { const el = $("#status"); el.textContent = text; el.className = `status ${kind || ""}`; }

  /* ---------- render: roster ---------- */
  function renderRoster() {
    const t = state.team;
    $("#roster").innerHTML = state.players.map((p, i) => `
      <li class="mstrip torn ${p[t] ? "" : "is-bench"} ${p.bad ? "is-bad" : ""}" data-seed="${400 + i * 3}" data-i="${i}">
        <span class="idx">${i + 1}</span>
        <input class="inp" data-f="name" value="${esc(p.name)}" maxlength="60" aria-label="Player ${i + 1} name" aria-invalid="${p.bad && !p.name.trim()}" placeholder="In-game name">
        <input class="inp cp" data-f="cpText" value="${esc(p.cpText)}" inputmode="text" aria-label="Player ${i + 1} CP" aria-invalid="${p.bad && !(p.cp > 0)}" placeholder="350M">
        <button type="button" class="starter" aria-pressed="${!!p[t]}" aria-label="${p.name || "Player " + (i + 1)}: starter for Team ${t}">${p[t] ? "Starter" : "Bench"}</button>
        <button type="button" class="rm" aria-label="Remove ${p.name || "player " + (i + 1)}">×</button>
        ${p.bad ? `<span class="merr">Needs a unique name and positive CP.</span>` : ""}
      </li>`).join("");
    tearAll($("#roster"));
  }
  $("#roster").addEventListener("input", e => {
    const inp = e.target.closest("input"); if (!inp) return;
    const p = state.players[inp.closest("li").dataset.i]; p[inp.dataset.f] = inp.value;
    save(); compute();
    const li = inp.closest("li"); li.classList.toggle("is-bad", !!p.bad); li.querySelectorAll(".merr").forEach(m => m.remove());
    if (p.bad) li.insertAdjacentHTML("beforeend", `<span class="merr">Needs a unique name and positive CP.</span>`);
    li.querySelector("[data-f=name]").setAttribute("aria-invalid", String(p.bad && !p.name.trim()));
    li.querySelector("[data-f=cpText]").setAttribute("aria-invalid", String(p.bad && !(p.cp > 0)));
  });
  $("#roster").addEventListener("click", e => {
    const li = e.target.closest("li"); if (!li) return;
    const i = Number(li.dataset.i), p = state.players[i];
    if (e.target.closest(".starter")) { p[state.team] = !p[state.team]; save(); compute(); renderRoster(); }
    if (e.target.closest(".rm")) {
      if (p.name.trim() && !confirm(`Remove ${p.name} from the roster?`)) return;
      state.players.splice(i, 1); save(); compute(); renderRoster();
    }
  });
  $("#addPlayer").addEventListener("click", () => { state.players.push({ name: "", cpText: "", A: false, B: false }); save(); renderRoster(); compute(); $("#roster li:last-child input").focus(); });
  document.querySelectorAll(".team-tab").forEach(b => b.addEventListener("click", () => {
    state.team = b.dataset.team; state.swaps = []; state.sel = null; state.plan = null;
    document.querySelectorAll(".team-tab").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    save(); renderRoster(); compute();
  }));

  /* ---------- render: plan slips ---------- */
  const chip = (m, slot, duty) => `<button type="button" class="chip ${swappedNames().has(m.name) ? "is-swapped" : ""}" data-slot="${slot}" aria-pressed="${state.sel === slot}"><bdi>${esc(m.name)}</bdi><span class="ccp">${HQ.compactCp(m.cp)} CP</span>${duty ? `<span class="duty">${duty.startsWith("★") ? '<svg aria-hidden="true"><use href="#st-star"/></svg> ' + esc(duty.slice(2)) : esc(duty)}</span>` : ""}</button>`;
  function renderPlan() {
    const plan = state.plan;
    $("#stale").hidden = !state.stale;
    $("#slips").classList.toggle("is-stale", state.stale);
    $("#undo").hidden = !state.swaps.length;
    $("#swapHint").textContent = state.sel ? "Now tap the player to swap with." : "Tap one assigned player, then another, to swap them.";
    if (!plan) { $("#slips").innerHTML = `<li class="slip torn slip-empty" data-seed="500"><span class="name">No plan yet</span><span class="timing">Select exactly 20 valid starters and the plan appears here.</span></li>`; tearAll($("#slips")); return; }
    const f = HQ.floaterPin;
    $("#slips").innerHTML = [
      `<li class="slip torn slip-f" data-seed="501" data-obj="F" style="--oc:${f.color}"><span class="code">F</span><span class="name">${esc(f.name)}</span><span class="timing">${esc(f.timing)}</span><span class="members">${plan.floaters.map((m, i) => chip(m, "F" + i, m.duty)).join("")}</span></li>`,
      ...plan.pairs.map((p, k) => `<li class="slip torn" data-seed="${510 + k}" data-obj="${p.objective.id}" style="--oc:${p.objective.color}"><span class="code">${p.objective.id}</span><span class="name">${esc(p.objective.name)}</span><span class="timing">${esc(p.objective.timing)}</span><span class="cp">${HQ.compactCp(p.cp)}<small>pair CP</small></span><span class="members">${p.members.map((m, i) => chip(m, p.objective.id + i)).join("")}</span></li>`)
    ].join("");
    tearAll($("#slips"));
    applyFocus();
  }
  $("#slips").addEventListener("click", e => {
    const c = e.target.closest(".chip");
    if (c) {
      if (state.stale) return;
      const slot = c.dataset.slot;
      if (!state.sel) state.sel = slot;
      else if (state.sel === slot) state.sel = null;
      else { state.swaps.push([state.sel, slot]); state.sel = null; compute(); return; }
      renderPlan(); return;
    }
    const slip = e.target.closest(".slip"); if (slip && slip.dataset.obj) focusObj(slip.dataset.obj);
  });
  $("#undo").addEventListener("click", () => { state.swaps.pop(); state.sel = null; compute(); });

  /* ---------- map ---------- */
  function drawMap() {
    const tag = state.tag;
    $("#mapLabels").innerHTML = HQ.mapLabels.map(l => `<text class="lbl" x="${l.x}" y="${l.y}">${esc(l.text.replace("{TAG}", tag))}</text>`).join("");
    $("#mapPins").innerHTML = [...HQ.objectives, HQ.floaterPin].map(o =>
      `<g class="mpin" data-obj="${o.id}" tabindex="0" role="button" aria-label="${esc(o.name)}"><circle cx="${o.x}" cy="${o.y}" r="16" fill="${o.color}"/><text x="${o.x}" y="${o.y + 1}">${o.id}</text></g>`).join("");
  }
  function focusObj(id) { state.focus = state.focus === id ? null : id; applyFocus(); }
  function applyFocus() {
    document.querySelectorAll(".mpin").forEach(p => p.classList.toggle("is-focus", p.dataset.obj === state.focus));
    document.querySelectorAll(".slip").forEach(s => s.classList.toggle("is-focus", s.dataset.obj === state.focus));
    if (state.focus) { const s = document.querySelector(`.slip[data-obj="${state.focus}"]`); if (s && window.matchMedia("(min-width: 901px)").matches) s.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  }
  $("#map").addEventListener("click", e => { const p = e.target.closest(".mpin"); if (p) focusObj(p.dataset.obj); });
  $("#map").addEventListener("keydown", e => { const p = e.target.closest(".mpin"); if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); focusObj(p.dataset.obj); } });

  /* ---------- chat text + copy ---------- */
  function renderChat() { $("#chatText").textContent = state.plan ? HQ.planText(state.tag, state.team, state.plan) : "The message appears when the plan is ready."; }
  $("#copy").addEventListener("click", async () => {
    if (!state.plan) { setStatus(`Select exactly 20 starters for Team ${state.team} first.`, "err"); return; }
    const text = HQ.planText(state.tag, state.team, state.plan);
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = false; }
    if (!ok) { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { ok = document.execCommand("copy"); } catch (e) { ok = false; } ta.remove(); }
    if (ok) setStatus("Copied. Paste the plan into alliance chat.", "ok");
    else { setStatus("Copy failed. The message is selected below; copy it by hand.", "err"); const r = document.createRange(); r.selectNodeContents($("#chatText")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  });

  /* ---------- phone views ---------- */
  document.querySelectorAll(".view-tab").forEach(b => b.addEventListener("click", () => {
    $("#main").dataset.view = b.dataset.view;
    document.querySelectorAll(".view-tab").forEach(x => x.setAttribute("aria-selected", String(x === b)));
  }));

  /* ---------- alliance ---------- */
  document.addEventListener("hq:alliance", e => {
    const a = e.detail;
    $("#heroArt").src = a.art.bgb; $("#mapImg").setAttribute("href", a.art.map);
    loadRoster(a.tag); state.plan = null;
    document.querySelectorAll(".team-tab").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.team === state.team)));
    drawMap(); renderRoster(); compute();
  });
  HQ.init();
  tearAll();
})();
