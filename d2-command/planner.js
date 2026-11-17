/* d2-command Black Gold Battlefield planner: tabbed roster with insignia slots, plan slots you tap to swap, war map with pins. */
(function () {
  "use strict";
  const { $, el, svgUse, say, store } = D2;
  const SVGNS = "http://www.w3.org/2000/svg";
  const phone = matchMedia("(max-width: 900px)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  const S = { tag: null, team: "A", players: [], plan: null, original: null, signature: "", swaps: [], swapped: new Set(), picked: null, stale: false, selectedObj: null };
  const key = () => `d2-roster-${S.tag}`;
  const starters = () => S.players.filter((p) => p[S.team]);

  /* ---------- load / save ---------- */
  function load(tag) {
    S.tag = tag;
    const saved = store.get(key(), null);
    if (saved && Array.isArray(saved.players) && saved.players.length) {
      S.players = saved.players.map((p) => ({ name: String(p.name || ""), cpText: String(p.cpText || ""), A: !!p.A, B: !!p.B }));
      S.team = saved.team === "B" ? "B" : "A";
    } else {
      S.players = HQ.roster(tag).map((p) => ({ name: p.name, cpText: p.cpText, A: p.starter, B: false }));
      S.team = "A";
    }
    resetPlan();
    renderTeamTabs();
    renderRoster();
    update();
  }
  const save = () => store.set(key(), { team: S.team, players: S.players });
  function resetPlan() { S.plan = null; S.original = null; S.signature = ""; S.swaps = []; S.swapped.clear(); S.picked = null; S.stale = false; }

  /* ---------- validation + live plan ---------- */
  function validate() {
    const st = starters();
    const names = new Set();
    for (let i = 0; i < st.length; i++) {
      const name = st[i].name.trim(), cp = HQ.readPower(st[i].cpText);
      if (!name || !(cp > 0) || names.has(name)) return { st, error: `Starter ${i + 1} needs a unique name and positive CP. Example: 350M.` };
      names.add(name);
    }
    if (st.length !== 20) return { st, countOnly: true, error: `Select exactly 20 starters for Team ${S.team}. You selected ${st.length}.` };
    return { st };
  }
  function update() {
    save();
    const v = validate();
    $("#count").textContent = `Team ${S.team} · ${v.st.length} / 20 starters`;
    const err = $("#rosterError");
    err.hidden = !(v.error && !v.countOnly);
    if (!err.hidden) err.querySelector("p").textContent = v.error;
    if (!v.error) {
      const players = v.st.map((p) => ({ name: p.name.trim(), cp: HQ.readPower(p.cpText) }));
      const sig = JSON.stringify(players);
      if (sig !== S.signature) {
        resetPlan();
        S.signature = sig;
        S.plan = HQ.assign(players);
        S.original = JSON.parse(JSON.stringify(S.plan));
      }
      S.stale = false;
    } else if (S.plan) {
      S.stale = true;
    }
    renderPlan(v);
    renderMap();
  }

  /* ---------- team tabs ---------- */
  function renderTeamTabs() {
    document.querySelectorAll("[data-team]").forEach((t) => {
      const on = t.dataset.team === S.team;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
  }
  document.querySelectorAll("[data-team]").forEach((t) => t.addEventListener("click", () => {
    if (S.team === t.dataset.team) return;
    S.team = t.dataset.team;
    resetPlan();
    renderTeamTabs(); renderRoster(); update();
  }));

  /* ---------- roster rows (rendered once, updated in place) ---------- */
  function renderRoster() {
    const ol = $("#roster");
    ol.textContent = "";
    S.players.forEach((p, i) => ol.append(row(p, i)));
  }
  function row(p, i) {
    const li = el("li", "slot");
    li.classList.toggle("is-starter", !!p[S.team]);
    const num = el("span", "slotnum");
    num.append(svgUse(p[S.team] ? "slot-brass" : "slot-iron"), el("b", null, String(i + 1)));
    const name = el("input", "well-in in-name");
    name.value = p.name; name.maxLength = 60; name.autocomplete = "off"; name.placeholder = "In-game name";
    name.setAttribute("aria-label", `Player ${i + 1} name`);
    const cp = el("input", "well-in in-cp");
    cp.value = p.cpText; cp.autocomplete = "off"; cp.placeholder = "350M"; cp.spellcheck = false;
    cp.setAttribute("aria-label", `Player ${i + 1} CP`);
    const toggle = el("button", `btn starter ${p[S.team] ? "btn-green" : "btn-steel"}`, p[S.team] ? "Starter" : "Bench");
    toggle.type = "button"; toggle.setAttribute("aria-pressed", String(!!p[S.team]));
    const rm = el("button", "btn btn-red btn-x");
    rm.type = "button"; rm.setAttribute("aria-label", `Remove ${p.name || `player ${i + 1}`}`);
    const x = svgUse("x"); x.setAttribute("viewBox", "0 0 24 24"); rm.append(x);

    const checkCp = () => li.classList.toggle("is-bad", !!p[S.team] && !(HQ.readPower(p.cpText) > 0));
    name.addEventListener("input", () => { p.name = name.value; rm.setAttribute("aria-label", `Remove ${p.name || `player ${i + 1}`}`); update(); });
    cp.addEventListener("input", () => { p.cpText = cp.value; checkCp(); update(); });
    toggle.addEventListener("click", () => {
      p[S.team] = !p[S.team];
      li.classList.toggle("is-starter", p[S.team]);
      num.querySelector("use").setAttribute("href", p[S.team] ? "#slot-brass" : "#slot-iron");
      toggle.textContent = p[S.team] ? "Starter" : "Bench";
      toggle.classList.toggle("btn-green", p[S.team]); toggle.classList.toggle("btn-steel", !p[S.team]);
      toggle.setAttribute("aria-pressed", String(p[S.team]));
      checkCp(); update();
    });
    rm.addEventListener("click", () => {
      if (p.name.trim() && !confirm(`Remove ${p.name.trim()} from the roster?`)) return;
      S.players.splice(S.players.indexOf(p), 1);
      renderRoster(); update();
    });
    checkCp();
    li.append(num, name, cp, toggle, rm);
    return li;
  }
  $("#addPlayer").addEventListener("click", () => {
    S.players.push({ name: "", cpText: "", A: false, B: false });
    renderRoster(); update();
    $("#roster li:last-child .in-name").focus();
  });
  $("#clearStarters").addEventListener("click", () => { S.players.forEach((p) => { p[S.team] = false; }); renderRoster(); update(); });

  /* ---------- plan slots ---------- */
  const getSlot = (slot) => slot[0] === "F" ? { arr: S.plan.floaters, i: +slot.slice(1) } : { arr: S.plan.pairs[+slot[1]].members, i: +slot[2] };
  function normalise() {
    S.plan.floaters = S.plan.floaters.map((p, i) => ({ name: p.name, cp: p.cp, duty: HQ.duties[i] }));
    S.plan.pairs.forEach((pr) => { pr.members = pr.members.map((p) => ({ name: p.name, cp: p.cp })); pr.cp = pr.members.reduce((s, p) => s + p.cp, 0); });
    S.swapped.clear();
    S.original.floaters.forEach((p, i) => { if (S.plan.floaters[i].name !== p.name) S.swapped.add(S.plan.floaters[i].name); });
    S.original.pairs.forEach((pr, pi) => pr.members.forEach((p, i) => { if (S.plan.pairs[pi].members[i].name !== p.name) S.swapped.add(S.plan.pairs[pi].members[i].name); }));
  }
  function doSwap(a, b) {
    const A = getSlot(a), B = getSlot(b);
    [A.arr[A.i], B.arr[B.i]] = [B.arr[B.i], A.arr[A.i]];
    normalise();
  }
  function pick(slot) {
    if (S.picked == null) S.picked = slot;
    else if (S.picked === slot) S.picked = null;
    else { doSwap(S.picked, slot); S.swaps.push([S.picked, slot]); S.picked = null; }
    renderPlan();
  }
  $("#undo").addEventListener("click", () => {
    const last = S.swaps.pop();
    if (!last) return;
    doSwap(last[1], last[0]);
    S.picked = null;
    renderPlan();
    say("Swap undone.");
  });

  function renderPlan(v) {
    const root = $("#plan");
    root.textContent = "";
    $("#staleTab").hidden = !S.stale;
    root.classList.toggle("is-stale", S.stale);
    $("#undo").disabled = !S.swaps.length;
    if (!S.plan) {
      const n = v ? v.st.length : starters().length;
      const empty = el("div", "planempty");
      empty.append(el("p", null, `Pick 20 starters for Team ${S.team}. ${n} selected.`));
      const grid = el("div", "lockgrid");
      for (let i = 0; i < 20; i++) {
        const s = el("span", `lockslot ${i < n ? "is-filled" : ""}`);
        s.append(svgUse(i < n ? "slot-brass" : "ic-lock"));
        grid.append(s);
      }
      empty.append(grid);
      root.append(empty);
      $("#planText").value = "";
      return;
    }
    root.append(group({ id: "F", name: HQ.floaterPin.name, color: HQ.floaterPin.color, timing: HQ.floaterPin.timing },
      S.plan.floaters.map((p, i) => ({ p, slot: `F${i}`, duty: p.duty }))));
    S.plan.pairs.forEach((pair, pi) => root.append(group(pair.objective, pair.members.map((p, i) => ({ p, slot: `P${pi}${i}` })), pair.cp)));
    $("#planText").value = HQ.planText(S.tag, S.team, S.plan);
  }
  function group(o, members, cp) {
    const g = el("div", "objective");
    g.dataset.obj = o.id;
    g.style.setProperty("--oc", o.color);
    g.classList.toggle("is-selected", S.selectedObj === o.id);
    const head = el("button", "objhead");
    head.type = "button";
    head.setAttribute("aria-pressed", String(S.selectedObj === o.id));
    head.append(el("span", "code", o.id), el("b", null, o.name), el("span", "timing", o.timing));
    if (cp != null) head.append(el("span", "paircp", `${HQ.compactCp(cp)} CP`));
    head.addEventListener("click", () => selectObjective(o.id));
    const list = el("div", "members");
    members.forEach((m) => list.append(memberBtn(m)));
    g.append(head, list);
    return g;
  }
  function memberBtn({ p, slot, duty }) {
    const b = el("button", "member");
    b.type = "button"; b.dataset.slot = slot;
    b.classList.toggle("is-picked", S.picked === slot);
    b.classList.toggle("is-swapped", S.swapped.has(p.name));
    b.setAttribute("aria-pressed", String(S.picked === slot));
    const name = el("b"); name.append(Object.assign(el("bdi"), { textContent: p.name }));
    b.append(name, el("span", null, `${HQ.compactCp(p.cp)} CP`));
    if (duty) b.append(el("i", null, duty));
    if (S.swapped.has(p.name)) b.append(el("em", "swaptag", "swapped"));
    b.addEventListener("click", () => pick(slot));
    return b;
  }

  /* ---------- map ---------- */
  function renderMap() {
    const svg = $("#map");
    svg.textContent = "";
    const a = D2.alliance;
    const mk = (tag, attrs) => { const n = document.createElementNS(SVGNS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
    svg.append(mk("image", { href: a.art.map, width: 560, height: 535, preserveAspectRatio: "xMidYMid slice" }));
    for (const l of HQ.mapLabels) {
      const t = mk("text", { x: l.x, y: l.y, class: "maplabel" });
      t.textContent = l.text.replace("{TAG}", a.tag);
      svg.append(t);
    }
    for (const o of [...HQ.objectives, HQ.floaterPin]) {
      const g = mk("g", { class: `pin ${S.selectedObj === o.id ? "is-selected" : ""}`, tabindex: 0, role: "button", "aria-pressed": String(S.selectedObj === o.id), "aria-label": `${o.id}, ${o.name}` });
      g.style.setProperty("--oc", o.color);
      g.append(mk("circle", { cx: o.x, cy: o.y, r: 18 }));
      const t = mk("text", { x: o.x, y: o.y + 1 }); t.textContent = o.id;
      g.append(t);
      const act = () => selectObjective(o.id);
      g.addEventListener("click", act);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
      svg.append(g);
    }
  }
  function selectObjective(id) {
    S.selectedObj = S.selectedObj === id ? null : id;
    renderPlan(); renderMap();
    if (!S.selectedObj) return;
    if (phone.matches) setView("plan");
    const g = $(`.objective[data-obj="${id}"]`);
    if (g) g.scrollIntoView({ block: "nearest", behavior: reduced.matches ? "auto" : "smooth" });
  }

  /* ---------- copy ---------- */
  $("#copy").addEventListener("click", async () => {
    const text = $("#planText").value;
    if (!text) { say(`Pick 20 starters for Team ${S.team} first.`); return; }
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = $("#planText"); ta.closest("details").open = true; ta.focus(); ta.select();
      try { document.execCommand("copy"); } catch { /* the text stays selected for a manual copy */ }
    }
    say("Copied. Paste the plan into alliance chat.");
  });

  /* ---------- phone views ---------- */
  function setView(v) {
    $("#main").dataset.view = v;
    document.querySelectorAll(".seg").forEach((b) => {
      const on = b.dataset.view === v;
      b.setAttribute("aria-selected", String(on));
      b.classList.toggle("btn-green", on); b.classList.toggle("btn-steel", !on);
    });
  }
  document.querySelectorAll(".seg").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
  setView("plan");

  D2.onAlliance((a) => load(a.tag));
  D2.start();
})();
