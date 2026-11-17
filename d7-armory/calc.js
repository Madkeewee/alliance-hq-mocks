/* d7 Armory Grid: calculators. Buy grid for speedups, blueprint card for research, compact plates for the rest. */
(function () {
  "use strict";
  const { esc, $, pict, store, num, say } = D7;
  const C = HQ.calculators;
  const dur = HQ.duration, amt = HQ.amount;

  /* ---------- hub chips ---------- */
  const CHIPS = [["speedups", "Speedup inventory", "var(--brass)"], ["research", "Research budget", "var(--crystal)"], ["goal", "Resource goal", "var(--steel)"], ["crystals", "Weekly crystals", "var(--crystal)"], ["capture", "Mining Site capture", "var(--moss)"]];
  $("chips").innerHTML = CHIPS.map(([id, t, c]) => `<a class="chip" href="#${id}" style="--den:${c}">${esc(t)}</a>`).join("");

  /* ---------- speedups: buy grid ---------- */
  const SP_KEY = "d7-speedups";
  const TIERS = [
    { k: "one", name: "1-minute", unit: 1, tier: "1", sub: "items" },
    { k: "five", name: "5-minute", unit: 5, tier: "5", sub: "items" },
    { k: "sixty", name: "1-hour", unit: 60, tier: "60", sub: "items" },
    { k: "extra", name: "Other", unit: 1, tier: "x", sub: "total minutes" }
  ];
  const spZero = () => ({ one: 0, five: 0, sixty: 0, extra: 0, d: 0, h: 0, m: 0 });
  const presetSp = () => { const p = C.speedups.preset; return { one: p.one, five: p.five, sixty: p.sixty, extra: p.extra, d: Math.floor(p.timer / 1440), h: Math.floor((p.timer % 1440) / 60), m: p.timer % 60 }; };
  let sp = store.get(SP_KEY, null) ? Object.assign(spZero(), store.get(SP_KEY, {})) : presetSp(); // first visit shows the worked example

  function renderSpeedups() {
    $("spSub").textContent = C.speedups.description;
    $("spGrid").innerHTML = TIERS.map((t) => `
      <div class="item tier-${t.tier}"><div class="in">
        <div class="item-head">${pict("speedup")}<div><div class="item-name">${t.name}</div><div class="item-sub">${t.sub}</div></div></div>
        <div class="stepper">
          <button type="button" class="step" data-step="${t.k}" data-d="-1" aria-label="One fewer ${t.name}">−</button>
          <label class="vh" for="sp-${t.k}">${t.name} ${t.sub}</label>
          <input id="sp-${t.k}" data-sp="${t.k}" type="text" inputmode="numeric" pattern="[0-9]*" value="${sp[t.k]}" autocomplete="off">
          <button type="button" class="step" data-step="${t.k}" data-d="1" aria-label="One more ${t.name}">+</button>
        </div>
        <div class="item-total" data-total="${t.k}"></div>
      </div></div>`).join("");
    $("timerRow").innerHTML = `
      <div class="label"><strong>Upgrade timer</strong><span>as shown in game</span></div>
      ${[["d", "days"], ["h", "hours"], ["m", "minutes"]].map(([k, l]) => `
        <label class="fld"><span>${l}</span><span class="well"><input data-sp="${k}" type="text" inputmode="numeric" pattern="[0-9]*" value="${sp[k]}" autocomplete="off"></span></label>`).join("")}`;
    computeSpeedups();
  }
  function computeSpeedups() {
    TIERS.forEach((t) => { const el = document.querySelector(`[data-total="${t.k}"]`); const mins = sp[t.k] * t.unit; el.innerHTML = `${dur(mins)}<small>${t.k === "extra" ? "counted as entered" : `${amt(sp[t.k])} × ${t.unit} min`}</small>`; });
    const timer = sp.d * 1440 + sp.h * 60 + sp.m;
    const r = C.speedups.calc({ one: sp.one, five: sp.five, sixty: sp.sixty, extra: sp.extra, timer });
    const covered = timer ? r.covered : 0; const pct = Math.round(covered * 100);
    const cells = Array.from({ length: 10 }, (_, i) => { const fill = Math.max(0, Math.min(1, covered * 10 - i)); return `<i class="${fill >= 1 ? "on" : fill > 0 ? "part" : ""}" style="--p:${Math.round(fill * 100)}%"></i>`; }).join("");
    const hours = Math.ceil(r.shortMinutes / 60), fives = Math.ceil(r.shortMinutes / 5);
    $("cost").innerHTML = `
      <h2 class="sheet-title">Loadout cost</h2>
      <div class="row"><span class="lbl">Speedups available</span><div class="big" id="spAvail">${dur(r.totalMinutes)}</div></div>
      <div class="row"><span class="lbl">Timer to clear</span><div class="big" id="spTimer">${timer ? dur(timer) : "0m"}</div></div>
      <div class="row"><span class="lbl">Covered</span><div class="covered" role="img" aria-label="${pct} percent covered">${cells}</div><div class="items"><strong id="spPct">${pct}%</strong> of the timer</div></div>
      ${r.shortMinutes > 0
        ? `<div class="state">Still needed ${dur(r.shortMinutes)}</div><p class="items" id="spItems">That is <strong>${amt(hours)} more 1-hour items</strong>, or ${amt(fives)} 5-minute items.</p>`
        : `<div class="state ok">${timer ? "Covered" : "Enter a timer"}</div><p class="items" id="spItems">${timer ? `${dur(r.totalMinutes - timer)} of speedups left over.` : "Add the days, hours and minutes shown on the upgrade."}</p>`}
      <p class="items" id="spText" hidden>${esc(r.text)}</p>`;
    store.set(SP_KEY, sp);
  }
  $("spGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-step]"); if (!b) return;
    const k = b.dataset.step; sp[k] = Math.max(0, num(sp[k]) + Number(b.dataset.d));
    document.querySelector(`[data-sp="${k}"]`).value = sp[k]; computeSpeedups();
  });
  document.addEventListener("input", (e) => {
    const k = e.target.dataset.sp; if (!k) return;
    sp[k] = num(e.target.value); computeSpeedups();
  });
  $("spPreset").addEventListener("click", () => { sp = presetSp(); renderSpeedups(); say("Example loaded"); });
  $("spReset").addEventListener("click", () => { sp = spZero(); renderSpeedups(); say("Speedups cleared"); });

  /* ---------- research: blueprint card ---------- */
  const RB_KEY = "d7-research";
  const RES = [["wood", "Wood"], ["iron", "Iron"], ["electricity", "Electricity"], ["coin", "Coin"], ["badges", "Badges"], ["minutes", "Minutes"]];
  const rbZero = () => ({ steps: [[0, 0, 0, 0, 0, 0]], speed: 0, discount: 0, speedups: 0 });
  const presetRb = () => { const p = C.research.preset; return { steps: p.steps.map((s) => [...s]), speed: p.speed, discount: p.discount, speedups: p.speedups }; };
  let rb = store.get(RB_KEY, null) ? Object.assign(rbZero(), store.get(RB_KEY, {})) : presetRb();
  if (!Array.isArray(rb.steps) || !rb.steps.length) rb.steps = [[0, 0, 0, 0, 0, 0]];

  function renderResearch() {
    $("rbSub").textContent = "One row per research step with base values. Speed bonus shortens the time; the resource reduction does not apply to badges.";
    $("rbTable").innerHTML = `
      <div class="rb-head"><span>Step</span>${RES.map(([k, l]) => `<span class="res res-${k}">${k === "minutes" ? pict("speedup") : pict(k)}<span>${l}</span></span>`).join("")}<span></span></div>
      ${rb.steps.map((s, i) => `<div class="rb-row">
        <span class="n">${i + 1}</span>
        ${RES.map(([k, l], j) => `<label class="well" data-res="${l}"><span class="vh">Step ${i + 1} ${l}</span><input data-step="${i}" data-col="${j}" type="text" inputmode="numeric" value="${s[j]}" autocomplete="off"></label>`).join("")}
        <button type="button" class="remove" data-remove="${i}" aria-label="Remove step ${i + 1}" ${rb.steps.length === 1 ? "disabled" : ""}>×</button>
      </div>`).join("")}`;
    $("rbParams").innerHTML = `
      <div class="actions"><button type="button" class="btn quiet" id="rbAdd">Add step</button></div>
      ${[["speed", "Research speed bonus", "%"], ["discount", "Resource reduction", "%"], ["speedups", "Speedups available", "min"]].map(([k, l, u]) => `
        <label class="fld"><span>${l}</span><span class="well"><input data-rb="${k}" type="text" inputmode="numeric" value="${rb[k]}" autocomplete="off"><span class="unit">${u}</span></span></label>`).join("")}
      <div class="actions"><button type="button" class="btn quiet" id="rbPreset">Load example</button><button type="button" class="btn quiet" id="rbReset">Reset</button></div>`;
    $("rbAdd").addEventListener("click", () => { rb.steps.push([0, 0, 0, 0, 0, 0]); renderResearch(); document.querySelector(`[data-step="${rb.steps.length - 1}"][data-col="0"]`)?.focus(); });
    $("rbPreset").addEventListener("click", () => { rb = presetRb(); renderResearch(); say("Example loaded"); });
    $("rbReset").addEventListener("click", () => { rb = rbZero(); renderResearch(); say("Research cleared"); });
    computeResearch();
  }
  function computeResearch() {
    const r = C.research.calc(rb);
    $("rbResult").innerHTML = `
      <h3>Estimated cost</h3>
      <div class="res-cells">${["wood", "iron", "electricity", "coin", "badges"].map((k) => `<div class="res-cell res-${k}">${pict(k)}<span><b data-res="${k}">${amt(r[k])}</b><small>${k}</small></span></div>`).join("")}</div>
      <div class="res-time">
        <div><span class="lbl">Time</span><span class="big" id="rbTime">${dur(r.timeMinutes)}</span></div>
        <div><span class="lbl">After speedups</span><span class="big" id="rbAfter">${dur(r.afterMinutes)}</span></div>
        <div><span class="lbl">Steps</span><span class="big">${rb.steps.length}</span></div>
      </div>`;
    store.set(RB_KEY, rb);
  }
  $("rbTable").addEventListener("click", (e) => {
    const b = e.target.closest("[data-remove]"); if (!b) return;
    rb.steps.splice(Number(b.dataset.remove), 1); if (!rb.steps.length) rb.steps.push([0, 0, 0, 0, 0, 0]); renderResearch();
  });
  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.step != null) { rb.steps[Number(t.dataset.step)][Number(t.dataset.col)] = num(t.value); computeResearch(); }
    else if (t.dataset.rb) { rb[t.dataset.rb] = num(t.value); computeResearch(); }
  });

  /* ---------- compact three ---------- */
  const CC = {
    goal: { den: "var(--steel)", key: "d7-goal", fields: [["owned", "In storage"], ["target", "Target"], ["rate", "Net gain per hour"]],
      out: (r) => r.remaining === 0 ? `<div class="big">Target reached</div>` : `<div class="lbl">Still needed</div><div class="big">${amt(r.remaining)}</div><div class="sub">${r.etaMinutes ? `ETA ${dur(r.etaMinutes)}` : "Add a positive rate for an ETA."}</div>` },
    crystals: { den: "var(--crystal)", key: "d7-crystals", fields: [["regularCount", "Regular Mines"], ["regularPayout", "Payout per Mine"], ["boostedCount", "Boosted Mines"], ["boostedPayout", "Payout per boosted"], ["passCount", "Passes"], ["passPayout", "Payout per Pass"]],
      out: (r) => `<div class="lbl">At Monday settlement</div><div class="big">${amt(r.total)}</div><div class="sub">${amt(r.regular)} regular, ${amt(r.boosted)} boosted, ${amt(r.passes)} from Passes</div>` },
    capture: { den: "var(--moss)", key: "d7-capture", fields: [["progress", "Current progress %"], ["full", "Full capture time (min)"]],
      out: (r) => `<div class="lbl">Further uninterrupted control</div><div class="big">About ${dur(r.leftMinutes)}</div><div class="sub">Ownership locks until the next day once the meter hits 100%.</div>` }
  };
  const ccState = {};
  function ccZero(id) { const z = {}; CC[id].fields.forEach(([k]) => { z[k] = 0; }); if (id === "capture") z.full = 30; return z; }
  Object.keys(CC).forEach((id) => { const saved = store.get(CC[id].key, null); ccState[id] = saved ? Object.assign(ccZero(id), saved) : { ...C[id].preset }; });
  function renderCompact() {
    $("compact").innerHTML = Object.keys(CC).map((id) => `
      <article class="cc plate" id="${id}" aria-labelledby="${id}T" style="--den:${CC[id].den}"><div class="in">
        <h2 id="${id}T">${esc(C[id].title)}</h2>
        <p>${esc(C[id].description)}</p>
        <div class="fields">${CC[id].fields.map(([k, l]) => `<label class="fld"><span>${l}</span><span class="well"><input data-cc="${id}" data-k="${k}" type="text" inputmode="numeric" value="${ccState[id][k]}" autocomplete="off"></span></label>`).join("")}</div>
        <div class="out" data-out="${id}" aria-live="polite"></div>
        <div class="actions"><button type="button" class="btn quiet" data-ccpreset="${id}">Load example</button><button type="button" class="btn quiet" data-ccreset="${id}">Reset</button></div>
      </div></article>`).join("");
    Object.keys(CC).forEach(computeCompact);
  }
  function computeCompact(id) {
    const r = C[id].calc(ccState[id]);
    document.querySelector(`[data-out="${id}"]`).innerHTML = CC[id].out(r);
    store.set(CC[id].key, ccState[id]);
  }
  document.addEventListener("input", (e) => { const id = e.target.dataset.cc; if (!id) return; ccState[id][e.target.dataset.k] = num(e.target.value); computeCompact(id); });
  document.addEventListener("click", (e) => {
    const p = e.target.closest("[data-ccpreset]"), r = e.target.closest("[data-ccreset]");
    if (p) { ccState[p.dataset.ccpreset] = { ...C[p.dataset.ccpreset].preset }; renderCompact(); say("Example loaded"); }
    if (r) { ccState[r.dataset.ccreset] = ccZero(r.dataset.ccreset); renderCompact(); }
  });

  /* ---------- external ---------- */
  $("ext").innerHTML = HQ.externalTools.map((t) => `<a href="${t.url}" target="_blank" rel="noopener"><b>${esc(t.title)}</b><span>${esc(t.note)}</span><small>atlantisdws.com, opens in a new tab</small></a>`).join("");

  function renderAll() {
    document.title = `Calculators. ${D7.A.brand} (d7 Armory Grid)`;
    renderSpeedups(); renderResearch(); renderCompact();
    $("foot").innerHTML = D7.footer(`<p class="footnote">Calculator formulas match the live sites. Values you enter stay in this browser.</p>`);
  }
  document.addEventListener("d7:alliance", renderAll);
})();
