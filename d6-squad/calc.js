/* d6 Squad Select — calculators. Maths from HQ.calculators; rendering here. */
(function () {
  "use strict";
  const { esc, icon } = D6;
  const $ = id => document.getElementById(id);
  const C = HQ.calculators;
  const KEY = "d6-calc";
  const num = v => Math.max(0, Math.floor(Number(String(v).replace(/[^\d.]/g, "")) || 0));
  const row = (k, v, cls = "", ic = "") => `<div class="row"><span class="k">${ic}${k}</span><span class="v ${cls}">${v}</span></div>`;
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { store = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* storage unavailable: keep working */ } };

  /* ---------- pick strip ---------- */
  const picks = [["speedups", "clock", "Speedups"], ["research", "research", "Research"], ["goal", "goal", "Resource goal"], ["crystals", "crystal", "Weekly crystals"], ["capture", "capture", "Capture"]];
  $("pick").innerHTML = picks.map(([id, g, label], i) => `<a href="#${id}" aria-current="${i === 0}"><span class="cell">${icon(g)}</span><span>${label}</span></a>`).join("");
  $("pick").addEventListener("click", e => {
    const a = e.target.closest("a"); if (!a) return;
    $("pick").querySelectorAll("a").forEach(x => x.setAttribute("aria-current", String(x === a)));
  });

  /* ---------- speedups ---------- */
  const denoms = [["one", "1-minute items", "1m", 1], ["five", "5-minute items", "5m", 5], ["sixty", "1-hour items", "1h", 60], ["extra", "Other speedups, minutes", "min", 1]];
  $("loadout").innerHTML = denoms.map(([name, label, denom]) => `
    <div class="item">
      <span class="cell">${icon("clock")}<span class="denom">${denom}</span></span>
      <label class="item-name" for="sp-${name}">${label}</label>
      <div class="stepper">
        <button type="button" data-step="-1" data-for="${name}" aria-label="One fewer ${label}">−</button>
        <input id="sp-${name}" name="${name}" inputmode="numeric" pattern="[0-9]*" value="0">
        <button type="button" data-step="1" data-for="${name}" aria-label="One more ${label}">+</button>
      </div>
      <span class="gives" data-gives="${name}"></span>
    </div>`).join("");
  const spForm = $("spForm");
  const spValues = () => {
    const f = new FormData(spForm), g = k => num(f.get(k));
    return { one: g("one"), five: g("five"), sixty: g("sixty"), extra: g("extra"), d: g("d"), h: g("h"), m: g("m") };
  };
  function setSp(v) { Object.entries(v).forEach(([k, val]) => { const el = spForm.elements[k]; if (el) el.value = val; }); }
  function renderSp() {
    const v = spValues();
    store.speedups = v; save();
    const timer = v.d * 1440 + v.h * 60 + v.m;
    const r = C.speedups.calc({ one: v.one, five: v.five, sixty: v.sixty, extra: v.extra, timer });
    denoms.forEach(([name, , , unit]) => { const mins = v[name] * unit; spForm.querySelector(`[data-gives="${name}"]`).textContent = mins ? HQ.duration(mins) : ""; });
    const pct = Math.round(r.covered * 100);
    const hours = Math.ceil(r.shortMinutes / 60), fives = Math.ceil(r.shortMinutes / 5);
    const spare = r.totalMinutes - r.timerMinutes;
    const outcome = !timer
      ? row("Still needed", "Set the timer", "")
      : r.shortMinutes > 0
        ? row("Still needed", HQ.duration(r.shortMinutes), "big lamp") + `<div class="row note">That is ${hours} more 1-hour item${hours === 1 ? "" : "s"}, or ${fives} five-minute items.</div>`
        : row("Covered", spare > 0 ? `${HQ.duration(spare)} to spare` : "Exactly", "big") + `<div class="row note">Your speedups finish this upgrade now.</div>`;
    $("spResult").innerHTML =
      row("Available", HQ.duration(r.totalMinutes), "", icon("clock")) +
      row("Upgrade timer", timer ? HQ.duration(timer) : "0m") +
      row("Covered", timer ? `${pct}%` : "100%") +
      outcome;
  }
  spForm.addEventListener("input", renderSp);
  spForm.addEventListener("click", e => {
    const b = e.target.closest("[data-step]"); if (!b) return;
    const el = spForm.elements[b.dataset.for];
    el.value = Math.max(0, num(el.value) + Number(b.dataset.step));
    renderSp();
  });
  const spPreset = () => { const p = C.speedups.preset; return { one: p.one, five: p.five, sixty: p.sixty, extra: p.extra, d: Math.floor(p.timer / 1440), h: Math.floor((p.timer % 1440) / 60), m: p.timer % 60 }; };
  const spEmpty = { one: 0, five: 0, sixty: 0, extra: 0, d: 0, h: 0, m: 0 };

  /* ---------- research ---------- */
  const cols = [["wood", "Wood"], ["iron", "Iron"], ["electricity", "Electricity"], ["coin", "Coin"], ["badge", "Badges"], ["clock", "Minutes"]];
  const rsForm = $("rsForm");
  let steps = [];
  function renderSteps() {
    $("steps").innerHTML = `<div class="step-head" aria-hidden="true"><span></span>${cols.map(([g, l]) => `<span class="col">${icon(g)}<span>${l}</span></span>`).join("")}<span></span></div>` +
      steps.map((s, i) => `<div class="step" data-i="${i}">
        <span class="n" aria-hidden="true">${i + 1}</span>
        ${cols.map(([g, l], j) => `<label class="field"><span class="sr">Step ${i + 1} ${l}</span><input inputmode="numeric" pattern="[0-9]*" data-col="${j}" value="${s[j]}"></label>`).join("")}
        <button type="button" class="remove" data-remove="${i}" aria-label="Remove step ${i + 1}" ${steps.length === 1 ? "disabled" : ""}>×</button>
      </div>`).join("");
  }
  function readSteps() {
    steps = [...$("steps").querySelectorAll(".step")].map(el => [...el.querySelectorAll("input")].map(i => num(i.value)));
  }
  function renderRs() {
    const f = new FormData(rsForm), g = k => num(f.get(k));
    const mods = { speed: g("speed"), discount: g("discount"), speedups: g("speedups") };
    store.research = { steps, ...mods }; save();
    const r = C.research.calc({ steps, ...mods });
    $("rsResult").innerHTML =
      row("Wood", HQ.amount(r.wood), "", icon("wood")) +
      row("Iron", HQ.amount(r.iron), "", icon("iron")) +
      row("Electricity", HQ.amount(r.electricity), "", icon("electricity")) +
      row("Coin", HQ.amount(r.coin), "", icon("coin")) +
      row("Badges", HQ.amount(r.badges), "", icon("badge")) +
      `<div class="row sum"><span class="k">${icon("clock")}Time</span><span class="v">${HQ.duration(r.timeMinutes)}</span></div>` +
      row("After speedups", HQ.duration(r.afterMinutes), "big lamp") +
      `<div class="row note">${steps.length} step${steps.length === 1 ? "" : "s"}${mods.discount ? `, ${mods.discount}% off wood, iron, electricity and coin` : ""}${mods.speed ? `, ${mods.speed}% research speed` : ""}.</div>`;
  }
  rsForm.addEventListener("input", e => { if (e.target.closest(".step")) readSteps(); renderRs(); });
  rsForm.addEventListener("click", e => {
    const rm = e.target.closest("[data-remove]");
    if (rm) { readSteps(); steps.splice(Number(rm.dataset.remove), 1); renderSteps(); renderRs(); }
  });
  function setRs(v) {
    steps = v.steps.map(s => [...s]);
    renderSteps();
    ["speed", "discount", "speedups"].forEach(k => { rsForm.elements[k].value = v[k]; });
    renderRs();
  }
  const rsEmpty = { steps: [[0, 0, 0, 0, 0, 0]], speed: 0, discount: 0, speedups: 0 };

  /* ---------- the compact three ---------- */
  const goalForm = $("goalForm"), cryForm = $("cryForm"), capForm = $("capForm");
  const vals = form => Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, num(v)]));
  function renderGoal() {
    const v = vals(goalForm), r = C.goal.calc(v);
    $("goalResult").innerHTML = !r.remaining
      ? row("Target", "Reached", "big")
      : row("Still needed", HQ.amount(r.remaining), "", icon("goal")) + (r.etaMinutes != null ? row("Time at this rate", HQ.duration(r.etaMinutes), "big lamp") : `<div class="row note">Add a positive rate for a time.</div>`);
  }
  function renderCry() {
    const v = vals(cryForm), r = C.crystals.calc(v);
    $("cryResult").innerHTML = row("Regular Mines", HQ.amount(r.regular)) + row("Boosted Mines", HQ.amount(r.boosted)) + row("Passes", HQ.amount(r.passes)) +
      `<div class="row sum"><span class="k">${icon("crystal")}At settlement</span><span class="v big lamp">${HQ.amount(r.total)}</span></div>`;
  }
  function renderCap() {
    const v = vals(capForm), r = C.capture.calc({ progress: Math.min(100, v.progress), full: v.full });
    $("capResult").innerHTML = row("Uninterrupted control still needed", HQ.duration(r.leftMinutes), "big lamp", icon("capture"));
  }
  goalForm.addEventListener("input", renderGoal);
  cryForm.addEventListener("input", renderCry);
  capForm.addEventListener("input", renderCap);

  /* ---------- buttons ---------- */
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const act = b.dataset.act;
    if (act === "sp-example") { setSp(spPreset()); renderSp(); }
    if (act === "sp-reset") { setSp(spEmpty); renderSp(); }
    if (act === "rs-example") setRs(C.research.preset);
    if (act === "rs-reset") setRs(rsEmpty);
    if (act === "rs-add") { readSteps(); steps.push([0, 0, 0, 0, 0, 0]); renderSteps(); renderRs(); $("steps").querySelector(".step:last-child input").focus(); }
  });

  /* ---------- external tools ---------- */
  $("tools").innerHTML = HQ.externalTools.map(t => `<li>
    <a href="${t.url}" target="_blank" rel="noopener">${esc(t.title)}<span class="sr"> (opens in a new tab)</span></a>
    <span class="note">${esc(t.note)}</span>
  </li>`).join("");

  /* ---------- boot ---------- */
  D6.buildLang();
  document.addEventListener("hq:alliance", () => { const { A } = D6.applyAlliance(); document.title = `Calculators, ${A.brand}`; });
  HQ.init();
  // First visit shows the worked example so the loadout reads as a loadout; after that, whatever you typed.
  setSp(store.speedups && typeof store.speedups === "object" ? { ...spEmpty, ...store.speedups } : spPreset());
  renderSp();
  setRs(store.research && Array.isArray(store.research.steps) && store.research.steps.length ? store.research : C.research.preset);
  renderGoal(); renderCry(); renderCap();
})();
