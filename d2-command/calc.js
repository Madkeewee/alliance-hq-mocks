/* d2-command calculators: a tabbed panel; Speedup inventory is the hero, Research budget second, three compact ones, then ATLANTIS HUB tools. */
(function () {
  "use strict";
  const { $, el, svgUse, say, store, int } = D2;
  const C = HQ.calculators;
  const plural = (n, word) => `${HQ.amount(n)} ${word}${n === 1 ? "" : "s"}`;

  /* ---------- tabs ---------- */
  const tabs = [...document.querySelectorAll(".tabstrip [role=tab]")];
  function selectTab(id, focus) {
    if (!C[id]) return;
    for (const t of tabs) {
      const on = t.id === `tab-${id}`;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      if (on && focus) t.focus();
    }
    if (location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
  }
  tabs.forEach((t) => t.addEventListener("click", () => selectTab(t.id.replace("tab-", ""))));
  $(".tabstrip").addEventListener("keydown", (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0 || !["ArrowRight", "ArrowLeft"].includes(e.key)) return;
    e.preventDefault();
    const j = e.key === "ArrowRight" ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
    selectTab(tabs[j].id.replace("tab-", ""), true);
  });
  addEventListener("hashchange", () => selectTab(location.hash.slice(1)));
  selectTab(C[location.hash.slice(1)] ? location.hash.slice(1) : "speedups");

  $("#sp-lede").textContent = C.speedups.description;
  $("#rs-lede").textContent = "Add one row per research step with its base values. Bonuses apply to the total.";
  $("#gl-lede").textContent = C.goal.description;
  $("#cr-lede").textContent = C.crystals.description;
  $("#cp-lede").textContent = C.capture.description;

  /* ---------- shared result pieces ---------- */
  function plate(kind, icon, title, sub) {
    const d = el("div", `finishplate finish-${kind}`);
    d.append(svgUse(icon));
    const t = el("span", "finishtext");
    t.append(el("b", null, title), el("small", null, sub));
    d.append(t);
    return d;
  }
  function shelfPlate(icon, amount, name) {
    const li = el("li", "rplate");
    li.append(svgUse(icon), el("b", null, amount), el("span", null, name));
    return li;
  }

  /* ---------- Speedup inventory ---------- */
  const SP_FIELDS = ["one", "five", "sixty", "extra", "d", "h", "m"];
  const SP_KEY = "d2-calc-speedups";
  const spRead = () => Object.fromEntries(SP_FIELDS.map((f) => [f, int($(`#sp-${f}`).value)]));
  const spWrite = (v) => SP_FIELDS.forEach((f) => { $(`#sp-${f}`).value = v[f] ?? 0; });
  function spRender() {
    const v = spRead();
    store.set(SP_KEY, v);
    const timer = v.d * 1440 + v.h * 60 + v.m;
    const r = C.speedups.calc({ one: v.one, five: v.five, sixty: v.sixty, extra: v.extra, timer });
    $("#sp-total").textContent = HQ.duration(r.totalMinutes);
    $("#sp-timer").textContent = HQ.duration(r.timerMinutes);
    const pct = timer ? Math.round(r.covered * 100) : 0;
    $("#sp-bar").style.setProperty("--p", String(pct / 100));
    $("#sp-pct").textContent = `${pct}%`;
    $("#sp-short").textContent = HQ.duration(r.shortMinutes);
    const items = $("#sp-items"), fin = $("#sp-finish");
    fin.textContent = "";
    if (!timer) {
      items.textContent = "Enter the timer shown on the upgrade in game.";
      fin.append(plate("steel", "ic-clock", "No timer yet", "Add the upgrade timer to see whether you can finish now."));
    } else if (!r.shortMinutes) {
      const left = r.totalMinutes - r.timerMinutes;
      items.textContent = left ? `${HQ.duration(left)} of speedups left over after this upgrade.` : "Exactly enough.";
      const b = el("button", "btn btn-green btn-finish");
      b.type = "button";
      b.append(svgUse("ic-clock"));
      const t = el("span", "finishtext");
      t.append(el("b", null, "Finish now"), el("small", null, `uses ${HQ.duration(r.timerMinutes)} of speedups`));
      b.append(t);
      b.addEventListener("click", () => say("Use the speedups in game. This page only checks that you have enough."));
      fin.append(b);
    } else {
      const hours = Math.ceil(r.shortMinutes / 60), fives = Math.ceil(r.shortMinutes / 5);
      items.textContent = `${plural(hours, "more 1-hour item")}, or ${plural(fives, "more 5-minute item")}.`;
      fin.append(plate("locked", "ic-lock", `Short by ${HQ.duration(r.shortMinutes)}`, plural(hours, "more 1-hour item")));
    }
  }
  SP_FIELDS.forEach((f) => $(`#sp-${f}`).addEventListener("input", spRender));
  document.querySelectorAll(".step").forEach((b) => b.addEventListener("click", () => {
    const input = document.getElementById(b.dataset.for);
    input.value = Math.max(0, int(input.value) + Number(b.dataset.step));
    spRender();
  }));
  $("#sp-preset").addEventListener("click", () => {
    const p = C.speedups.preset;
    spWrite({ one: p.one, five: p.five, sixty: p.sixty, extra: p.extra, d: Math.floor(p.timer / 1440), h: Math.floor((p.timer % 1440) / 60), m: p.timer % 60 });
    spRender();
  });
  $("#sp-reset").addEventListener("click", () => { spWrite({}); store.del(SP_KEY); spRender(); });
  spWrite(store.get(SP_KEY, {}));
  spRender();

  /* ---------- Research budget ---------- */
  const RS_KEY = "d2-calc-research";
  const COLS = [["Wood", "ic-wood"], ["Iron", "ic-iron"], ["Electricity", "ic-volt"], ["Coin", "ic-coin"], ["Badges", "ic-badge"], ["Minutes", "ic-clock"]];
  let steps = [[0, 0, 0, 0, 0, 0]];
  const rsBonus = () => ({ speed: int($("#rs-speed").value, 1000), discount: int($("#rs-discount").value, 100), speedups: int($("#rs-speedups").value) });
  function rsRenderSteps() {
    const list = $("#rs-steps");
    list.textContent = "";
    steps.forEach((s, i) => {
      const li = el("li", "stepcard");
      const head = el("div", "stephead");
      head.append(el("b", null, `Step ${i + 1}`));
      const rm = el("button", "btn btn-red btn-x", null);
      rm.type = "button"; rm.setAttribute("aria-label", `Remove step ${i + 1}`);
      rm.append(svgUse("x"));
      rm.querySelector("svg").setAttribute("viewBox", "0 0 24 24");
      rm.disabled = steps.length === 1;
      rm.addEventListener("click", () => { steps.splice(i, 1); rsRenderSteps(); rsRender(); });
      head.append(rm);
      const cells = el("div", "stepcells");
      COLS.forEach(([name, icon], j) => {
        const lab = el("label", "cell");
        lab.append(svgUse(icon), el("span", null, name));
        const inp = el("input", "well-in");
        inp.inputMode = "numeric"; inp.pattern = "[0-9]*"; inp.autocomplete = "off";
        inp.value = s[j]; inp.setAttribute("aria-label", `Step ${i + 1} ${name.toLowerCase()}`);
        inp.addEventListener("input", () => { steps[i][j] = int(inp.value, 1e12); rsRender(); });
        lab.append(inp);
        cells.append(lab);
      });
      li.append(head, cells);
      list.append(li);
    });
  }
  function rsRender() {
    const b = rsBonus();
    store.set(RS_KEY, { steps, ...b });
    const r = C.research.calc({ steps, ...b });
    const shelf = $("#rs-shelf");
    shelf.textContent = "";
    shelf.append(
      shelfPlate("ic-wood", HQ.amount(r.wood), "wood"), shelfPlate("ic-iron", HQ.amount(r.iron), "iron"),
      shelfPlate("ic-volt", HQ.amount(r.electricity), "electricity"), shelfPlate("ic-coin", HQ.amount(r.coin), "coin"),
      shelfPlate("ic-badge", HQ.amount(r.badges), "badges")
    );
    $("#rs-time").textContent = HQ.duration(r.timeMinutes);
    $("#rs-after").textContent = HQ.duration(r.afterMinutes);
    $("#rs-note").textContent = `${plural(steps.length, "step")}. Reduction applies to wood, iron, electricity and coin, not badges.`;
  }
  ["speed", "discount", "speedups"].forEach((f) => $(`#rs-${f}`).addEventListener("input", rsRender));
  $("#rs-add").addEventListener("click", () => { steps.push([0, 0, 0, 0, 0, 0]); rsRenderSteps(); rsRender(); $("#rs-steps li:last-child input").focus(); });
  $("#rs-preset").addEventListener("click", () => {
    const p = C.research.preset;
    steps = p.steps.map((s) => [...s]);
    $("#rs-speed").value = p.speed; $("#rs-discount").value = p.discount; $("#rs-speedups").value = p.speedups;
    rsRenderSteps(); rsRender();
  });
  $("#rs-reset").addEventListener("click", () => {
    steps = [[0, 0, 0, 0, 0, 0]];
    $("#rs-speed").value = 0; $("#rs-discount").value = 0; $("#rs-speedups").value = 0;
    store.del(RS_KEY); rsRenderSteps(); rsRender();
  });
  {
    const saved = store.get(RS_KEY, null);
    if (saved && Array.isArray(saved.steps) && saved.steps.length) {
      steps = saved.steps.map((s) => Array.from({ length: 6 }, (_, j) => int(s[j], 1e12)));
      $("#rs-speed").value = int(saved.speed, 1000); $("#rs-discount").value = int(saved.discount, 100); $("#rs-speedups").value = int(saved.speedups);
    }
    rsRenderSteps(); rsRender();
  }

  /* ---------- the three compact ones ---------- */
  function simple(prefix, calcKey, fields, render) {
    const key = `d2-calc-${calcKey}`;
    const read = () => Object.fromEntries(fields.map((f) => [f, int($(`#${prefix}-${f}`).value, 1e12)]));
    const write = (v) => fields.forEach((f) => { $(`#${prefix}-${f}`).value = v[f] ?? (calcKey === "capture" && f === "full" ? 30 : 0); });
    const run = () => { const v = read(); store.set(key, v); render(C[calcKey].calc(v), v); };
    fields.forEach((f) => $(`#${prefix}-${f}`).addEventListener("input", run));
    $(`#${prefix}-preset`).addEventListener("click", () => { write(C[calcKey].preset); run(); });
    $(`#${prefix}-reset`).addEventListener("click", () => { write({}); store.del(key); run(); });
    write(store.get(key, {}));
    run();
  }
  simple("gl", "goal", ["owned", "target", "rate"], (r, v) => {
    $("#gl-remaining").textContent = HQ.amount(r.remaining);
    $("#gl-eta").textContent = r.etaMinutes ? HQ.duration(r.etaMinutes) : (r.remaining ? "No rate yet" : "Now");
    $("#gl-note").textContent = !r.remaining ? "Target reached." : !v.rate ? "Add a positive net gain per hour for a time estimate." : `${HQ.amount(v.rate)} per hour, steady.`;
  });
  simple("cr", "crystals", ["regularCount", "regularPayout", "boostedCount", "boostedPayout", "passCount", "passPayout"], (r) => {
    const shelf = $("#cr-shelf");
    shelf.textContent = "";
    shelf.append(shelfPlate("ic-crystal", HQ.amount(r.regular), "regular Mines"), shelfPlate("ic-crystal", HQ.amount(r.boosted), "boosted Mines"), shelfPlate("ic-crystal", HQ.amount(r.passes), "Passes"));
    $("#cr-total").textContent = HQ.amount(r.total);
  });
  simple("cp", "capture", ["progress", "full"], (r) => {
    $("#cp-left").textContent = `About ${HQ.duration(r.leftMinutes)}`;
  });

  /* ---------- ATLANTIS HUB tools ---------- */
  const tools = $("#tools");
  for (const t of HQ.externalTools) {
    const li = el("li");
    const a = el("a", "toolrow");
    a.href = t.url; a.target = "_blank"; a.rel = "noopener";
    a.append(el("b", null, t.title), el("span", null, t.note), el("em", null, "ATLANTIS HUB, new tab"));
    li.append(a);
    tools.append(li);
  }

  D2.start();
})();
